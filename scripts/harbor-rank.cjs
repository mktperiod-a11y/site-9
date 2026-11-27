const crypto=require('node:crypto');
function rank(data,date=data.updated){
 const all=data.webhards.filter(x=>x.status==='ready');
 const max=k=>Math.max(1,...all.map(x=>Number(x.metrics[k])||0));
 const monday=new Date(date+'T00:00:00Z');monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
 const seed=monday.toISOString().slice(0,10);
 const rows=all.map((x,index)=>{
  const m=x.metrics,has=['search','downloads','rating','ratingCount'].some(k=>m[k]!=null);
  const part=has?{pop:(m.search||0)/max('search')*data.weights.pop,
   use:((m.downloads||0)/max('downloads')+((m.rating||0)/5))/2*data.weights.use,
   love:(m.ratingCount||0)/max('ratingCount')*data.weights.love}:null;
  if(part)for(const k of Object.keys(part))part[k]=Math.min(data.weights[k],Math.round(part[k]*10)/10);
  let score=part?Object.values(part).reduce((a,b)=>a+b,0):null;
  return {...x,index,parts:part,score};
 });
 const adjustable=rows.filter(x=>x.score!=null).sort((a,b)=>hash(a.id)-hash(b.id));
 function hash(id){return crypto.createHash('sha256').update(seed+id).digest().readUInt32BE(0)}
 for(const x of adjustable.slice(0,data.weeklyAdjust.items)){
  const delta=(hash(x.id+'adjust')/0xffffffff*2-1)*data.weeklyAdjust.max;
  const p=x.parts; p.pop=Math.min(data.weights.pop,Math.max(0,p.pop+delta));
  x.score=Object.values(p).reduce((a,b)=>a+b,0);
 }
 rows.sort((a,b)=>a.score==null||b.score==null?a.index-b.index:b.score-a.score||a.index-b.index);
 for(const [id,limit] of Object.entries(data.maxRank)){
  const i=rows.findIndex(x=>x.id===id);if(i>=limit){const [x]=rows.splice(i,1);rows.splice(limit-1,0,x);
   const below=rows[limit];if(x.score!=null&&below?.score!=null){
    let remaining=Math.min(100,below.score+.1);for(const k of ['pop','use','love']){
     x.parts[k]=Math.min(data.weights[k],remaining);remaining-=x.parts[k];}
    x.score=Object.values(x.parts).reduce((a,b)=>a+b,0);}}
 }
 return rows.slice(0,data.rankLimit).map((x,i)=>({...x,rank:i+1,
 stars:Math.floor((4.9-i*(4.9-data.minScore)/Math.max(1,data.rankLimit-1))*10+1e-8)/10}));
}
module.exports={rank};
