// MongoDB persistence. Without MONGODB_URI (or if it is unreachable) the app runs from memory, so demos never break.
import mongoose from 'mongoose';
import {stations,routes,buses,bookings} from './models/data.js';
import {Station,Route,Bus,Booking} from './models/schemas.js';
export let mongoOn=false;
const clean=d=>d.map(({_id,__v,...x})=>x);
export async function initDb(){
 const uri=process.env.MONGODB_URI;if(!uri){console.log('[db] no MONGODB_URI, using in-memory data');return;}
 try{await mongoose.connect(uri,{serverSelectionTimeoutMS:5000});
  if(process.env.RESEED==='1')await Promise.all([Station,Route,Bus,Booking].map(m=>m.deleteMany({})));
  if(!await Station.countDocuments()){await Station.insertMany(stations);await Route.insertMany(routes);await Bus.insertMany(buses);}
  else{const load=async(M,arr)=>arr.splice(0,arr.length,...clean(await M.find().lean()));
   await load(Station,stations);await load(Route,routes);await load(Bus,buses);}
  bookings.splice(0,bookings.length,...clean(await Booking.find().lean()));
  mongoOn=true;console.log('[db] MongoDB connected');
 }catch(e){console.log('[db] MongoDB unavailable, using memory:',e.message);}
}
export const persist=async fn=>{if(mongoOn)try{await fn();}catch(e){console.log('[db] write failed:',e.message);}};
export {Bus,Booking};
