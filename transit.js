import {stations,routes,buses} from '../models/data.js';
import {km,ROAD} from './geo.js';
import {calcFare} from './fare.js';
const st=id=>stations.find(s=>s.id===id);
const AVG=45,MINCH=10; // avg km/h incl. stops; minimum minutes to change buses
export const getRoute=id=>routes.find(r=>r.id===id);
export const routeStops=r=>r.stops.map(st);
export function cumulative(r){let d=0;return routeStops(r).map((s,i,a)=>(i&&(d+=km(a[i-1],s)*ROAD),+d.toFixed(1)));}
export const mins=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(Math.round(m%60)).padStart(2,'0')}`;
const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes();};
const stopTimes=b=>{const c=cumulative(getRoute(b.routeId));return getRoute(b.routeId).stops.map((id,i)=>({id,t:b.departMin+c[i]/AVG*60,km:c[i]}));};
const dayStr=(d,add)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+add);return x.toISOString().slice(0,10);};
const findSt=q=>{q=String(q||'').toLowerCase().trim();return q&&stations.find(s=>s.id===q||s.name.toLowerCase().includes(q));};
export function nearbyStations(lat,lng,limit=5){
 return stations.map(s=>{const served=buses.filter(b=>b.active&&getRoute(b.routeId).stops.includes(s.id));
  const next=served.map(b=>b.departMin).filter(t=>t>=nowMin()).sort((a,b)=>a-b)[0];
  return {...s,distanceKm:+km({lat,lng},s).toFixed(1),buses:served.length,nextBus:next!=null?mins(next):null};})
 .sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,limit);
}
// fare/time for one bus between two of its stops (used by bookings)
export function legInfo(b,fromId,toId){const ts=stopTimes(b),i=ts.findIndex(x=>x.id===fromId),j=ts.findIndex(x=>x.id===toId);
 if(i<0||j<=i)return null;const k=+(ts[j].km-ts[i].km).toFixed(1);
 return {km:k,fare:calcFare(k,b.fareRule).fare,departure:mins(ts[i].t),arrival:mins(ts[j].t),fromName:st(fromId).name,toName:st(toId).name,route:getRoute(b.routeId).name};}
function mkLeg(b,ts,i,j,sh,date){const dep=ts[i].t+sh,arr=ts[j].t+sh,k=+(ts[j].km-ts[i].km).toFixed(1);
 return {busId:b.id,operator:b.operator,routeName:getRoute(b.routeId).name,from:st(ts[i].id),to:st(ts[j].id),dep,arr,date:dayStr(date,Math.floor(dep/1440)),
  km:k,fare:calcFare(k,b.fareRule).fare,stops:j-i,departure:mins(dep),arrival:mins(arr)};}
// Earliest-arrival search: direct buses, then up to 2 changes (3 buses). Each change needs MINCH minutes.
function plan(o,d,start,date){const act=buses.filter(b=>b.active),T=Object.fromEntries(act.map(b=>[b.id,stopTimes(b)])),out=[];
 let best={[o]:{arr:start,legs:[]}},frontier=best,bestDest=Infinity;
 const shift=(ready,t)=>Math.max(0,Math.ceil((ready-t)/1440))*1440;
 for(const b of act){const ts=T[b.id],i=ts.findIndex(x=>x.id===o),j=ts.findIndex(x=>x.id===d);if(i<0||j<=i)continue;
  const l=mkLeg(b,ts,i,j,shift(start,ts[i].t),date);out.push([l]);bestDest=Math.min(bestDest,l.arr);}
 for(let k=1;k<=3;k++){const next={};
  for(const [sid,s] of Object.entries(frontier)){const ready=s.arr+(s.legs.length?MINCH:0);
   for(const b of act){const ts=T[b.id],i=ts.findIndex(x=>x.id===sid);if(i<0)continue;const sh=shift(ready,ts[i].t);
    for(let j=i+1;j<ts.length;j++){const id=ts[j].id,arr=ts[j].t+sh;
     if(s.legs.some(l=>l.from.id===id)||id===o)continue;
     if((!next[id]||arr<next[id].arr)&&(!best[id]||arr<best[id].arr))next[id]={arr,legs:[...s.legs,mkLeg(b,ts,i,j,sh,date)]};}}}
  Object.assign(best,next);frontier=next;
  if(k>1&&next[d]&&next[d].arr<bestDest){out.push(next[d].legs);bestDest=next[d].arr;}}
 return out;}
export function recommend({lat,lng,from,destination,time,date}){
 const dest=findSt(destination);if(!dest)return {error:'INVALID_DESTINATION'};
 const nm=time??nowMin(),day=date||new Date().toISOString().slice(0,10);let origins;
 if(from){const f=findSt(from);if(!f)return {error:'INVALID_ORIGIN'};origins=[{s:f,d:0}];}
 else origins=stations.map(s=>({s,d:km({lat,lng},s)})).sort((a,b)=>a.d-b.d).slice(0,3);
 origins=origins.filter(o=>o.s.id!==dest.id);if(!origins.length)return {error:'SAME_STATION'};
 const js=[],seen=new Set();
 for(const o of origins)for(const legs of plan(o.s.id,dest.id,nm,day)){
  const key=legs.map(l=>l.busId).join('>');if(seen.has(key))continue;seen.add(key);
  const f=legs[0],l=legs.at(-1),fare=legs.reduce((a,x)=>a+x.fare,0);
  const changes=legs.slice(1).map((x,i)=>({at:x.from.name,waitMin:Math.round(x.dep-legs[i].arr)}));
  js.push({busId:f.busId,legs,boardAt:o.s,distanceToStationKm:+o.d.toFixed(1),departure:f.departure,departAbs:f.dep,
   arrival:l.arrival+(l.arr>=1440?' (+1 day)':''),durationMin:Math.round(l.arr-f.dep),distanceKm:+legs.reduce((a,x)=>a+x.km,0).toFixed(1),
   fare,fareEstimated:true,transfers:legs.length-1,changes,waitMin:Math.round(f.dep-nm),
   score:+((l.arr-nm)*0.5+fare*0.1+(legs.length-1)*25+o.d*8).toFixed(1),
   reason:legs.length>1?`No direct bus. Change at ${changes.map(c=>c.at).join(' and ')}.`:'Best option based on distance to station, departure time, ETA and fare.'});}
 if(!js.length)return {error:'NO_BUSES',destination:dest};
 js.sort((a,b)=>a.score-b.score);
 return {destination:dest,best:js[0],alternatives:js.slice(1,4),journeys:js.slice(0,6),dataSource:'DEMO'};
}
