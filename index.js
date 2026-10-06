import 'dotenv/config';import path from 'path';import fs from 'fs';import {fileURLToPath} from 'url';import express from 'express';import cors from 'cors';import http from 'http';import {Server} from 'socket.io';
import {stations,routes,buses,fareRules} from './models/data.js';
import {nearbyStations,recommend,getRoute,routeStops,cumulative} from './services/transit.js';
import {calcFare} from './services/fare.js';
import {km} from './services/geo.js';
import * as sim from './services/simulator.js';
import {initDb,persist,Bus,Booking} from './db.js';
import {bookings} from './models/data.js';
import {legInfo} from './services/transit.js';
await initDb();
const app=express(),server=http.createServer(app),origin=process.env.CLIENT_ORIGIN||'*';
app.use(cors({origin}));app.use(express.json());
const io=new Server(server,{cors:{origin}});sim.attach(io);
io.on('connection',s=>s.emit('snapshot',sim.all()));
const find=id=>buses.find(b=>b.id===id),num=v=>v!==''&&v!=null&&Number.isFinite(+v);
const detail=x=>({...x,stopsDetail:routeStops(x).map((s,i)=>({...s,distanceKm:cumulative(x)[i]}))});
app.get('/api/buses',(q,r)=>r.json(sim.all()));
app.get('/api/buses/nearby',(q,r)=>{const {lat,lng,radius=80}=q.query;if(!num(lat)||!num(lng))return r.status(400).json({error:'lat,lng required'});
 r.json(sim.all().filter(b=>km({lat:+lat,lng:+lng},{lat:b.latitude,lng:b.longitude})<=+radius));});
app.get('/api/buses/:id',(q,r)=>{const b=find(q.params.id);b?r.json({...b,live:sim.all().find(x=>x.busId===b.id)}):r.status(404).json({error:'BUS_NOT_FOUND'});});
app.get('/api/stations/nearby',(q,r)=>{const {lat,lng}=q.query;if(!num(lat)||!num(lng))return r.status(400).json({error:'lat,lng required'});r.json(nearbyStations(+lat,+lng,+q.query.limit||5));});
app.get('/api/stations',(q,r)=>r.json(stations));
app.get('/api/routes',(q,r)=>r.json(routes.map(detail)));
app.get('/api/routes/:id',(q,r)=>{const x=getRoute(q.params.id);x?r.json(detail(x)):r.status(404).json({error:'ROUTE_NOT_FOUND'});});
app.post('/api/calculate-fare',(q,r)=>{const {distanceKm,rule,custom}=q.body;if(!num(distanceKm))return r.status(400).json({error:'distanceKm required'});r.json(calcFare(+distanceKm,rule,custom));});
app.get('/api/track/:busId',(q,r)=>{const b=find(q.params.busId);if(!b)return r.status(404).json({error:'BUS_NOT_FOUND'});
 r.json({bus:b,live:sim.all().find(x=>x.busId===b.id)||null,route:detail(getRoute(b.routeId))});});
app.post('/api/recommend',(q,r)=>{const {lat,lng,from,destination,time,date}=q.body;if(!from&&(!num(lat)||!num(lng)))return r.status(400).json({error:'LOCATION_REQUIRED'});
 const out=recommend({lat:+lat,lng:+lng,from,destination,time,date});r.status(out.error?404:200).json(out);});
app.post('/api/sim/:cmd',(q,r)=>r.json(sim.control(q.params.cmd)));
app.post('/api/gps',(q,r)=>{sim.ingest(q.body);r.json({ok:true});}); // hook for real GPS hardware
app.get('/api/admin/stats',(q,r)=>r.json({buses:buses.length,active:buses.filter(b=>b.active).length,routes:routes.length,stations:stations.length,fareRules,list:buses}));
app.post('/api/admin/buses',(q,r)=>{const {id,routeId,operator,departMin}=q.body;if(!id||!getRoute(routeId)||find(id))return r.status(400).json({error:'Invalid or duplicate bus'});
 const nb={id,routeId,operator:operator||'Haryana Roadways',departMin:+departMin||600,fareRule:'default',active:true,source:'DEMO'};buses.push(nb);persist(()=>Bus.create(nb));sim.control('reset');r.json({ok:true});});
app.post('/api/admin/buses/:id/toggle',(q,r)=>{const b=find(q.params.id);if(!b)return r.sendStatus(404);b.active=!b.active;persist(()=>Bus.updateOne({id:b.id},{active:b.active}));r.json(b);});
// ---- ticket booking (payment is a demo stub: no money is charged)
const today=()=>new Date().toISOString().slice(0,10);
const takenSeats=(busId,date)=>bookings.filter(x=>x.busId===busId&&x.date===date&&x.status==='CONFIRMED').flatMap(x=>x.seats);
app.get('/api/seats/:busId',(q,r)=>{if(!find(q.params.busId))return r.status(404).json({error:'BUS_NOT_FOUND'});const date=q.query.date||today();r.json({total:40,booked:takenSeats(q.params.busId,date),date});});
app.post('/api/bookings',(q,r)=>{const {busId,date,from,to,seats,passengers,phone}=q.body,b=find(busId),bad=m=>r.status(400).json({error:m});
 if(!b)return r.status(404).json({error:'BUS_NOT_FOUND'});const info=legInfo(b,from,to);if(!info)return bad('Invalid boarding or drop stop for this bus');
 if(!/^\d{10}$/.test(phone||''))return bad('Enter a 10-digit mobile number');
 if(!Array.isArray(seats)||!seats.length||!Array.isArray(passengers)||seats.length!==passengers.length)return bad('Select one seat per passenger');
 if(passengers.some(p=>!String(p.name||'').trim()||!(+p.age>0)))return bad('Enter name and age for every passenger');
 const d=date||today(),taken=takenSeats(busId,d);
 if(seats.some(s=>!Number.isInteger(s)||s<1||s>40||taken.includes(s)))return r.status(409).json({error:'One or more seats were just booked by someone else. Please pick again.'});
 const bk={pnr:String(Math.floor(1e9+Math.random()*9e9)),busId,operator:b.operator,route:info.route,from,to,fromName:info.fromName,toName:info.toName,date:d,
  departure:info.departure,arrival:info.arrival,seats,passengers,phone,fare:info.fare*seats.length,status:'CONFIRMED',payment:'DEMO (not charged)',createdAt:new Date().toISOString()};
 bookings.push(bk);persist(()=>Booking.create(bk));r.json(bk);});
app.get('/api/bookings',(q,r)=>{const {phone,pnr}=q.query;if(!phone&&!pnr)return r.status(400).json({error:'Enter a PNR or mobile number'});
 r.json(bookings.filter(x=>(pnr&&x.pnr===pnr)||(phone&&x.phone===phone)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));});
app.post('/api/bookings/:pnr/cancel',(q,r)=>{const x=bookings.find(b=>b.pnr===q.params.pnr);if(!x)return r.status(404).json({error:'PNR not found'});
 x.status='CANCELLED';persist(()=>Booking.updateOne({pnr:x.pnr},{status:'CANCELLED'}));r.json(x);});
// serve the built website (client/dist) from the same server, so one URL runs everything
const dist=path.join(path.dirname(fileURLToPath(import.meta.url)),'../client/dist');
if(fs.existsSync(dist)){app.use(express.static(dist));app.get(/^\/(?!api|socket\.io).*/,(q,r)=>r.sendFile(path.join(dist,'index.html')));}
app.use((e,q,r,n)=>r.status(500).json({error:'SERVER_ERROR'}));
server.listen(process.env.PORT||4000,()=>console.log('SmartBus server on',process.env.PORT||4000));
