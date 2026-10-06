import React from 'react';
export const Tag=({src})=>{const c={DEMO:'bg-amber-100 text-amber-800',SIMULATED:'bg-violet-100 text-violet-800',REAL_GPS:'bg-emerald-100 text-emerald-800'}[src]||'bg-slate-100';
 return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{src==='SIMULATED'?'Simulated GPS':src==='DEMO'?'Demo data':'Real data'}</span>;};
export const Status=({s})=>{const m={ON_ROUTE:['🟢','On time'],DELAYED:['🟠','Delayed'],OFFLINE:['⚫','Offline']}[s]||['⚪',s||'Unknown'];return <span className="text-sm font-medium">{m[0]} {m[1]}</span>;};
export const Card=({children,className=''})=><div className={`bg-white rounded-2xl border border-slate-200 p-4 ${className}`}>{children}</div>;
export const Btn=({children,tone='blue',className='',...p})=><button {...p} className={`px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand ${tone==='blue'?'bg-brand text-white hover:bg-brand-dark':tone==='green'?'bg-brand-green text-white hover:opacity-90':'bg-slate-100 text-slate-800 hover:bg-slate-200'} ${className}`}>{children}</button>;
export const Err=({e})=>e?<div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 text-sm">{e}</div>:null;
