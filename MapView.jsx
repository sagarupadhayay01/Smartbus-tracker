import React,{useEffect,useRef} from 'react';import L from 'leaflet';import 'leaflet/dist/leaflet.css';
const ico={user:'📍',bus:'🚌',station:'🚏'};
const icon=t=>L.divIcon({html:`<div style="font-size:22px;line-height:28px;text-align:center">${ico[t]}</div>`,className:'',iconSize:[28,28],iconAnchor:[14,14]});
export default function MapView({user,stations=[],buses=[],selected,routePath,destination}){
 const el=useRef(),map=useRef(),mk=useRef({}),line=useRef();
 useEffect(()=>{const m=L.map(el.current).setView([29.4,76.9],8);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);map.current=m;return()=>m.remove();},[]);
 const put=(key,pos,type,title)=>{const m=map.current;if(!m)return;const ll=[pos.lat,pos.lng];let k=mk.current[key];
  if(!k){mk.current[key]=L.marker(ll,{icon:icon(type),title}).addTo(m);return;}
  const a=k.getLatLng(),dl=(ll[0]-a.lat)/10,dg=(ll[1]-a.lng)/10;let i=0;clearInterval(k._t); // glide to new position
  k._t=setInterval(()=>{i++;k.setLatLng(i>=10?ll:[a.lat+dl*i,a.lng+dg*i]);if(i>=10)clearInterval(k._t);},50);};
 useEffect(()=>{user&&put('user',user,'user','You');},[user]);
 useEffect(()=>{stations.forEach(s=>put('s'+s.id,{lat:s.lat,lng:s.lng},'station',s.name));},[stations]);
 useEffect(()=>{buses.forEach(b=>put('b'+b.busId,{lat:b.latitude,lng:b.longitude},'bus',b.busId));},[buses]);
 useEffect(()=>{destination&&put('dest',destination,'station','Destination');},[destination]);
 useEffect(()=>{line.current?.remove();line.current=null;
  if(routePath?.length){const pts=routePath.map(p=>[p.lat,p.lng]);line.current=L.polyline(pts,{color:'#0b5cab',weight:5}).addTo(map.current);map.current.fitBounds(line.current.getBounds(),{padding:[20,20]});}},[routePath]);
 useEffect(()=>{if(selected)map.current.panTo([selected.latitude,selected.longitude]);},[selected?.busId]);
 return <div className="isolate relative h-80 md:h-[30rem] rounded-2xl overflow-hidden border border-sky-200"><div ref={el} className="absolute inset-0"/></div>;}
