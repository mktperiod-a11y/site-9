const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {rank}=require('./harbor-rank.cjs');
const data=JSON.parse(fs.readFileSync('data/webhards.json','utf8'));
const rows=rank(data),base=(process.env.SITE_URL||'https://site-url.invalid').replace(/\/$/,'');
const brand='혜택나침반';const out='_site';fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
fs.cpSync('assets',out+'/assets',{recursive:true});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href=p=>base+'/'+p;
const styleVersion=crypto.createHash('sha256').update(fs.readFileSync('assets/harbor.css'))
 .update(JSON.stringify(data)).digest('hex').slice(0,12);
const fmt=x=>x==null?'–':Number(x).toLocaleString('ko-KR');
const rating=x=>x==null?'–':Number(x).toFixed(1);
const downloads=x=>x==null?'–':fmt(x)+'+';
const appMode=data.scoringMode==='app';
const hasMetrics=rows.some(x=>x.score!=null);
const basis=appMode?'앱 공개 지표 기준':'인기 · 사용성 · 애정';
const metricNote=appMode?'다운로드·평점·평가 수를 반영합니다. 네이버 검색 관심도는 미반영입니다.':
 hasMetrics?'공개 지표를 종합한 비교 지수입니다.':'공개 지표를 확보하면 지수를 표시합니다.';
const source=x=>x.metricsSource?`<a class="hb-source" href="${esc(x.metricsSource.url)}"
 target="_blank" rel="noopener noreferrer">Google Play ↗</a><span class="hb-date"> · ${esc(x.metricsSource.collectedAt)}</span>`:'–';
const benefits=x=>x.benefits.length?x.benefits.map(b=>`<span class="hb-chip">${esc(b.text)}</span>`).join(' '):
 '<span class="hb-date">공식 사이트에서 확인하세요.</span>';
const move=x=>{const old=data.previousRanks[x.id];return old==null?'NEW':old===x.rank?'–':
 `${old>x.rank?'▲':'▼'}${Math.abs(old-x.rank)}`;};
const go=x=>`<a class="hb-button" href="${href('go/'+x.id+'/')}" target="_blank" rel="noopener noreferrer">사이트 바로가기 ↗</a>`;
const faq=[['웹하드 순위는 어떻게 정하나요?',appMode?'Google Play에서 확인한 다운로드·평점·평가 수로 계산합니다. 네이버 검색 관심도는 반영하지 않습니다.':'인기·사용성·애정 항목의 공개 지표를 종합합니다. 지표가 없으면 기존 순서를 유지합니다.'],
 ['별점은 앱 평점과 같은가요?','아닙니다. 카드 별점은 목록 순서를 표현한 편집 별점이며 구글 플레이 실측 평점과 다릅니다.'],
 ['가입 혜택은 누구나 받을 수 있나요?','가입 이력·본인인증·이용 기기 등 조건에 따라 달라질 수 있습니다. 공식 안내를 확인하세요.'],
 ['포인트로 모든 콘텐츠를 볼 수 있나요?','제휴 콘텐츠 제외 여부와 포인트 유효기간을 반드시 확인하세요.'],
 ['다운로드 수가 이용자 수인가요?','다운로드 수는 누적 설치 지표이며 실제 활동 이용자 수와 다릅니다.'],
 ['이용권을 구매하기 전에 무엇을 확인하나요?','자동결제·해지·환불 조건과 원하는 콘텐츠의 별도 요금을 확인하세요.'],
 ['모바일에서도 이용할 수 있나요?','각 서비스의 모바일 지원 범위와 설치 조건을 공식 사이트에서 확인하세요.'],
 ['현재 몇 곳을 비교하나요?',`공식 연결 주소를 확인한 ${rows.length}곳을 비교합니다.`],
 ['언제 정보를 확인했나요?',`${data.updated} 기준입니다. 혜택은 이후 변경될 수 있습니다.`],
 ['빈 지표는 무슨 뜻인가요?','확인한 수치가 없다는 뜻입니다. 0이나 낮은 품질을 의미하지 않습니다.']];
const faqs=items=>items.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n');
function write(p,s){const dest=path.join(out,p);fs.mkdirSync(path.dirname(dest),{recursive:true});
 // Keep text and attribute boundaries intact while wrapping output.
 s=s.replace(/<!--[^]*?-->/g,'').replace(/></g,'>\n<');
 const wrap=line=>{if(line.length<=140)return line;let parts=[];
  while(line.length>140){let i=line.lastIndexOf(' ',139);if(i<1)break;parts.push(line.slice(0,i));line=line.slice(i+1);}
  return [...parts,line].join('\n');};
 fs.writeFileSync(dest,s.split('\n').map(wrap).join('\n')+'\n');}
function page(p,title,body,items=[],extra=[]){
 const schemas=[...extra];if(items.length)schemas.push({'@context':'https://schema.org','@type':'FAQPage',
 mainEntity:items.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
 const scripts=schemas.map(s=>JSON.stringify(s,null,2));
 const hashes=scripts.map(s=>"'sha256-"+crypto.createHash('sha256').update(s).digest('base64')+"'").join(' ');
 // Structured data hashes permit only these exact inert data blocks.
 const csp=`default-src 'self'; script-src 'self' ${hashes}; style-src 'self'; img-src 'self'; `+
 "object-src 'none'; form-action 'none'; base-uri 'self'; connect-src 'none'; frame-src 'none'";
 const canonical=p.endsWith('index.html')?p.slice(0,-10):p;
 const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer"><title>${esc(title)}</title>
<meta name="description" content="웹하드 10곳의 가입 혜택과 공개 지표를 비교하고 이용 조건을 확인하세요.">
<link rel="canonical" href="${href(canonical)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:image" content="${href('assets/harbor-og.png')}"><meta property="og:type" content="website">
<link rel="icon" href="${href('assets/harbor-icon.svg')}" type="image/svg+xml">
<link rel="icon" href="${href('assets/harbor-icon.ico')}">
<link rel="apple-touch-icon" href="${href('assets/harbor-icon-192.png')}">
<link rel="stylesheet" href="${href('assets/harbor.css')}?v=${styleVersion}">
${scripts.map(s=>`<script type="application/ld+json">${s}</script>`).join('\n')}</head><body>
<header><div class="hb-wrap hb-head"><a class="hb-brand" href="${href('')}"><b>◈</b> ${brand}</a>
<nav aria-label="주 메뉴"><a href="${href('')}">순위</a><a href="${href('picks.html')}">조건별 추천</a>
<a href="${href('criteria.html')}">선정 기준</a></nav></div></header>
<main class="hb-wrap">${body}</main><footer><div class="hb-wrap">${brand} · P2P사이트·웹하드 비교 안내
<br>순위는 참고용이며 선택은 이용자 판단입니다. 혜택과 이용 조건은 공식 사이트에서 최종 확인하세요.
<br>카드 별점은 편집 별점입니다. 공개 지표가 없는 서비스의 목록 순서는 기존 순서를 유지합니다.
</div></footer></body></html>`;
 // CSP attribute may wrap on whitespace, but must remain a single attribute value.
 write(p||'index.html',html);
}
const hero=(t,sub)=>`<section class="hb-hero"><span class="hb-eyebrow">WEBHARD GUIDE</span><h1>${t}</h1>
<p class="hb-sub">${sub}</p><span class="hb-date">정보 확인 ${data.updated} · 공개 ${rows.length}곳</span></section>`;
const card=x=>`<article class="hb-card"><div class="hb-number">${x.rank}<span class="hb-move">${move(x)}</span></div>
<a href="${href('webhard/'+x.id+'/')}"><img class="hb-logo" src="${href(x.logo)}" alt="${esc(x.name)} 로고" width="96" height="42"></a>
<div><a class="hb-name" href="${href('webhard/'+x.id+'/')}">${esc(x.name)}</a>
<p class="hb-reason">${esc(x.reason)}</p><div>${benefits(x)}</div></div>
<div><div class="hb-date">★ ${x.stars.toFixed(1)} <small>편집 별점</small></div>${go(x)}</div></article>`;
const comparison=`<section class="hb-panel"><h2>한눈에 비교하기</h2>
<p class="hb-date">출처: Google Play · 수집 ${data.metricsDate||'미수집'}<br>다운로드는 공개 구간의 하한값입니다. –는 미확인입니다.</p>
<table class="hb-table"><caption class="hb-date">앱 평점·평가 수는 한국 지역 영문 페이지 기준입니다. 지역·기기에 따라 다를 수 있습니다.</caption>
<thead><tr>${['서비스','가입 혜택','앱 평점','평가 수','다운로드',appMode?'앱 지수':'지수'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead>
<tbody>${rows.map(x=>`<tr><th scope="row"><a href="${href('webhard/'+x.id+'/')}">${x.name}</a><div>${source(x)}</div></th>
<td>${esc(x.benefits.find(b=>b.kind==='join')?.text||'–')}</td><td>${rating(x.metrics.rating)}</td>
<td>${fmt(x.metrics.ratingCount)}</td><td>${downloads(x.metrics.downloads)}</td><td>${x.score==null?'–':x.score.toFixed(1)}</td></tr>`).join('')}</tbody></table></section>`;
fs.appendFileSync(out+'/assets/harbor.css','\n'+rows.filter(x=>x.score!=null).map(x=>`.hb-bar-${x.id}{width:${x.score}%}`).join('\n'));
const chart=`<section class="hb-panel"><h2>종합 지수 비교</h2><p class="hb-date">${basis} · 100점 기준</p>
${rows.map(x=>`<div class="hb-chartrow"><span>${x.name}</span><div class="hb-track" role="img" aria-label="${x.name} 지수 ${x.score?.toFixed(1)||'미확인'}점">${x.score==null?'':
 `<div class="hb-fill hb-bar-${x.id}"></div>`}</div><span>${x.score==null?'–':x.score.toFixed(1)}</span></div>`).join('')}
<p class="hb-date">${metricNote}</p></section>`;
const shuffled=[...rows].sort((a,b)=>crypto.createHash('sha256').update(data.updated.slice(0,7)+a.id).digest('hex')
 .localeCompare(crypto.createHash('sha256').update(data.updated.slice(0,7)+b.id).digest('hex'))).slice(0,5);
const title=`P2P사이트 순위 TOP 10 (${data.updated.slice(0,4)}년 ${Number(data.updated.slice(5,7))}월) | 최신 웹하드 추천·혜택 비교`;
page('',title,hero('P2P사이트·웹하드 순위','이용 조건은 꼼꼼하게, 비교는 간편하게.<br>10곳의 혜택과 공개 정보를 한곳에서 살펴보세요.')+
`<div class="hb-grid"><div><section class="hb-section"><div class="hb-topline"><h2>웹하드 TOP 10</h2>
<span>전체 ${rows.length}곳 비교</span></div>${rows.map(card).join('')}</section>${chart}${comparison}
<section class="hb-panel"><h2>자주 묻는 질문</h2>${faqs(faq)}</section></div><aside>
<section class="hb-panel"><span class="hb-eyebrow">MONTHLY BENEFITS</span><h3>이번 달 웹하드 혜택</h3>
${shuffled.map(x=>`<a class="hb-sideitem" href="${href('webhard/'+x.id+'/')}">${x.name}<small>
${esc(x.benefits[0]?.text||'공식 사이트에서 확인하세요.')}</small></a>`).join('')}
</section><section class="hb-panel"><h3>처음 이용한다면</h3><p class="hb-sub">혜택보다 먼저 확인할<br>결제와 콘텐츠 이용 조건</p>
<a class="hb-button" href="${href('criteria.html')}">이용 전 체크리스트 →</a></section>
<p class="hb-note">${metricNote} 다운로드는 공개 구간의 하한값을 사용합니다.</p>
</aside></div>`,faq,[{'@context':'https://schema.org','@type':'ItemList',name:'웹하드 비교 목록',
 itemListElement:rows.map(x=>({'@type':'ListItem',position:x.rank,name:x.name,url:href('webhard/'+x.id+'/')}))}]);
for(const x of rows){const q=[['가입 혜택은 무엇인가요?',x.benefits[0]?.text?`${x.benefits[0].text}. 적용 조건은 공식 사이트에서 확인하세요.`:
 '확인한 혜택이 없습니다. 공식 사이트에서 확인하세요.'],['지표가 비어 있는 이유는 무엇인가요?','확인된 수치만 표시하므로 미수집 값은 –로 남깁니다.'],
 ['카드 별점은 무엇인가요?','목록 순서를 표현한 편집 별점입니다. 앱 이용자 평점이 아닙니다.']];
 page(`webhard/${x.id}/index.html`,`${x.name} 혜택·이용 정보 | ${brand}`,
 hero(x.name+' 이용 정보',`${x.rank}번째 비교 서비스 · ${move(x)} · 편집 별점 ${x.stars.toFixed(1)}`)+
 `<div class="hb-narrow"><section class="hb-panel"><img class="hb-logo" src="${href(x.logo)}" alt="${x.name} 로고">
 <h2>가입 혜택과 이벤트</h2>${benefits(x)}<p class="hb-sub">${x.reason}</p>${go(x)}</section>
 <section class="hb-panel"><h2>지수 구성과 공개 지표</h2>
 <p class="hb-date">${basis}</p>
 <p class="hb-sub">${appMode?'검색 관심도 미반영':`인기 ${x.parts?.pop.toFixed(1)||'–'}`} /
 사용성 ${x.parts?.use.toFixed(1)||'–'} / 애정 ${x.parts?.love.toFixed(1)||'–'}</p>
 <p class="hb-sub">종합 지수 ${x.score?.toFixed(1)||'–'} · 이전 순위 ${data.previousRanks[x.id]||'–'} · 현재 ${x.rank}위</p>
 <p class="hb-sub">앱 평점 ${rating(x.metrics.rating)} · 평가 수 ${fmt(x.metrics.ratingCount)} · 다운로드 ${downloads(x.metrics.downloads)}</p>
 <p class="hb-date">공개 앱 지표 출처: ${source(x)}<br>다운로드는 공개 구간 하한값, 평점은 한국 지역 영문 페이지 기준입니다.</p></section>
 <section class="hb-panel"><h2>자주 묻는 질문</h2>${faqs(q)}</section>
 <section class="hb-panel"><h2>다른 웹하드도 비교해 보세요</h2><div class="hb-links">
 ${rows.filter(y=>y.id!==x.id).slice(0,5).map(y=>`<a href="${href('webhard/'+y.id+'/')}">${y.name}</a>`).join('')}</div></section></div>`,q);
 const encoded=Buffer.from(x.url).toString('base64').split('').reverse().join('');
 page(`go/${x.id}/index.html`,`${x.name} 공식 사이트로 이동`,hero('공식 사이트로 이동',`${x.name}의 이용 조건을 확인해 주세요.`)+
 `<section class="hb-panel"><p class="hb-sub">아래 버튼을 누르면 공식 사이트로 이동합니다.</p>
 <button class="hb-button" type="button" data-destination="${encoded}">공식 사이트 열기 ↗</button>
 <noscript><p>외부 사이트 연결에는 자바스크립트가 필요합니다. 공식 사이트를 직접 검색해 주세요.</p></noscript></section>
 <script src="${href('assets/harbor-go.js')}"></script>`);
}
const groups=[['가입 혜택이 있는 곳',rows.filter(x=>x.benefits.some(b=>b.kind==='join'))],
 ['앱 평점 비교',rows.filter(x=>x.metrics.rating!=null).sort((a,b)=>b.metrics.rating-a.metrics.rating)],
 ['다운로드 비교',rows.filter(x=>x.metrics.downloads!=null).sort((a,b)=>b.metrics.downloads-a.metrics.downloads)],
 ['100원 이용권',rows.filter(x=>x.benefits.some(b=>b.text.includes('100원')))],
 ['페이백 혜택',rows.filter(x=>x.benefits.some(b=>b.text.includes('페이백')))]];
page('picks.html','조건별 웹하드 추천 | '+brand,hero('내 조건에 맞는 웹하드','확인된 정보가 2곳 이상인 조건만 묶었습니다.')+
 groups.filter(([,v])=>v.length>=2).map(([t,v])=>`<section class="hb-panel"><h2>${t}</h2>${v.map(card).join('')}</section>`).join(''));
page('criteria.html','웹하드 순위 기준 | '+brand,hero('비교 기준을 확인하세요','숫자의 의미와 이용 전 확인할 조건을 안내합니다.')+
 `<section class="hb-panel hb-narrow"><h2>공개 지표로 비교합니다</h2><ul class="hb-list">
 <li>사용성: 구글 플레이 다운로드와 평점</li><li>애정: 공개 평가 수</li>
 <li>인기: 네이버 검색 관심도 ${appMode?'미반영':'반영 대상'}</li></ul>
 <p class="hb-sub">${metricNote} 다운로드는 정확한 누적 횟수가 아닌 공개 구간 하한값입니다.
 평점과 평가 수는 한국 지역 영문 Google Play 페이지에서 수집합니다. 국가·기기별 화면과 차이가 있을 수 있습니다.
 카드의 편집 별점은 순서를 표현하며 실측 앱 평점이 아닙니다. 주간 조정과 순위 제한은 설정된 경우에만 적용됩니다.</p>
 <h2>이용 전 체크리스트</h2><ul class="hb-list"><li>원하는 콘텐츠의 제공 여부와 저작권 계약</li>
 <li>가입 혜택의 인증 조건·유효기간·사용 제외 항목</li><li>이용권 자동결제와 해지·환불 방법</li>
 <li>모바일 지원과 프로그램 설치 권한</li></ul><p class="hb-note">순위는 참고용, 선택은 이용자 판단입니다.</p></section>`);
page('404.html','페이지를 찾을 수 없습니다 | '+brand,hero('페이지를 찾을 수 없어요','주소가 바뀌었거나 존재하지 않는 페이지입니다.')+
 `<a class="hb-button" href="${href('')}">홈으로 돌아가기</a>`);
const paths=['','picks.html','criteria.html',...rows.map(x=>'webhard/'+x.id+'/')];
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
 paths.map(p=>`<url><loc>${href(p)}</loc><lastmod>${data.updated}</lastmod></url>`).join('')+'</urlset>');
write('robots.txt',`User-agent: *\nAllow: /\nDisallow: ${new URL(base).pathname.replace(/\/$/,'')}/go/\nSitemap: ${href('sitemap.xml')}`);
write('llms.txt',`# ${brand}\n\n웹하드 혜택과 이용 조건 비교 안내.\n\n- [비교 목록](${href('')})\n- [기준](${href('criteria.html')})\n\n미수집 지표는 –로 표시. 별점은 편집 별점.`);
fs.writeFileSync(out+'/.nojekyll','');
console.log(`정적 페이지 생성 완료: 비교 ${rows.length}곳`);
