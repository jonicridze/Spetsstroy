import {readdir,readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const dir of ['src','scripts','tests','dist'])for(const file of await readdir(dir)){if(!/\.(mjs|js)$/.test(file))continue;const r=spawnSync(process.execPath,['--check',dir+'/'+file],{encoding:'utf8'});if(r.status)throw Error(r.stderr);}
for(const path of ['dist/assets/emblem.svg','dist/assets/emblem-white.svg','dist/assets/construction.webp','dist/assets/vendor/three.module.js','dist/assets/vendor/three.core.js','dist/admin.js','dist/admin.css','dist/app.js','dist/experience.css','dist/logo.js'])await access(path);
const lock=JSON.parse(await readFile('package-lock.json','utf8'));if(lock.packages[''].version!=='2.0.0')throw Error('Lockfile version mismatch');
console.log('Syntax, local assets and dependency lockfile: OK. Server-rendered project has no bundling step.');
