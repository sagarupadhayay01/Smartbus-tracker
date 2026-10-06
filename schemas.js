import mongoose from 'mongoose';
const mk=(n,idx)=>{const s=new mongoose.Schema({},{strict:false,id:false});idx&&s.index(idx,{unique:true});return mongoose.models[n]||mongoose.model(n,s);};
export const Station=mk('Station',{id:1}),Route=mk('Route',{id:1}),Bus=mk('Bus',{id:1}),Booking=mk('Booking',{pnr:1});
