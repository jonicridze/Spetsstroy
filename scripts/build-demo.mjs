import {mkdir,cp,writeFile,readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// Always render from an empty database: never export private CMS data.
const scratch=await mkdtemp(join(tmpdir(),'sst-demo-'));
process.env.DATA_DIR=scratch;
const repo=process.env.GITHUB_REPOSITORY||'jonicridze/Spetsstroy';
const [owner,name]=repo.split('/');
const base=name.toLowerCase()===owner.toLowerCase()+'.github.io'?'/':'/'+name+'/';
const host='https://'+owner+'.github.io';
process.env.APP_ORIGIN=host;
const {renderPage,notFound}=await import('../src/render.mjs');
const {defaults}=await import('../src/content.mjs');
const {db,id,now}=await import('../src/db.mjs');
const {demoProjects}=await import('../src/demo-projects.mjs');
for(const [i,p] of demoProjects.entries())db.prepare('INSERT INTO content VALUES(?,?,?,?,?,?,?,?,?)').run(id(),'projects',p.slug,p.title,'published',i,JSON.stringify(p),now(),now());
const out=resolve('pages');
await mkdir(out,{recursive:true});
await cp('dist/assets',join(out,'assets'),{recursive:true});
for(const file of ['experience.css','app.js','logo.js','architecture.css','architecture.js']){
 let source=await readFile('dist/'+file,'utf8');
 source=source.replaceAll("'/assets/","'"+base+'assets/').replaceAll('"/assets/','"'+base+'assets/');
 await writeFile(join(out,file),source);
}
function adapt(html){
 html=html.replace(/(["'])\/(?!\/)([^"']*)\1/g,(match,quote,path)=>{
  const [route,hash]=path.split('#');
  const target=route&&!route.includes('.')&&!route.endsWith('/')?route+'/':route;
  return quote+base+target+(hash?'#'+hash:'')+quote;
 });
 html=html.replaceAll(host+'/',host+base);
 html=html.replace('<head>','<head><meta name="robots" content="noindex,nofollow">');
 // Preserve the form design but make its non-operational state explicit, even without JS.
 html=html.replace('id="project-form"','id="demo-project-form"');
 html=html.replace(/<button([^>]*type="submit"[^>]*)>[\s\S]*?<\/button>/g,'<button type="button" disabled>Демонстрация — отправка отключена</button><p role="note">Это демонстрация дизайна. Форма не отправляет и не сохраняет данные.</p>');
 return html;
}
try{
 for(const route of ['/','/company','/capabilities','/projects','/news','/suppliers','/contacts','/privacy',...demoProjects.map(p=>'/projects/'+p.slug)]){
  const dir=join(out,route.slice(1));await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'index.html'),adapt(renderPage(route,defaults)));
 }
 await writeFile(join(out,'404.html'),adapt(notFound(defaults)));
 await writeFile(join(out,'.nojekyll'),'');
 await writeFile(join(out,'robots.txt'),'User-agent: *\nDisallow: /\n');
 console.log('Design demo built: '+host+base);
}finally{db.close();await rm(scratch,{recursive:true,force:true});}
