import {Router,type Request,type RequestHandler} from 'express';
import {capabilities,validateProfile,type ApplicationState} from './domain';
import type {SpecialistRepository} from './repository';
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const states=['DRAFT','SUBMITTED','PENDING_VERIFICATION','APPROVED','REJECTED','SUSPENDED','REVOKED','EXPIRED'];
const codes:Record<string,number>={SIGN_IN_REQUIRED:401,ACCOUNT_CHANGED:409,NOT_FOUND:404,FORBIDDEN:403,
  SPECIALIST_SETUP_REQUIRED:503,
  POLICY_NOT_APPROVED:403,SELF_APPROVAL_DENIED:403,INVALID_PROFILE:400,INVALID_REQUEST:400,
  INVALID_DECISION:400,INVALID_TRANSITION:409,REVISION_CONFLICT:409,IDEMPOTENCY_CONFLICT:409,VERIFICATION_REQUIRED:422};
const endpoint=(fn:(req:Request,res:import('express').Response)=>Promise<void>):RequestHandler=>(req,res)=>{
  void fn(req,res).catch(error=>{
    const code=error instanceof Error?error.message:'';
    res.status(codes[code]??503).json({error:codes[code]?code:'SPECIALIST_UNAVAILABLE'});
  });
};
function exact(body:unknown,keys:string[]):body is Record<string,unknown>{return !!body&&typeof body==='object'&&!Array.isArray(body)
  &&Object.keys(body).sort().join(',')===keys.sort().join(',');}
export function specialistRouter(repository:SpecialistRepository|null,principal:(req:Request)=>{id:string}|null|undefined){
  const router=Router();
  router.use((req,_res,next)=> /^\/(?:account\/capabilities$|specialist\/applications(?:\/|$)|admin\/specialist-applications(?:\/|$))/.test(req.path)?next():next('router'));
  router.use((req,res,next)=>{
    res.set({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    const actor=principal(req);
    if(!actor){res.status(401).json({error:'SIGN_IN_REQUIRED'});return;}
    if(req.get('X-APIP-Account')!==actor.id){res.status(409).json({error:'ACCOUNT_CHANGED'});return;}
    if(!repository){res.status(503).json({error:'SPECIALIST_SETUP_REQUIRED',policyBlockers:['P02','P03','P11','P12','P13']});return;}
    next();
  });
  const actor=(req:Request)=>principal(req)!.id;
  const key=(req:Request)=>{const key=req.get('Idempotency-Key');if(!key||!uuid.test(key))throw Error('INVALID_REQUEST');return key;};
  const version=(body:Record<string,unknown>)=>{if(!Number.isSafeInteger(body.expectedVersion)||Number(body.expectedVersion)<1)throw Error('INVALID_REQUEST');return Number(body.expectedVersion);};
  router.get('/account/capabilities',endpoint(async(req,res)=>{
    const identity=await repository!.identity(actor(req));
    res.json({accountRole:identity.accountRole??null,...capabilities(identity.applicationState,identity.identityAdministrator,identity.validUntil),authorizationVersion:identity.authorizationVersion,validUntil:identity.validUntil});
  }));
  router.use((req,res,next)=>{
    void repository!.identity(actor(req)).then(identity=>{
      if(req.path.startsWith('/specialist/')&&identity.accountRole!=='SPECIALIST')res.status(403).json({error:'FORBIDDEN'});
      else if(req.path.startsWith('/admin/')&&!identity.identityAdministrator)res.status(403).json({error:'FORBIDDEN'});
      else next();
    }).catch(()=>res.status(503).json({error:'SPECIALIST_UNAVAILABLE'}));
  });
  router.get('/specialist/applications/current',endpoint(async(req,res)=>{res.json({application:await repository!.currentApplication(actor(req))});}));
  router.post('/specialist/applications',endpoint(async(req,res)=>{
    if(!exact(req.body,['profile']))throw Error('INVALID_REQUEST');
    res.status(201).json({application:await repository!.create(actor(req),validateProfile(req.body.profile),key(req))});
  }));
  router.post('/specialist/applications/:id/commands',endpoint(async(req,res)=>{
    if(!uuid.test(req.params.id)||!exact(req.body,['expectedVersion','command']))throw Error('INVALID_REQUEST');
    const c=req.body.command;
    if(exact(c,['type'])&&c.type==='submit'){
      res.json({application:await repository!.command(actor(req),req.params.id,version(req.body),{type:'submit'},key(req))});return;
    }
    if(!exact(c,['type','profile'])||c.type!=='save_draft')throw Error('INVALID_REQUEST');
    res.json({application:await repository!.command(actor(req),req.params.id,version(req.body),{type:'save_draft',profile:validateProfile(c.profile)},key(req))});
  }));
  router.get('/admin/specialist-applications',endpoint(async(req,res)=>{
    if(Object.keys(req.query).some(k=>!['state','limit','before'].includes(k)))throw Error('INVALID_REQUEST');
    const state=req.query.state,limit=req.query.limit??'25',before=req.query.before;
    if((state!==undefined&&(typeof state!=='string'||!states.includes(state)))||typeof limit!=='string'||!/^([1-9]|[1-4][0-9]|50)$/.test(limit)
      ||(before!==undefined&&(typeof before!=='string'||!uuid.test(before))))throw Error('INVALID_REQUEST');
    res.json({applications:await repository!.listForAdministrator(actor(req),state as ApplicationState|undefined,Number(limit),before as string|undefined)});
  }));
  router.get('/admin/specialist-applications/:id',endpoint(async(req,res)=>{
    if(!uuid.test(req.params.id))throw Error('INVALID_REQUEST');
    const application=await repository!.applicationForAdministrator(actor(req),req.params.id);
    if(!application)throw Error('NOT_FOUND');res.json({application});
  }));
  router.post('/admin/specialist-applications/:id/decisions',endpoint(async(req,res)=>{
    if(!uuid.test(req.params.id)||!exact(req.body,['expectedVersion','command']))throw Error('INVALID_REQUEST');
    const c=req.body.command;
    if(!exact(c,['action','reason','evidenceReference','policyVersion'])||Object.values(c).some(v=>typeof v!=='string'))throw Error('INVALID_REQUEST');
    res.json({application:await repository!.decide(actor(req),req.params.id,version(req.body),c as unknown as import('./repository').DecisionCommand,key(req))});
  }));
  return router;
}
