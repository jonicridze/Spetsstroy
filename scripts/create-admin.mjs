import {db,id,now,audit} from '../src/db.mjs';
import {hashPassword} from '../src/security.mjs';
const email=process.env.SST_ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.SST_ADMIN_PASSWORD,name=process.env.SST_ADMIN_NAME||'Администратор';
if(!email||!email.includes('@')||!password||password.length<14){console.error('Задайте SST_ADMIN_EMAIL и SST_ADMIN_PASSWORD (не менее 14 символов) в окружении. Готового пароля по умолчанию нет.');process.exit(1);}
if(db.prepare('SELECT id FROM users WHERE email=?').get(email)){console.error('Пользователь уже существует. Для смены пароля используйте административную панель.');process.exit(1);}
const uid=id();db.prepare('INSERT INTO users(id,email,name,role,password,created_at) VALUES(?,?,?,?,?,?)').run(uid,email,name,'admin',await hashPassword(password),now());audit({id:uid,name},'Создан первый администратор',uid);console.log('Администратор создан. Удалите SST_ADMIN_PASSWORD из окружения.');db.close();
