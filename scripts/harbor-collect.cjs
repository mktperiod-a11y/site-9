const fs=require('node:fs');
function parsePage(html){
 const match=html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
 if(!match)throw new Error('공개 앱 데이터 없음');
 const ld=JSON.parse(match[1]);
 const downloads=html.match(/<div class="ClM7O">([\d.,]+)([KMB]?)\+<\/div><div class="g1rdde">Downloads<\/div>/);
 const aggregate=ld.aggregateRating;
 if(!downloads||!aggregate)throw new Error('공개 지표 항목 누락');
 const value=Number(downloads[1].replace(/,/g,''))*({'':1,K:1e3,M:1e6,B:1e9}[downloads[2]]);
 const rating=Math.round(Number(aggregate.ratingValue)*10)/10;
 const count=Number(aggregate.ratingCount);
 if(!Number.isFinite(value)||value<1||rating<1||rating>5||!Number.isInteger(count)||count<1){
  throw new Error('공개 지표 형식 오류');
 }
 return {downloads:value,rating,ratingCount:count};
}
async function collect(){
 const file='data/webhards.json',data=JSON.parse(fs.readFileSync(file));
 const today=new Date().toISOString().slice(0,10);let collected=0;
 const staged=[];
 for(const item of data.webhards){
  if(item.status!=='ready'||!item.metrics.playApp)continue;
  const url=new URL('https://play.google.com/store/apps/details');
  url.search=new URLSearchParams({id:item.metrics.playApp,hl:'en',gl:'KR'}).toString();
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw new Error('공개 페이지 요청 실패');
   const metrics=parsePage(await response.text());
   staged.push({item,metrics,url:url.href});collected++;
  }catch{console.warn(`${item.name}: 직전 지표 유지`);}
 }
 if(!collected)throw new Error('갱신한 지표 없음. 기존 파일 유지');
 data.previousRanks=Object.fromEntries(require('./harbor-rank.cjs').rank(data).map(x=>[x.id,x.rank]));
 for(const {item,metrics,url} of staged){
  Object.assign(item.metrics,metrics);
  item.metricsSource={url,collectedAt:today,locale:'en-KR',downloadsType:'lower-bound',ratingType:'aggregateRating'};
 }
 data.updated=today;
 data.metricsDate=staged.length===data.webhards.filter(x=>x.status==='ready').length?today:data.metricsDate;
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
 console.log(`공개 앱 지표 ${collected}곳 갱신`);
}
if(require.main===module)collect().catch(e=>{console.error(e.message);process.exit(1)});
module.exports={parsePage};
