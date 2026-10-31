import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'appraisal-test-'));
process.env.DATA_DIR=path.join(temp,'db');process.env.OUTPUT_DIR=temp;process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'';
const {getDb,REPO_ROOT}=await import('./lib/db.mjs');const {migrate}=await import('./migrate.mjs');const {seed}=await import('./seed.mjs');const {run,commands,reads,date}=await import('./appraisal.mjs');const {parseCsv}=await import('./lib/csv.mjs');const {table:htmlTable}=await import('./lib/render.mjs');
const db=await getDb(),schema='appraisal_test_'+Date.now(),visited=new Set();let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};const ok=x=>{assert.ok(x);checks++;};
const call=(...a)=>{visited.add(a[0]);return run(db,a);};const fail=async(a,re)=>{await assert.rejects(()=>call(...a),re);checks++;};
const actor='--actor=Operator';const count=async t=>Number((await db.query('select count(*) n from '+t))[0].n);
const file=(n,text)=>{const p=path.join(temp,n);fs.writeFileSync(p,text);return p;};
const invoke=(script,args=[])=>{const env={...process.env};if(db.mode==='postgres'){const u=new URL(process.env.TEST_DATABASE_URL);u.searchParams.set('options','-c search_path='+schema);env.DATABASE_URL=u.href;}return spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts',script),...args],{cwd:REPO_ROOT,env,encoding:'utf8'});};
try{
 if(db.mode==='postgres')await db.exec('create schema '+schema+'; set search_path to '+schema);
 eq((await migrate(db)).ran.length,1);eq((await migrate(db)).ran.length,0);await seed(db);await seed(db);eq(await count('assignments'),3);
 for(const cmd of Object.keys(reads))ok(Array.isArray(await call(cmd)));
 eq((await call('insights')).length,10);eq((await call('show','assignments','job-001')).comparables.length,2);

 await fail(['show','properties','Harbour'],/Ambiguous/);await fail(['show','assignments','absent'],/Available/);await fail(['show','events','x'],/Choose/);
 eq((await call('show','comparables','sale-001')).code,'SALE-001');
 const indication=(await call('indications')).find(x=>x.code==='JOB-001');eq(Number(indication.indicated_amount),2250000);eq(Number(indication.conclusion_variance_pct),0);
 eq((await call('compliance')).filter(r=>r.code==='JOB-001').length,0);ok((await call('compliance')).some(r=>r.rule==='STALE'));
 await fail(['review','JOB-002','--reference=peer','--note=checked',actor],/Review blocked/);
 await fail(['review','JOB-001','--reference=peer','--note=checked','--actor=mere'],/must differ/);
 await call('review','JOB-001','--reference=peer-check','--note=Evidence inspected','--actor=Reviewer');eq((await call('review-ready')).length,1);
 await call('evidence','JOB-001','--kind=market','--reference=new-market','--note=Additional source',actor);eq((await call('review-ready')).length,0);
 await fail(['close','JOB-001','--note=Done',actor],/current peer review/);
 await call('conclude','JOB-001','--amount=2260000','--rationale=Updated judgement','--assumptions=Vacant possession',actor);
 await call('review','JOB-001','--reference=peer-two','--note=Checked new conclusion','--actor=Reviewer');
 await call('close','JOB-001','--note=Workfile completed',actor);await fail(['conclude','JOB-001','--amount=5','--rationale=x','--assumptions=y',actor],/Closed/);
 await call('reopen','JOB-001','--note=New instruction',actor);eq((await call('review-ready')).length,0);
 await call('add-property','--code=TEST-P','--address=99 Test Road','--type=industrial','--area=1000','--interest=Freehold','--source=test-title',actor);
 await call('add','--code=TEST-J','--property=test-p','--client=Test Client','--valuer=Mere','--due=2026-11-20','--date=2026-10-01','--currency=NZD',actor);
 await call('scope','TEST-J','--purpose=Internal planning','--users=Directors','--basis=Market value','--reference=Terms-1','--conflict=Check-1','--date=2026-10-01','--assumptions=Vacant possession',actor);
 await call('inspect','TEST-J','--date=2026-09-30','--reference=Inspection-1',actor);
 await call('add-comp','--code=TEST-S','--address=98 Test Road','--type=industrial','--area=1000','--amount=2000000','--currency=NZD','--date=2026-09-01','--source=Deed-1','--verification=Call-1',actor);
 await call('link-comp','TEST-J','--comp=TEST-S','--adjustment=10','--weight=1','--reason=Location adjustment',actor);
 eq(Number((await call('indications')).find(x=>x.code==='TEST-J').indicated_amount),2200000);
 await fail(['link-comp','TEST-J','--comp=SALE-003','--weight=1','--reason=test',actor],/type/);
 await call('add-comp','--code=FOREIGN','--address=Foreign Road','--type=industrial','--area=1000','--amount=2000000','--currency=AUD','--date=2026-09-01','--source=Foreign-source',actor);
 await fail(['link-comp','TEST-J','--comp=FOREIGN','--weight=1','--reason=test',actor],/currency/);
 await call('add-comp','--code=AFTER','--address=Later Road','--type=industrial','--area=1000','--amount=2000000','--currency=NZD','--date=2026-10-02','--source=Later-source',actor);
 await fail(['link-comp','TEST-J','--comp=AFTER','--weight=1','--reason=test',actor],/after valuation/);
 await fail(['inspect','TEST-J','--date=2999-01-01','--reference=x',actor],/future/);
 await fail(['conclude','TEST-J','--amount=1.001','--rationale=x','--assumptions=x',actor],/Invalid decimal/);
 await fail(['scope','TEST-J',actor,'--unknown=x'],/Unknown flag/);
 await fail(['log','TEST-J','--note=x'],/actor/);await call('log','TEST-J','--note=Internal note',actor);ok((await call('history','TEST-J')).length>=4);
 for(const value of ['2026-02-30','2026-13-01','02/01/2026']){assert.throws(()=>date(value));checks++;}
 eq(parseCsv('\ufeffCode,Text\r\nx,"a,b\nline"\r\n')[0].Text,'a,b\nline');assert.throws(()=>parseCsv('Code,code\na,b'),/unique/);checks++;
 ok(htmlTable([{text:'<script>alert(1)</script>'}]).includes('&lt;script&gt;'));
 const example=k=>path.join(REPO_ROOT,'examples','valcre-'+k+'.csv');
 let before=await count('properties');
 await call('import','valcre',example('properties'),'--kind=properties','--source=fixture','--dry-run',actor);eq(await count('properties'),before);eq(await count('imports'),0);
 await call('import','valcre',example('properties'),'--kind=properties','--source=fixture',actor);
 eq((await call('import','valcre',example('properties'),'--kind=properties','--source=fixture',actor)).duplicate_batch,true);
 await call('import','valcre',example('jobs'),'--kind=jobs','--source=fixture',actor);
 await call('import','valcre',example('sales'),'--kind=sales','--source=fixture',actor);eq(await count('imports'),3);
 const bad=file('bad.csv','Property ID,Address,Property Type,Area Sqm\nROLLBACK,First,office,100\nBROKEN,Second,office,-1\n');
 before=await count('properties');await fail(['import','valcre',bad,'--kind=properties','--source=bad',actor],/Invalid decimal/);eq(await count('properties'),before);eq(await count('imports'),3);
 const mapping=file('map.json',JSON.stringify({code:'Key',address:'Site',type:'Kind'}));const mapped=file('mapped.csv','Key,Site,Kind\nMAPPED,Test mapped address,office\n');
 await call('import','valcre',mapped,'--kind=properties','--source=mapped','--map='+mapping,actor);ok((await call('show','properties','MAPPED')).area_sqm===null);
 await fail(['import','valcre',example('jobs'),'--kind=jobs','--source=different',actor],/duplicate key/);
 await assert.rejects(()=>db.query("update events set actor='Changed'"),/Append-only/);checks++;
 await assert.rejects(()=>seed(db),/operated/);checks++;
 const ex=await call('export','--out='+path.join(temp,'all.json'));ok(fs.existsSync(ex.file));const exported=JSON.parse(fs.readFileSync(ex.file));eq(exported.assignments.length,await count('assignments'));ok(exported.imports[0].original_rows.length>0);
 await fail(['export','--out='+ex.file],/EEXIST/);
 const draft=await call('draft-engagement','TEST-J');ok(fs.readFileSync(draft.file,'utf8').includes('Internal draft'));
 await call('review','JOB-001','--reference=peer-final','--note=Final internal review','--actor=Reviewer');
 for(const c of commands)ok(visited.has(c));
 await db.close();
 for(const s of ['view.mjs','docs.mjs']){const r=invoke(s);eq(r.status,0);ok(r.stdout.includes(s==='view.mjs'?'view:':'document(s)'));}
 const doc=fs.readdirSync(path.join(temp,'docs-out','workfile'))[0];ok(fs.readFileSync(path.join(temp,'docs-out','workfile',doc),'utf8').includes('Not a signed valuation'));
 const json=invoke('appraisal.mjs',['attention','--json']);eq(json.status,0);ok(Array.isArray(JSON.parse(json.stdout)));
 const amb=invoke('appraisal.mjs',['show','properties','Harbour']);eq(amb.status,1);ok(amb.stderr.includes('Ambiguous'));
 console.log(`PASS: ${checks} assertions; all ${commands.length} CLI commands; migration, seed, evidence gates, arithmetic, imports, rollback, export, documents, views and real CLI processes (${process.env.TEST_DATABASE_URL?'PostgreSQL':'PGlite'}).`);
}finally{
 try{await db.close();}catch{}
 if(process.env.TEST_DATABASE_URL){const c=await getDb();try{await c.exec('drop schema if exists '+schema+' cascade');}finally{await c.close();}}
 fs.rmSync(temp,{recursive:true,force:true});
}
