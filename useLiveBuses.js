import {useEffect,useState} from 'react';import {io} from 'socket.io-client';import {API_URL} from '../services/api.js';
export default function useLiveBuses(){const [buses,setBuses]=useState({}),[online,setOnline]=useState(false);
 useEffect(()=>{const s=io(API_URL||undefined);s.on('connect',()=>setOnline(true));s.on('disconnect',()=>setOnline(false));
  s.on('snapshot',l=>setBuses(Object.fromEntries(l.map(b=>[b.busId,b]))));
  s.on('busLocationUpdate',b=>setBuses(p=>({...p,[b.busId]:{...p[b.busId],...b}})));
  s.on('busStatusUpdate',({busId,status})=>setBuses(p=>p[busId]?{...p,[busId]:{...p[busId],status}}:p));
  return()=>s.close();},[]);
 return {buses,online};}
