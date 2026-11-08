// Private verification adapter: new static frontend, existing hosted API. No credentials.
import express from 'express';
import http from 'node:http';
import {resolve} from 'node:path';
const port=Number(process.env.APIP_CLOSURE_PORT||3602);
const backend=new URL(process.env.APIP_CLOSURE_BACKEND||'http://127.0.0.1:3601');
if(!Number.isInteger(port)||port<1024||port>65535||backend.protocol!=='http:'||backend.hostname!=='127.0.0.1'||backend.username||backend.password||backend.pathname!=='/')throw Error('Loopback verification configuration required');
const app=express();app.disable('x-powered-by');
app.use((req,res,next)=>{if(req.get('host')!==`127.0.0.1:${port}`){res.sendStatus(403);return;}next();});
app.use('/api',(req,res)=>{const upstream=http.request(new URL(req.originalUrl,backend),{method:req.method,headers:{...req.headers,host:backend.host}},reply=>{res.writeHead(reply.statusCode||502,reply.headers);reply.pipe(res);});upstream.setTimeout(30000,()=>upstream.destroy());upstream.on('error',()=>{if(!res.headersSent)res.status(503).json({error:'UPSTREAM_UNAVAILABLE'});else res.end();});req.on('aborted',()=>upstream.destroy());req.pipe(upstream);});
app.use(express.static(resolve('dist'),{index:'index.html'}));
app.listen(port,'127.0.0.1',()=>console.log(`Private frontend http://127.0.0.1:${port}/#/sign-in/patient; existing hosted API ${backend.origin}`));
