import {fareRules} from '../models/data.js';
export function calcFare(distanceKm,rule='default',custom){
 const r=custom||fareRules[rule]||fareRules.default;
 return {estimated:true,distanceKm:+distanceKm.toFixed(1),rule:r,fare:Math.round(Math.max(r.minimumFare,r.baseFare+distanceKm*r.perKm))};
}
