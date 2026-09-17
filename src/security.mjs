import {scrypt as scryptCb,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {db,now,audit} from './db.mjs';
const scrypt=promisify(scryptCb);
export const hashToken=s=>createHash('sha256').update(s).digest('hex');
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');return salt+':'+Buffer.from(await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024})).toString('hex');}
export async function verifyPassword(password,encoded){try{const [salt,key]=encoded.split(':');const test=Buffer.from(await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}));const stored=Buffer.from(key,'hex');return test.length===stored.length&&timingSafeEqual(test,stored);}catch{return false;}}
export const origin=()=>new URL(process.env.APP_ORIGIN||'http://localhost:8788').origin;
export function sameOrigin(req){if(req.headers.origin!==origin())throw Object.assign(new Error('Недопустимый источник запроса'),{status:403});}
export function session(req){const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('sst_session='))?.slice(12);if(!token)return null;const row=db.prepare('SELECT u.id,u.email,u.name,u.role,s.csrf,s.token FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>? AND u.active=1').get(hashToken(token),Date.now());return row||null;}
export function requireUser(req,admin=false){const u=session(req);if(!u)throw Object.assign(new Error('Требуется вход'),{status:401});if(admin&&u.role!=='admin')throw Object.assign(new Error('Недостаточно прав'),{status:403});if(!['GET','HEAD'].includes(req.method)){sameOrigin(req);if(req.headers['x-csrf-token']!==u.csrf)throw Object.assign(new Error('Обновите страницу и повторите запрос'),{status:403});}return u;}
export function cookie(value,maxAge=28800){return `sst_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${origin().startsWith('https:')?'; Secure':''}`;}
export function createSession(user){const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hashToken(token),user.id,csrf,Date.now()+28800000);audit(user,'Вход');return {token,csrf};}
const buckets=new Map();
export function limit(key,max,windowMs){const time=Date.now();if(buckets.size>10000)for(const[k,v]of buckets)if(v.until<time)buckets.delete(k);let row=buckets.get(key);if(!row||row.until<time){row={count:0,until:time+windowMs};buckets.set(key,row);}if(++row.count>max)throw Object.assign(new Error('Слишком много попыток. Попробуйте позже.'),{status:429});}
export const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
