const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});fs.mkdirSync('checks',{recursive:true});
 const base=process.env.SCREEN_URL||'http://localhost:4173';
 const widths=[360,390,768,1024,1440];let count=0;
 for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:780},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>{window.hbViolations=[];document.addEventListener('securitypolicyviolation',e=>{
 window.hbViolations.push(e.violatedDirective);});});
 await page.goto(base,{waitUntil:'networkidle'});
 const urls=await page.locator('a').evaluateAll(links=>[...new Set(links.map(a=>a.href))]);
 for(const url of urls.filter(u=>u.startsWith(base)&&!u.includes('/go/'))){
 await page.goto(url,{waitUntil:'networkidle'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`가로 넘침 ${width} ${url}`);
 assert(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),`이미지 ${url}`);
 assert.deepEqual(await page.evaluate(()=>window.hbViolations),[]);
 count++;
 }
 await page.goto(base,{waitUntil:'networkidle'});
 if(width===360){const third=await page.locator('.hb-card').nth(2).boundingBox();assert(third.y+third.height<=780);}
 await page.screenshot({path:`checks/harbor-${width}.png`,fullPage:true});
 const encoded=await page.locator('a[href*="/go/"]').first().getAttribute('href');
 await page.goto(encoded);let redirected=false;
 await page.route('https://ondisk.co.kr/**',r=>{redirected=true;return r.fulfill({status:200,body:'공식 연결 확인'})});
 await page.getByRole('button',{name:'공식 사이트 열기'}).click();await page.waitForTimeout(300);
 assert(redirected,'이동 경로');assert.equal(errors.length,0,errors.join('\n'));
 await page.close();
 }
 const p=await browser.newPage({javaScriptEnabled:false});await p.goto(base);
 assert.equal(await p.locator('.hb-card').count(),10);assert.equal(await p.locator('details').count(),10);
 await p.close();await browser.close();console.log(`5개 화면 폭, ${count}페이지, JS 없이 본문, 외부 이동 통과`);
})().catch(e=>{console.error(e);process.exit(1)});
