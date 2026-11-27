const fs=require('node:fs'),sharp=require('sharp');
(async()=>{
 for(const f of fs.readdirSync('assets').filter(f=>f.endsWith('.png')&&!f.startsWith('harbor-'))){
  const b=await sharp('assets/'+f).trim().png().toBuffer();fs.writeFileSync('assets/'+f,b);
 }
 await sharp('assets/harbor-icon.svg').resize(192,192).png().toFile('assets/harbor-icon-192.png');
 const png=await sharp('assets/harbor-icon.svg').resize(32,32).png().toBuffer();
 const head=Buffer.alloc(22);head.writeUInt16LE(1,2);head.writeUInt16LE(1,4);head[6]=32;head[7]=32;
 head.writeUInt16LE(1,10);head.writeUInt16LE(32,12);head.writeUInt32LE(png.length,14);head.writeUInt32LE(22,18);
 fs.writeFileSync('assets/harbor-icon.ico',Buffer.concat([head,png]));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
 <rect width="1200" height="630" fill="#edf2ff"/><rect x="60" y="60" width="1080" height="510" rx="36" fill="white"/>
 <text x="110" y="190" font-size="26" fill="#315fdd" font-family="sans-serif">WEBHARD GUIDE</text>
 <text x="110" y="300" font-size="58" fill="#182239" font-family="sans-serif">P2P사이트 · 웹하드 순위</text>
 <text x="110" y="380" font-size="32" fill="#57647a" font-family="sans-serif">10곳의 가입 혜택과 이용 조건 비교</text>
 <text x="110" y="480" font-size="26" fill="#315fdd" font-family="sans-serif">혜택나침반</text></svg>`;
 await sharp(Buffer.from(svg)).png().toFile('assets/harbor-og.png');
})();
