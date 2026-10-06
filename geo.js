export const km=(a,b)=>{const r=x=>x*Math.PI/180;const h=Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lng-a.lng)/2)**2;return 12742*Math.asin(Math.sqrt(h));};
export const ROAD=1.25; // straight-line -> approx road distance
