import { Router, type Request } from 'express';
import { caseCard } from '../../src/features/adr/cases/contracts';
import { decodeCursor, encodeCursor, parseCaseFilters } from './caseQuery';
import type { GuidedCaseRepository } from './repository';
import { createPdfService } from './pdf';
import { endpoint } from './guided';

export function casesRouter(repository: GuidedCaseRepository, readUser:(req:Request)=>{id:string}|null|undefined,
  revalidate=(req:Request,owner:string):boolean|Promise<boolean>=>readUser(req)?.id===owner) {
  const router=Router(),pdf=createPdfService();
  router.use((req,res,next)=>{
    res.set({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    const user=readUser(req);
    if(!user){res.status(401).json({error:'SIGN_IN_REQUIRED'});return;}
    if(req.get('X-APIP-Account')!==user.id){res.status(409).json({error:'ACCOUNT_CHANGED'});return;}
    next();
  });
  const owner=(req:Request)=>readUser(req)!.id;
  const load=async(user:string,id:string)=>{
    const c=await repository.load(user,id);
    if(!c)throw Error('NOT_FOUND');
    return c;
  };
  const positive=(value:unknown,max:number)=>{
    if(typeof value!=='string'||!/^\d{1,3}$/.test(value)||Number(value)<1||Number(value)>max)throw Error('INVALID_PAGE');
    return Number(value);
  };
  router.get('/',endpoint(async(req,res)=>{
    const user=owner(req),f=parseCaseFilters(req.query),position=decodeCursor(user,f,req.query.cursor);
    const rows=await repository.search(user,f,position),cases=rows.slice(0,f.limit),last=cases.at(-1);
    res.json({cases,nextCursor:rows.length>f.limit&&last?encodeCursor(user,f,
      {at:f.sort==='created'?last.createdAt:last.updatedAt,id:last.id}):null});
  }));
  router.get('/:id',endpoint(async(req,res)=>{
    const user=owner(req),c=await load(user,req.params.id),first=await repository.snapshot(user,c.id,1);
    res.json({case:c,summary:caseCard(c,first?.updatedAt??c.updatedAt),readOnly:false,
      capabilities:{markReady:false,archive:false,restore:false,deletionRequest:false},
      policyBlockers:['P01','P08','P09','P17']});
  }));
  router.get('/:id/revisions',endpoint(async(req,res)=>{
    const user=owner(req);
    await load(user,req.params.id);
    if(Object.keys(req.query).some(k=>!['limit','before'].includes(k)))throw Error('INVALID_PAGE');
    const limit=positive(req.query.limit??'25',50),before=positive(req.query.before??'501',501);
    const rows=await repository.revisions(user,req.params.id,limit+1,before),versions=rows.slice(0,limit);
    res.json({versions,nextBefore:rows.length>limit?versions.at(-1)!.revision:null});
  }));
  router.get('/:id/revisions/:revision',endpoint(async(req,res)=>{
    const user=owner(req),revision=positive(req.params.revision,500);
    const c=await repository.snapshot(user,req.params.id,revision);
    if(!c)throw Error('NOT_FOUND');
    res.json({case:c,savedAt:c.updatedAt,readOnly:true});
  }));
  router.post('/:id/revisions/:revision/pdf',endpoint(async(req,res)=>{
    if(!req.body||Object.keys(req.body).length)throw Error('INVALID_COMMAND');
    const user=owner(req),revision=positive(req.params.revision,500);
    const c=await repository.snapshot(user,req.params.id,revision);
    if(!c)throw Error('NOT_FOUND');
    const bytes=await pdf.generate(c);
    if(!await revalidate(req,user))throw Error('SIGN_IN_REQUIRED');
    if(!await repository.snapshot(user,c.id,revision))throw Error('NOT_FOUND');
    await repository.recordHistoricalExport?.(user,c.id,revision,bytes);
    if(!await revalidate(req,user))throw Error('SIGN_IN_REQUIRED');
    res.set({'Content-Type':'application/pdf','X-APIP-Revision':String(revision),
      'Content-Disposition':`attachment; filename="APIP-PvPI-${c.id}-r${revision}.pdf"`});
    res.send(bytes);
  }));
  for(const path of ['/:id/lifecycle','/:id/deletion-requests']) router.post(path,endpoint(async(req)=>{
    await load(owner(req),req.params.id);
    throw Error('POLICY_NOT_APPROVED');
  }));
  return router;
}
