// Map services without Google: OpenStreetMap tiles (MapView) + free OSRM routing. No API key or billing needed.
export const calculateDistance=(a,b)=>{const r=x=>x*Math.PI/180,h=Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lng-a.lng)/2)**2;return 12742*Math.asin(Math.sqrt(h));};
export async function getDirections(o,d){
 try{const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`,{signal:AbortSignal.timeout(6000)});
  const j=await r.json();return j.code==='Ok'?j.routes[0]:null;}catch{return null;}}
export async function calculateRoute(o,d){const r=await getDirections(o,d);
 return r?{km:r.distance/1000,min:Math.round(r.duration/60),path:r.geometry.coordinates.map(([lng,lat])=>({lat,lng})),source:'OSRM'}
  :{km:calculateDistance(o,d)*1.25,min:null,path:null,source:'ESTIMATE'};}
export const getETA=async(o,d)=>(await calculateRoute(o,d)).min;
export const getNearbyStations=(api,lat,lng)=>api(`/api/stations/nearby?lat=${lat}&lng=${lng}`); // demo stations from backend
