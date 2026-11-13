import net from 'node:net';import tls from 'node:tls';import {X509Certificate} from 'node:crypto';
export function probePostgresTls(host,port,ca){return new Promise((resolve,reject)=>{
 const socket=net.connect({host,port});let secure;
 const timer=setTimeout(()=>{socket.destroy();secure?.destroy();reject(Error('TLS_PROBE_TIMEOUT'));},10000);
 const fail=()=>{clearTimeout(timer);socket.destroy();secure?.destroy();reject(Error('TLS_PROBE_FAILED'));};
 socket.once('error',fail);
 socket.once('connect',()=>{const request=Buffer.alloc(8);request.writeInt32BE(8);request.writeInt32BE(80877103,4);socket.write(request);});
 socket.once('data',reply=>{if(reply.length!==1||reply[0]!==83){fail();return;}
  socket.removeListener('error',fail);secure=tls.connect({socket,servername:host,ca,rejectUnauthorized:true,minVersion:'TLSv1.2'});
  secure.once('error',fail);secure.once('secureConnect',()=>{
   const peer=secure.getPeerCertificate();
   if(!secure.authorized||tls.checkServerIdentity(host,peer)){fail();return;}
   clearTimeout(timer);const certificate=new X509Certificate(peer.raw);
   const evidence={authorized:true,hostnameVerified:true,host,port,protocol:secure.getProtocol(),certificate:{subject:certificate.subject,issuer:certificate.issuer,validTo:certificate.validTo,fingerprint256:certificate.fingerprint256}};
   secure.end();resolve(evidence);
  });
 });
});}
