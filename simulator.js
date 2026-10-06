// SIMULATED GPS. To use real hardware: POST {busId,lat,lng,speed} to /api/gps (calls ingest()).
import {buses} from '../models/data.js';
import {getRoute,routeStops,cumulative} from './transit.js';
const SPEEDUP=12; // demo time compression
const state={};let timer=null,running=false,io=null;
function init(){buses.forEach((b,i)=>{if(state[b.id]&&b.id in state)return;
 const c=cumulative(getRoute(b.routeId));state[b.id]={pos:c.at(-1)*((i*0.17)%0.9),speed:0,lat:0,lng:0,status:'ON_ROUTE',online:true,source:'SIMULATED'};place(b);});}
function place(b){const r=getRoute(b.routeId),st=routeStops(r),c=cumulative(r),s=state[b.id];
 let i=c.findIndex((d,j)=>j>0&&d>=s.pos);if(i<0)i=c.length-1;
 const t=(s.pos-c[i-1])/Math.max(0.01,c[i]-c[i-1]);
 s.lat=st[i-1].lat+(st[i].lat-st[i-1].lat)*t;s.lng=st[i-1].lng+(st[i].lng-st[i-1].lng)*t;
 s.nextStop=st[i].name;s.remainingKm=+(c.at(-1)-s.pos).toFixed(1);s.etaMin=Math.round(s.remainingKm/45*60);s.stopIndex=i-1;}
export const snapshot=b=>{const s=state[b.id],r=getRoute(b.routeId);
 return {busId:b.id,busName:b.operator,route:r.name,routeId:r.id,latitude:s.lat,longitude:s.lng,speed:Math.round(s.speed),
  nextStop:s.nextStop,distanceRemainingKm:s.remainingKm,etaMin:s.etaMin,stopIndex:s.stopIndex,status:s.online?s.status:'OFFLINE',source:s.source};};
export const all=()=>buses.filter(b=>b.active&&state[b.id]).map(snapshot);
export function ingest({busId,lat,lng,speed}){const s=state[busId],b=buses.find(x=>x.id===busId);if(!s||!b)return;Object.assign(s,{lat,lng,speed,source:'REAL_GPS'});io?.emit('busLocationUpdate',snapshot(b));}
function tick(){for(const b of buses.filter(b=>b.active&&state[b.id])){const s=state[b.id],c=cumulative(getRoute(b.routeId)).at(-1);
 if(s.source==='REAL_GPS')continue;
 s.speed=38+Math.random()*16;s.pos+=s.speed*SPEEDUP*2/3600;if(s.pos>=c)s.pos=0;s.status=s.speed<42?'DELAYED':'ON_ROUTE';place(b);
 io.emit('busLocationUpdate',snapshot(b));io.emit('busStatusUpdate',{busId:b.id,status:s.status});io.emit('busArrivalUpdate',{busId:b.id,nextStop:s.nextStop,etaMin:s.etaMin});}}
export function control(cmd){
 if(cmd==='start'&&!running){running=true;timer=setInterval(tick,2000);}
 if(cmd==='pause'||cmd==='stop'){running=false;clearInterval(timer);if(cmd==='stop')Object.values(state).forEach(s=>s.speed=0);}
 if(cmd==='reset'){Object.keys(state).forEach(k=>delete state[k]);init();io.emit('snapshot',all());}
 return {running};}
export function attach(server){io=server;init();control('start');}
