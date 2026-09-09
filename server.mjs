import http from 'node:http';
let fetchListener=null;
globalThis.addEventListener=(type,listener)=>{if(type==='fetch')fetchListener=listener};
await import('./network-worker.mjs');
if(!fetchListener)throw new Error('RankRent network fetch handler did not initialize.');
const port=Number(process.env.PORT||10000);
const server=http.createServer(async(req,res)=>{
  try{
    if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});return res.end(JSON.stringify({ok:true,mode:'rankrent-render-network'}));}
    if(!['GET','HEAD'].includes(req.method||'GET')){res.writeHead(405,{'content-type':'text/plain;charset=utf-8'});return res.end('Method not allowed');}
    const host=String(req.headers.host||'localhost');
    const headers=new Headers();for(const [k,v] of Object.entries(req.headers)){if(Array.isArray(v))for(const x of v)headers.append(k,x);else if(v!=null)headers.set(k,String(v));}
    const request=new Request('https://'+host+(req.url||'/'),{method:req.method,headers});
    let responsePromise=null;fetchListener({request,respondWith(value){responsePromise=Promise.resolve(value)}});
    const response=await responsePromise;if(!response)throw new Error('No response returned by RankRent router.');
    res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));
    if(req.method==='HEAD'){res.end();return;}const bytes=Buffer.from(await response.arrayBuffer());res.end(bytes);
  }catch(error){console.error(error);res.writeHead(500,{'content-type':'text/plain;charset=utf-8'});res.end('Server error');}
});
server.listen(port,'0.0.0.0',()=>console.log('RankRent Render Network listening on 0.0.0.0:'+port));
