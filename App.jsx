import React,{useEffect,useMemo,useState} from 'react';
import {Bus,MapPin,Navigation,Search,Play,Pause,Square,RotateCcw,Trophy,Radio,Settings} from 'lucide-react';
import {api} from './services/api.js';
import {calculateRoute,getNearbyStations} from './services/googleMapsService.js';
import useLiveBuses from './hooks/useLiveBuses.js';
import MapView from './components/MapView.jsx';
import {Tag,Status,Card,Btn,Err} from './components/ui.jsx';
import Journeys from './components/Journeys.jsx';
import Booking from './components/Booking.jsx';
import MyBookings from './components/MyBookings.jsx';
const TABS=['Home','Search Buses','Live Buses','Stations','Routes','My Bookings','Admin','About'];
const toMin=t=>{const [h,m]=(t||'').split(':');return h?+h*60+ +m:undefined;};
const nowHM=()=>new Date().toTimeString().slice(0,5);

export default function App(){
 const [tab,setTab]=useState('Home'),{buses,online}=useLiveBuses();
 const live=useMemo(()=>Object.values(buses),[buses]);
 const [user,setUser]=useState(null),[near,setNear]=useState([]),[allSt,setAllSt]=useState([]),[routes,setRoutes]=useState([]);
 const [dest,setDest]=useState(''),[from,setFrom]=useState(''),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[book,setBook]=useState(null),[time,setTime]=useState(nowHM()),[res,setRes]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const [tracked,setTracked]=useState(null),[trackInfo,setTrackInfo]=useState(null),[path,setPath]=useState(null),[toStation,setToStation]=useState(null);
 useEffect(()=>{api('/api/stations').then(setAllSt).catch(e=>setErr(e.message));api('/api/routes').then(setRoutes).catch(()=>{});},[]);

 const locate=()=>new Promise(ok=>{setErr('');
  if(!navigator.geolocation){setErr('GPS is not available on this device. Using Sonipat as a demo location.');return ok(fallback());}
  navigator.geolocation.getCurrentPosition(async p=>ok(await setLoc({lat:p.coords.latitude,lng:p.coords.longitude})),
   e=>{setErr(e.code===1?'Location permission denied. Using Sonipat as a demo location; allow location in your browser to use your own.':'Could not get your location. Using Sonipat as a demo location.');ok(fallback());},{timeout:10000});});
 const setLoc=async l=>{setUser(l);try{const n=await getNearbyStations(api,l.lat,l.lng);setNear(n);}catch(e){setErr(e.message);}return l;};
 const fallback=()=>setLoc({lat:28.9931,lng:77.0151});

 const find=async()=>{setBusy(true);setErr('');setRes(null);setToStation(null);
  try{if(!dest.trim())throw new Error('Enter a destination, for example Chandigarh.');
   const loc=from.trim()?{}:(user||await locate());
   const r=await api('/api/recommend',{method:'POST',body:{...loc,from:from.trim()||undefined,destination:dest,time:toMin(time),date}});setRes(r);
   if(!from.trim()&&loc.lat){const rt=await calculateRoute(loc,{lat:r.best.boardAt.lat,lng:r.best.boardAt.lng});setToStation(rt);setPath(rt.path);}
  }catch(e){setErr({INVALID_DESTINATION:'We could not find that destination. Pick a station from the list.',INVALID_ORIGIN:'We could not find the From station. Pick one from the list or clear it to use your location.',SAME_STATION:'From and To are the same place.',NO_BUSES:'No buses or connections found for that trip.'}[e.code]||e.message);}
  setBusy(false);};
 const searchCard=<Card className="border-brand/20"><h1 className="text-2xl font-bold mb-3">Book bus tickets and track your bus live</h1>
  <div className="grid md:grid-cols-5 gap-3 items-end">
   <Btn tone="green" className="flex items-center justify-center gap-2" onClick={locate}><Navigation size={16}/>Use My Location</Btn>
   <label className="text-xs">From<input list="st" className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder={user?'My location':'Station, or use location'} value={from} onChange={e=>setFrom(e.target.value)}/></label>
   <label className="text-xs">To<input list="st" className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="e.g. Old Faridabad" value={dest} onChange={e=>setDest(e.target.value)}/>
    <datalist id="st">{allSt.map(s=><option key={s.id} value={s.name}/>)}</datalist></label>
   <label className="text-xs">Date and time<div className="flex gap-1 mt-1"><input type="date" className="border rounded-xl px-2 py-2 text-sm w-full" value={date} onChange={e=>setDate(e.target.value)}/><input type="time" className="border rounded-xl px-2 py-2 text-sm" value={time} onChange={e=>setTime(e.target.value)}/></div></label>
   <Btn disabled={busy} onClick={find} className="flex items-center justify-center gap-2"><Search size={16}/>{busy?'Finding...':'Find Best Bus'}</Btn></div></Card>;
 const track=async id=>{setErr('');try{const t=await api('/api/track/'+id);setTrackInfo(t);setTracked(id);setPath(t.route.stopsDetail.map(s=>({lat:s.lat,lng:s.lng})));setTab('Live Buses');}catch(e){setErr(e.message);}};
 const sel=tracked&&buses[tracked];

 return <div className="min-h-screen pb-20 md:pb-0 text-slate-800">
  <header className="bg-brand text-white sticky top-0 z-20"><div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
   <button onClick={()=>setTab('Home')} className="flex items-center gap-2 font-bold"><Bus size={22}/>SmartBus Tracker</button>
   <nav className="hidden md:flex gap-1 text-sm">{TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-lg ${tab===t?'bg-white/20':'hover:bg-white/10'}`}>{t}</button>)}</nav>
   <span className={`ml-auto text-xs flex items-center gap-1 ${online?'text-emerald-200':'text-amber-200'}`}><Radio size={14}/>{online?'Live feed connected':'Server offline'}</span></div>
   <div className="bg-amber-100 text-amber-900 text-xs text-center py-1">Prototype: all buses, stations, fares and GPS are demo or simulated. This is not official government data.</div></header>

  <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
   <Err e={err}/>
   {tab==='Home'&&<>
    {searchCard}
    {res&&<Journeys res={res} onTrack={track} onBook={setBook} toStation={toStation}/>}
    <div className="grid lg:grid-cols-3 gap-5">
     <div className="lg:col-span-2"><MapView user={user} stations={res?[]:near.length?near:allSt} buses={live} routePath={path} destination={res?.destination&&{lat:res.destination.lat,lng:res.destination.lng}}/></div>
     <div className="space-y-3"><h2 className="font-semibold">Nearby stations</h2>
      {!near.length&&<p className="text-sm text-slate-500">Tap "Use My Location" to see stations near you.</p>}
      {near.map(s=><Card key={s.id}><p className="font-semibold">{s.name}</p><p className="text-sm text-slate-600">{s.distanceKm} km away, {s.buses} buses{s.nextBus&&`, next bus ${s.nextBus}`}</p></Card>)}</div></div>
    <h2 className="font-semibold">Popular routes</h2>
    <div className="grid sm:grid-cols-3 gap-3">{routes.slice(0,6).map(r=><Card key={r.id}><p className="font-semibold">{r.name}</p><p className="text-sm text-slate-600">{r.stops.length} stops, {r.stopsDetail.at(-1).distanceKm} km</p></Card>)}</div></>}

   {tab==='Search Buses'&&<>
    {searchCard}
    {res?<Journeys res={res} onTrack={track} onBook={setBook} toStation={toStation}/>:<p className="text-sm text-slate-500">Enter a destination to see buses.</p>}</>}

   {tab==='Live Buses'&&<>
    {sel?<Card><div className="flex flex-wrap gap-x-6 gap-y-1 items-center"><h2 className="font-bold text-lg">🚌 {sel.busName} {sel.busId}</h2><Status s={sel.status}/><Tag src={sel.source}/></div>
      <p className="text-sm mt-1">Route: {sel.route}. Next stop: <b>{sel.nextStop}</b>. ETA {sel.etaMin} min. {sel.distanceRemainingKm} km remaining. Speed {sel.speed} km/h.</p>
      {sel.status==='OFFLINE'&&<p className="text-sm text-red-700 mt-1">This bus is offline. Showing its last known position.</p>}
      <ol className="mt-3 space-y-1 text-sm">{trackInfo.route.stopsDetail.map((s,i)=><li key={s.id}>{i<=sel.stopIndex?'✓':i===sel.stopIndex+1?'🚌':'○'} {s.name} <span className="text-slate-500">({s.distanceKm} km)</span></li>)}</ol></Card>
     :<p className="text-sm text-slate-500">Pick a bus to track.</p>}
    <MapView user={user} stations={allSt} buses={live} selected={sel} routePath={path}/>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{live.map(b=><Card key={b.busId}><p className="font-semibold">{b.busId}</p><p className="text-sm">{b.route}</p><p className="text-sm text-slate-600">Next: {b.nextStop}, {b.speed} km/h</p><div className="flex justify-between items-center mt-2"><Status s={b.status}/><Btn onClick={()=>track(b.busId)}>Track</Btn></div></Card>)}</div></>}

   {tab==='Stations'&&<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{allSt.map(s=><Card key={s.id}><p className="font-semibold flex gap-2"><MapPin size={16}/>{s.name}</p><Tag src="DEMO"/></Card>)}</div>}
   {tab==='Routes'&&<div className="grid md:grid-cols-2 gap-3">{routes.map(r=><Card key={r.id}><p className="font-bold">{r.name}</p>
     <ol className="text-sm mt-2 space-y-0.5">{r.stopsDetail.map(s=><li key={s.id}>○ {s.name} <span className="text-slate-500">{s.distanceKm} km</span></li>)}</ol></Card>)}</div>}
   {tab==='My Bookings'&&<MyBookings/>}
   {tab==='Admin'&&<Admin refresh={()=>api('/api/routes').then(setRoutes)} routes={routes}/>}
   {tab==='About'&&<Card><h2 className="font-bold text-lg mb-2">About SmartBus Tracker</h2><p className="text-sm">A hackathon prototype that finds the nearest bus station, recommends which bus to catch and tracks it live. Bus data is <b>demo data</b>, locations are <b>simulated GPS</b>, and fares are <b>estimates</b>. Maps, directions and your location come from real Google Maps and browser APIs.</p></Card>}
  </main>

  <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t grid grid-cols-3 text-xs z-20">
   {[['Find Bus','Home',Search],['Track Bus','Live Buses',Bus],['Bookings','My Bookings',MapPin]].map(([l,t,I])=><button key={l} onClick={()=>setTab(t)} className={`py-2 flex flex-col items-center gap-0.5 ${tab===t?'text-brand font-semibold':'text-slate-600'}`}><I size={20}/>{l}</button>)}</nav>
  {book&&<Booking leg={book} onClose={()=>setBook(null)}/>}
 </div>;}

function Admin({refresh,routes}){
 const [s,setS]=useState(null),[f,setF]=useState({id:'',routeId:'R1',departMin:600}),[e,setE]=useState(''),[sim,setSim]=useState('');
 const load=()=>api('/api/admin/stats').then(setS).catch(x=>setE(x.message));useEffect(()=>{load();},[]);
 const cmd=c=>api('/api/sim/'+c,{method:'POST'}).then(r=>setSim(r.running?'Running':'Stopped')).catch(x=>setE(x.message));
 const add=()=>api('/api/admin/buses',{method:'POST',body:f}).then(()=>{setE('');load();}).catch(x=>setE(x.message));
 return <div className="space-y-4"><Err e={e}/>
  {s&&<div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Total buses',s.buses],['Active buses',s.active],['Total routes',s.routes],['Total stations',s.stations]].map(([l,v])=><Card key={l}><p className="text-3xl font-bold text-brand">{v}</p><p className="text-sm text-slate-600">{l}</p></Card>)}</div>}
  <Card><h3 className="font-semibold mb-2 flex gap-2"><Settings size={16}/>GPS simulator <Tag src="SIMULATED"/> {sim&&<span className="text-sm font-normal">{sim}</span>}</h3>
   <div className="flex gap-2 flex-wrap"><Btn tone="green" onClick={()=>cmd('start')}><Play size={14} className="inline"/> Start</Btn><Btn tone="gray" onClick={()=>cmd('pause')}><Pause size={14} className="inline"/> Pause</Btn><Btn tone="gray" onClick={()=>cmd('stop')}><Square size={14} className="inline"/> Stop</Btn><Btn tone="gray" onClick={()=>cmd('reset')}><RotateCcw size={14} className="inline"/> Reset</Btn></div></Card>
  <Card><h3 className="font-semibold mb-2">Add bus</h3><div className="flex gap-2 flex-wrap">
   <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Bus ID e.g. HR01-7777" value={f.id} onChange={x=>setF({...f,id:x.target.value})}/>
   <select className="border rounded-xl px-3 py-2 text-sm" value={f.routeId} onChange={x=>setF({...f,routeId:x.target.value})}>{routes.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>
   <input type="number" className="border rounded-xl px-3 py-2 text-sm w-32" title="Departure, minutes after midnight" value={f.departMin} onChange={x=>setF({...f,departMin:x.target.value})}/><Btn onClick={add}>Add</Btn></div></Card>
  {s&&<Card><h3 className="font-semibold mb-2">Buses</h3>{s.list.map(b=><div key={b.id} className="flex justify-between items-center py-1 text-sm border-b last:border-0"><span>{b.id} ({b.routeId})</span>
   <button className={`px-3 py-1 rounded-full text-xs ${b.active?'bg-emerald-100 text-emerald-800':'bg-slate-200'}`} onClick={()=>api(`/api/admin/buses/${b.id}/toggle`,{method:'POST'}).then(load)}>{b.active?'Active':'Inactive'}</button></div>)}</Card>}</div>;}
