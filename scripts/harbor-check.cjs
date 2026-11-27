const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {rank}=require('./harbor-rank.cjs');
const data=JSON.parse(fs.readFileSync('data/webhards.json'));
const excluded=['미투디스크','파일캐스트','파일이즈','애플파일','스마트파일','피디팝',
 'me2disk','filecast','fileis','applefile','smartfile','pdpop'];
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const patterns=(process.env.PRIVACY_PATTERNS||'').split(/[\n,]/).filter(Boolean);
const rows=rank(data);assert.equal(rows.length,10);assert.deepEqual(rows,rank(data));
for(const x of data.webhards){
 assert(!excluded.some(s=>JSON.stringify(x).toLowerCase().includes(s.toLowerCase())),'차단 서비스');
 assert(x.status!=='ready'||/^https:\/\//.test(x.url));
 assert(x.benefits.filter(b=>b.kind==='join').length<=1);
 assert(x.benefits.filter(b=>b.kind==='event').length<=2);
 for(const b of x.benefits){assert(b.text.length<=22);assert(!/(지급|진행 중|~시)$/.test(b.text));}
}
if(data.scoringMode==='app'){
 assert.equal(data.weights.pop,0,'검색 지표를 임의로 반영하지 않음');
 assert.equal(data.weights.use+data.weights.love,100);
 for(const x of rows){
  assert(x.score>0&&x.score<=100,'앱 지수 누락');
  assert(x.metrics.downloads>0&&x.metrics.rating>=1&&x.metrics.rating<=5&&x.metrics.ratingCount>0);
  assert(x.metricsSource?.url.startsWith('https://play.google.com/store/apps/details?'));
  assert(x.metricsSource.url.includes('id='+x.metrics.playApp));
  assert(x.metricsSource.collectedAt&&x.metricsSource.downloadsType==='lower-bound');
 }
 const home=fs.readFileSync('_site/index.html','utf8');
 assert.equal((home.match(/class="hb-fill hb-bar-/g)||[]).length,10,'차트 막대 누락');
 assert(home.includes('앱 공개 지표 기준')&&home.includes('검색 관심도는 미반영'));
 assert(!home.includes('공개 지표는 미수집 상태'));
}
const {parsePage}=require('./harbor-collect.cjs');
const sample='<script type="application/ld+json">'+
 JSON.stringify({aggregateRating:{ratingValue:'4.264705657958984',ratingCount:'215'}})+'</script>'+
 '<div class="ClM7O">50K+</div><div class="g1rdde">Downloads</div>';
assert.deepEqual(parsePage(sample),{downloads:50000,rating:4.3,ratingCount:215});
assert.throws(()=>parsePage('<html>Service Unavailable</html>'));
assert.throws(()=>parsePage(sample.replace('4.264705657958984','8')));
for(const x of rows){if(x.score!=null){
 assert(Math.abs(Object.values(x.parts).reduce((a,b)=>a+b,0)-x.score)<1e-8);
 for(const k of ['pop','use','love'])assert(x.parts[k]>=0&&x.parts[k]<=data.weights[k]);
}if(x.rank>1)assert(rows[x.rank-2].stars-x.stars>=.099);}
const synthetic=structuredClone(data);synthetic.webhards.forEach((x,i)=>{
 x.metrics={...x.metrics,search:100-i*5,downloads:10000-i*100,rating:4.5-i*.1,ratingCount:100-i};
});synthetic.weeklyAdjust={items:4,max:2};synthetic.maxRank={[synthetic.webhards[9].id]:2};
const sr=rank(synthetic);assert.deepEqual(sr,rank(synthetic));assert(sr.find(x=>x.id===synthetic.webhards[9].id).rank<=2);
for(const x of sr)assert(Math.abs(Object.values(x.parts).reduce((a,b)=>a+b,0)-x.score)<1e-8);
for(const f of walk('_site')){
 if(!/\.(html|xml|txt|css|js|svg)$/.test(f))continue;
 const s=fs.readFileSync(f,'utf8');assert(!/site-url\.invalid|\{\{|<!--/.test(s),`미완성 결과물 ${f}`);
 assert(!excluded.some(x=>s.toLowerCase().includes(x.toLowerCase())),`차단 문자열 ${f}`);
 assert(!s.split('\n').some(x=>x.length>140),`긴 줄 ${f}`);
 assert(!/<meta[^>]+name=["'](?:author|generator)/i.test(s));
 for(const p of patterns)assert(!s.includes(p),`개인정보 ${f}`);
 if(f.endsWith('.html')){
  assert(s.includes('Content-Security-Policy'));assert(s.includes('no-referrer'));
  for(const x of data.webhards)assert(!s.includes(x.url),`외부 주소 노출 ${f}`);
  for(const m of s.matchAll(/href="([^"]+)"[^>]*>사이트 바로가기/g))assert(/\/go\/[^/]+\//.test(m[1]));
 }
}
for(const f of walk('.').filter(f=>!/(node_modules|\.git\/|_site\/|checks\/)/.test(f))){
 if(!/\.(cjs|js|json|md|yml|css|svg|gitignore)$/.test(f))continue;
 const s=fs.readFileSync(f,'utf8');for(const p of patterns)assert(!s.includes(p),`소스 개인정보 ${f}`);
}
try{
 const log=execFileSync('git',['log','--format=%B','--all'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
 for(const p of patterns)assert(!log.includes(p),'커밋 개인정보');
 assert(!/Co-Authored-By:|Generated with|chatgpt\.com\/c\//i.test(log));
}catch(e){if(e.status!==128)throw e;}
console.log('규칙·결과물·개인정보 검사 통과');
