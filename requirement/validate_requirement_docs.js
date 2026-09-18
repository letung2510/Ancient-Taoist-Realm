const fs=require('fs'), path=require('path');
const root=process.cwd();
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?walk(p):[p];});}
const files=walk(root).filter(p=>p.endsWith('.md')&&!p.includes(`${path.sep}archive-requirements${path.sep}`));
const broken=[], oddFences=[], encoding=[];
for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  const rel=path.relative(root,file);
  const fences=(text.match(/^\s*```/gm)||[]).length;
  if(fences%2) oddFences.push(`${rel}: ${fences} fences`);
  if(/SYSTEM_LOGIC_CATALOG_2026-09-16/.test(text)||/[\uFFFD]/.test(text)) encoding.push(rel);
  const re=/\[[^\]]*\]\(([^)]+)\)/g; let m;
  while((m=re.exec(text))){
    let target=m[1].trim().replace(/^<|>$/g,'');
    if(/^(https?:|mailto:|#)/i.test(target)) continue;
    target=target.split('#')[0].split('?')[0]; if(!target) continue;
    target=target.replaceAll('\\','/');
    const resolved=path.resolve(path.dirname(file),target);
    if(!fs.existsSync(resolved)) broken.push(`${rel}: ${target}`);
  }
}
console.log('active markdown:',files.length);
console.log('broken links:',broken.length); broken.slice(0,80).forEach(x=>console.log('BROKEN '+x));
console.log('odd code fences:',oddFences.length); oddFences.forEach(x=>console.log('FENCE '+x));
console.log('old-name or replacement-char files:',encoding.length); encoding.forEach(x=>console.log('ENCODING '+x));
if(broken.length||oddFences.length||encoding.length) process.exitCode=2;
