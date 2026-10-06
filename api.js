export const API_URL=import.meta.env.VITE_API_URL??(import.meta.env.PROD?'':'http://localhost:4000'); // '' = same server as the website
export async function api(path,opts){let r;
 try{r=await fetch(API_URL+path,{headers:{'Content-Type':'application/json'},...opts,body:opts?.body&&JSON.stringify(opts.body)});}
 catch{throw Object.assign(new Error('Network error. Is the server running?'),{code:'NETWORK'});}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||'Request failed'),{code:j.error});return j;}
