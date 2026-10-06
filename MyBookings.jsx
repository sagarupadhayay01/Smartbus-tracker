import React,{useState} from 'react';import {api} from '../services/api.js';import {Card,Btn,Err} from './ui.jsx';import {Ticket} from './Booking.jsx';
export default function MyBookings(){
 const [q,setQ]=useState(''),[list,setList]=useState(null),[err,setErr]=useState('');
 const search=async()=>{setErr('');try{setList(await api(`/api/bookings?${q.length===10?'phone':'pnr'}=${q}`));}catch(e){setErr(e.message);}};
 const cancel=async p=>{if(!confirm('Cancel this ticket?'))return;try{await api(`/api/bookings/${p}/cancel`,{method:'POST'});search();}catch(e){setErr(e.message);}};
 return <div className="space-y-3"><Card><h2 className="font-bold text-lg mb-2">My bookings</h2>
  <div className="flex gap-2"><input className="border rounded-xl px-3 py-2 text-sm flex-1" placeholder="PNR or 10-digit mobile number" value={q} onChange={e=>setQ(e.target.value.trim())}/><Btn onClick={search}>Find tickets</Btn></div></Card>
  <Err e={err}/>{list&&!list.length&&<p className="text-sm text-slate-500">No tickets found. Check the PNR or mobile number.</p>}
  <div className="grid md:grid-cols-2 gap-3">{list?.map(b=><div key={b.pnr} className="space-y-2"><Ticket b={b}/>{b.status==='CONFIRMED'&&<Btn tone="gray" onClick={()=>cancel(b.pnr)}>Cancel ticket</Btn>}</div>)}</div></div>;}
