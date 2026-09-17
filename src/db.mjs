import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {defaults} from './content.mjs';
export const dataDir=resolve(process.env.DATA_DIR||'data');mkdirSync(dataDir,{recursive:true});
export const db=new DatabaseSync(resolve(dataDir,'sst.sqlite'),{timeout:5000});
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','editor')),password TEXT NOT NULL,active INTEGER DEFAULT 1,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS content(id TEXT PRIMARY KEY,kind TEXT NOT NULL,slug TEXT NOT NULL,title TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),position INTEGER DEFAULT 0,data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(kind,slug));
CREATE INDEX IF NOT EXISTS content_public ON content(kind,status,position);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS previews(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,data TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,path TEXT NOT NULL,variants TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL,archived INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,data TEXT NOT NULL,status TEXT DEFAULT 'new',notes TEXT DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS lead_files(id TEXT PRIMARY KEY,lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,path TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,actor TEXT NOT NULL,action TEXT NOT NULL,entity_id TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER DEFAULT 0,error TEXT DEFAULT '',created_at TEXT NOT NULL);`);
export const now=()=>new Date().toISOString();
export const id=()=>randomUUID();
export function settings(){const result=structuredClone(defaults);for(const row of db.prepare('SELECT key,value FROM settings').all())result[row.key]=JSON.parse(row.value);return result;}
export function list(kind,all=false){return db.prepare(`SELECT * FROM content WHERE kind=? ${all?'':"AND status='published'"} ORDER BY position ASC,updated_at DESC`).all(kind).map(unpack).filter(x=>all||kind!=='vacancies'||!x.closed);}
export function unpack(row){return row?{...JSON.parse(row.data),id:row.id,kind:row.kind,slug:row.slug,title:row.title,status:row.status,position:row.position,created_at:row.created_at,updated_at:row.updated_at}:null;}
export function audit(user,action,entity=''){db.prepare('INSERT INTO audit_log(user_id,actor,action,entity_id,created_at) VALUES(?,?,?,?,?)').run(user?.id||null,user?.name||'Система',action,entity,now());}
