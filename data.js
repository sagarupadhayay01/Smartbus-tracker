// DEMO DATA - not official Haryana Roadways data.
export const stations=[
['delhi','Delhi ISBT Kashmere Gate',28.6675,77.2284],['sonipat','Sonipat Bus Stand',28.9288,77.0913],
['panipat','Panipat Bus Stand',29.3909,76.9635],['karnal','Karnal Bus Stand',29.6857,76.9905],
['kurukshetra','Kurukshetra Bus Stand',29.9695,76.8783],['ambala','Ambala Cantt Bus Stand',30.3782,76.7767],
['chandigarh','Chandigarh ISBT 43',30.7189,76.7461],['rohtak','Rohtak Bus Stand',28.8955,76.6066],
['hisar','Hisar Bus Stand',29.1492,75.7217],['bahadurgarh','Bahadurgarh Bus Stand',28.6928,76.9249],
['gurugram','Gurugram Bus Stand',28.4595,77.0266],['jind','Jind Bus Stand',29.3162,76.315],
['panchkula','Panchkula Sector 5',30.6942,76.8606],['kaithal','Kaithal Bus Stand',29.8015,76.3998],
['yamunanagar','Yamunanagar Bus Stand',30.129,77.2674]
].map(([id,name,lat,lng])=>({id,name,lat,lng,source:'DEMO'}));
export const routes=[
{id:'R1',name:'Delhi → Chandigarh',stops:['delhi','sonipat','panipat','karnal','kurukshetra','ambala','chandigarh']},
{id:'R2',name:'Delhi → Panipat',stops:['delhi','sonipat','panipat']},
{id:'R3',name:'Sonipat → Chandigarh',stops:['sonipat','panipat','karnal','kurukshetra','ambala','chandigarh']},
{id:'R4',name:'Rohtak → Delhi',stops:['rohtak','bahadurgarh','delhi']},
{id:'R5',name:'Hisar → Delhi',stops:['hisar','rohtak','bahadurgarh','delhi']},
{id:'R6',name:'Delhi → Karnal',stops:['delhi','sonipat','panipat','karnal']},
{id:'R7',name:'Panipat → Ambala',stops:['panipat','karnal','kurukshetra','ambala']}];
export const fareRules={default:{baseFare:20,perKm:1.5,minimumFare:20},'HR-AC':{baseFare:40,perKm:2.2,minimumFare:40}};
// departMin = minutes after midnight from the route's first stop
export const buses=[
['HR68A-1234','R1','Haryana Roadways',630,'default'],['HR01-2201','R1','Haryana Roadways AC',720,'HR-AC'],
['HR12-5510','R1','Haryana Roadways',900,'default'],['HR55-0098','R2','Haryana Roadways',600,'default'],
['HR55-0120','R2','Haryana Roadways',660,'default'],['HR26-7781','R3','Haryana Roadways',645,'default'],
['HR26-7790','R3','Haryana Roadways AC',780,'HR-AC'],['HR34-4410','R4','Haryana Roadways',615,'default'],
['HR20-3312','R5','Haryana Roadways',570,'default'],['HR01-9001','R6','Haryana Roadways',690,'default'],
['HR05-6120','R7','Haryana Roadways',705,'default']
].map(([id,routeId,operator,departMin,fareRule])=>({id,routeId,operator,departMin,fareRule,active:true,source:'DEMO'}));
// --- added: Pehowa / Old Faridabad + Delhi-bound and Faridabad routes (enables multi-change journeys)
stations.push(...[['pehowa','Pehowa Bus Stand',29.9806,76.5822],['faridabad','Old Faridabad Bus Stand',28.4089,77.3178]].map(([id,name,lat,lng])=>({id,name,lat,lng,source:'DEMO'})));
routes.push({id:'R8',name:'Pehowa → Kurukshetra',stops:['pehowa','kurukshetra']},
 {id:'R9',name:'Delhi → Old Faridabad',stops:['delhi','faridabad']},
 {id:'R10',name:'Chandigarh → Delhi',stops:['chandigarh','ambala','kurukshetra','karnal','panipat','sonipat','delhi']});
export const bookings=[];
[['HR38-1101','R8',540],['HR38-1102','R8',780],['HR38-1103','R8',1020],
 ['HR37-2201','R9',600],['HR37-2202','R9',780],['HR37-2203','R9',900],['HR37-2204','R9',1020],['HR37-2205','R9',1140],
 ['HR70-3301','R10',480],['HR70-3302','R10',600],['HR70-3303','R10',720],['HR70-3304','R10',840]
].forEach(([id,routeId,departMin])=>buses.push({id,routeId,operator:'Haryana Roadways',departMin,fareRule:'default',active:true,source:'DEMO'}));
