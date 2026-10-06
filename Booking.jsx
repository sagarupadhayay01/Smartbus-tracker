import React,{useEffect,useState} from 'react';import {X} from 'lucide-react';import {api} from '../services/api.js';import {Btn,Err} from './ui.jsx';
export function Ticket({b}){return <div className="border-2 border-dashed border-brand rounded-2xl p-4 bg-white text-sm" id="ticket">
 <div className="flex justify-between"><b className="text-brand">SmartBus e-ticket (demo)</b><b className={b.status==='CONFIRMED'?'text-emerald-700':'text-red-700'}>{b.status}</b></div>
 <p className="text-2xl font-bold mt-1">PNR {b.pnr}</p><p className="font-semibold mt-1">{b.fromName} to {b.toName}</p>
 <p>{b.operator} {b.busId}, {b.route}</p><p>{b.date}, departs {b.departure}, arrives {b.arrival}</p>
 <p>Seats: {b.seats.join(', ')}</p><p>{b.passengers.map(p=>`${p.name} (${p.age})`).join(', ')}</p>
 <p className="mt-1">Fare: <b>₹{b.fare}</b> (estimated). Payment: {b.payment}</p></div>;}
export default function Booking({leg,onClose}){
 const [seats,setSeats]=useState({booked:[]}),[pick,setPick]=useState([]),[pax,setPax]=useState({}),[phone,setPhone]=useState(''),[err,setErr]=useState(''),[done,setDone]=useState(null),[busy,setBusy]=useState(false);
 const load=()=>api(`/api/seats/${leg.busId}?date=${leg.date}`).then(setSeats).catch(e=>setErr(e.message));useEffect(()=>{load();},[]);
 const toggle=s=>setPick(p=>p.includes(s)?p.filter(x=>x!==s):p.length<6?[...p,s]:p);
 const confirm=async()=>{setBusy(true);setErr('');
  try{setDone(await api('/api/bookings',{method:'POST',body:{busId:leg.busId,date:leg.date,from:leg.from.id,to:leg.to.id,seats:pick,phone,
   passengers:pick.map(s=>({name:pax[s]?.name||'',age:pax[s]?.age||''}))}}));}
  catch(e){setErr(e.message);load();setPick(p=>p.filter(s=>!seats.booked.includes(s)));}setBusy(false);};
 return <div className="fixed inset-0 z-30 bg-black/50 grid place-items-end md:place-items-center" onClick={onClose}>
  <div className="bg-white w-full md:max-w-lg max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-5 space-y-3" onClick={e=>e.stopPropagation()}>
   <div className="flex justify-between items-start"><div><h3 className="font-bold text-lg">{done?'Booking confirmed':'Choose seats'}</h3>
    <p className="text-sm text-slate-600">{leg.busId}: {leg.from.name} to {leg.to.name}, {leg.date} {leg.departure}</p></div><button aria-label="Close" onClick={onClose}><X/></button></div>
   {done?<><Ticket b={done}/><div className="flex gap-2"><Btn onClick={()=>window.print()}>Print ticket</Btn><Btn tone="gray" onClick={onClose}>Done</Btn></div>
     <p className="text-xs text-slate-500">Save your PNR. Find it later under My Bookings with your mobile number.</p></>:<>
    <div className="grid grid-cols-5 gap-2 w-fit mx-auto" role="group" aria-label="Seat map">{Array.from({length:40},(_,i)=>i+1).map(s=>{const bk=seats.booked.includes(s),on=pick.includes(s);
     return <button key={s} disabled={bk} onClick={()=>toggle(s)} aria-pressed={on} aria-label={`Seat ${s}${bk?' booked':''}`}
      className={`w-10 h-10 rounded-lg text-sm font-semibold border ${s%5===3?'ml-0':''} ${bk?'bg-slate-300 text-slate-500':on?'bg-brand-green text-white border-brand-green':'bg-white hover:bg-sky-50'}`}>{s}</button>;})}</div>
    <p className="text-xs text-center text-slate-500">Grey: booked. Green: yours. Up to 6 seats.</p>
    {pick.map(s=><div key={s} className="flex gap-2"><span className="w-14 text-sm pt-2">Seat {s}</span>
     <input className="border rounded-xl px-3 py-2 text-sm flex-1" placeholder="Passenger name" value={pax[s]?.name||''} onChange={e=>setPax({...pax,[s]:{...pax[s],name:e.target.value}})}/>
     <input className="border rounded-xl px-3 py-2 text-sm w-16" placeholder="Age" inputMode="numeric" value={pax[s]?.age||''} onChange={e=>setPax({...pax,[s]:{...pax[s],age:e.target.value}})}/></div>)}
    <input className="border rounded-xl px-3 py-2 text-sm w-full" placeholder="Mobile number (10 digits)" inputMode="numeric" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))}/>
    <Err e={err}/>
    <div className="flex items-center justify-between"><p className="font-bold">₹{leg.fare*pick.length} <span className="text-xs font-normal text-slate-500">estimated, demo payment</span></p>
     <Btn disabled={!pick.length||busy} onClick={confirm}>{busy?'Booking...':'Confirm booking'}</Btn></div></>}
  </div></div>;}
