import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
import {page,record,table as htmlTable,writeOut} from './lib/render.mjs';
export const reads={
 properties:'select code,address,property_type,area_sqm,interest from properties order by code',
 assignments:'select code,address,client,valuer,due_date,status,currency from work_queue order by due_date nulls first,code',
 comparables:'select code,address,property_type,area_sqm,sale_amount,currency,sale_date,verification_ref from comparables order by code',
 'work-in-hand':"select code,address,valuer,due_date,overdue_days,issues from work_queue where status='active' order by due_date nulls first,code",
 attention:"select code,valuer,due_date,overdue_days,issues from work_queue where status='active' and (issues>0 or overdue_days>0 or due_date is null) order by due_date nulls first,code",
 'inspection-plan':"select a.code,p.address,a.valuer,a.due_date from assignments a join properties p on p.id=a.property_id where a.status='active' and a.inspection_date is null order by a.due_date nulls first,a.code",
 compliance:'select code,rule,issue from compliance_issues order by code,rule',
 'comp-check':'select assignment,comparable,sale_date,currency,same_currency,same_type,known_at_valuation,verification_ref from comparison_grid order by assignment,comparable',
 'review-queue':"select code,valuer,issues,reviewed_at,case when reviewed_at>=changed_at then 'current' else 'review needed' end as review from work_queue where status='active' order by code",
 'review-ready':'select code,address,valuer,currency,reviewed_at from review_ready order by code',
 indications:'select code,currency,area_sqm,comps,indicated_amount,conclusion_amount,conclusion_variance_pct from indications order by code',
 imports:'select source,kind,rows_count,actor,created_at from imports order by created_at',
};
const entities=['properties','assignments','comparables'];
export const commands=[...Object.keys(reads),'show','history','insights','add-property','add','add-comp','link-comp','scope','inspect','evidence','conclude','review','close','reopen','log','import','export','draft-engagement'];
export function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Date must be a real YYYY-MM-DD date');return s;}
function decimal(s,{negative=false,zero=false,max=1e12,scale=2}={}){
 const re=new RegExp(`^${negative?'-?':''}\\d+(?:\\.\\d{1,${scale}})?$`);
 if(!re.test(String(s))||!Number.isFinite(Number(s))||Number(s)>max||(!negative&&(zero?Number(s)<0:Number(s)<=0)))throw Error('Invalid decimal value: '+s);
 return String(s);
}
const currency=s=>{if(!/^[A-Z]{3}$/.test(s))throw Error('Currency requires an uppercase three-letter code');return s;};
function args(argv){const flags={},pos=[];for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');const key=a.slice(2,i<0?undefined:i);if(key in flags)throw Error('Duplicate flag '+key);flags[key]=i<0?true:a.slice(i+1);}else pos.push(a);}return {flags,pos};}
const req=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error('Required --'+k+'=value');return o[k].trim();};
export async function resolve(db,entity,term){
 if(!entities.includes(entity))throw Error('Choose properties, assignments or comparables');
 if(!term)throw Error('Supply a record code or name');
 const name=entity==='assignments'?'client':'address';
 const rows=await db.query(`select id,code,${name} as name from ${entity} order by code`);
 const lower=term.toLowerCase();
 const exact=rows.filter(r=>r.id===term||r.code.toLowerCase()===lower);
 const found=exact.length?exact:rows.filter(r=>r.id.startsWith(lower)||r.code.toLowerCase().includes(lower)||r.name.toLowerCase().includes(lower));
 if(found.length!==1)throw Error((found.length?'Ambiguous record. Candidates: ':'No match. Available: ')+(found.length?found:rows).map(r=>r.code+' '+r.name+' '+r.id).join('\n'));
 return (await db.query(`select * from ${entity} where id=$1`,[found[0].id]))[0];
}
async function event(db,id,actor,action,detail){await db.query('insert into events(assignment_id,actor,action,detail) values($1,$2,$3,$4)',[id,actor,action,JSON.stringify(detail)]);}
async function active(db,term){const a=await resolve(db,'assignments',term);if(a.status!=='active')throw Error('Closed assignment: reopen with a reason before editing');return a;}
export const questions=[
 'Which overdue jobs still have evidence gaps?',
 'Which valuers carry the most open work?',
 'Which selected sales were unverified?',
 'Which selected sales postdate the valuation?',
 'Which selections mix currencies or property types?',
 'Which assignments still need an inspection?',
 'Which valuations differ most from the weighted sales indication?',
 'Which client has the most overdue assignments?',
 'Which reviews became stale after evidence changed?',
 'Which jobs are complete and have a current peer review?'
];
const insightSql=[
 "select code,valuer,overdue_days,issues from work_queue where status='active' and overdue_days>0 and issues>0 order by code",
 "select valuer,count(*)::int as jobs from assignments where status='active' group by valuer order by jobs desc,valuer",
 "select assignment,comparable from comparison_grid where coalesce(trim(verification_ref),'')='' order by assignment,comparable",
 'select assignment,comparable,sale_date from comparison_grid where known_at_valuation=false order by assignment,comparable',
 'select assignment,comparable,currency,same_currency,same_type from comparison_grid where not same_currency or not same_type order by assignment,comparable',
 reads['inspection-plan'],
 'select code,currency,indicated_amount,conclusion_amount,conclusion_variance_pct from indications where conclusion_amount is not null order by abs(conclusion_variance_pct) desc nulls last,code',
 "select client,count(*)::int as overdue_jobs from work_queue where status='active' and overdue_days>0 group by client order by overdue_jobs desc,client",
 'select code,reviewed_at,changed_at from work_queue where reviewed_at<changed_at order by code',
 reads['review-ready']
];
async function insert(db,entity,fields){const keys=Object.keys(fields);return (await db.query(`insert into ${entity}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(fields)))[0];}
async function update(db,id,fields){const keys=Object.keys(fields);return (await db.query(`update assignments set ${keys.map((k,i)=>k+'=$'+(i+2)).join(',')} where id=$1 returning *`,[id,...Object.values(fields)]))[0];}
const allowed={
 'add-property':['code','address','type','area','interest','source'],
 add:['code','property','client','valuer','due','date','currency'],
 'add-comp':['code','address','type','area','amount','currency','date','source','verification'],
 'link-comp':['comp','adjustment','weight','reason'],
 scope:['purpose','users','basis','reference','conflict','date','assumptions'],
 inspect:['date','reference'], evidence:['kind','reference','note'],
 conclude:['amount','rationale','assumptions'],review:['reference','note'],close:['note'],reopen:['note'],log:['note'],
 import:['kind','source','map','dry-run','currency','valuer'],export:['out'], 'draft-engagement':[],
};
export async function run(db,argv){
 const {flags:f,pos}=args(argv),[cmd,...rest]=pos;
 if(!cmd||cmd==='help'||f.help)return {commands,usage:'node scripts/appraisal.mjs COMMAND [record] --field=value [--json]. See docs/cli.md.'};
 if(!commands.includes(cmd))throw Error('Unknown command '+cmd);
 for(const key of Object.keys(f))if(!['json','actor',...(allowed[cmd]||[])].includes(key))throw Error('Unknown flag --'+key+' for '+cmd);
 const arity=cmd==='show'?2:cmd==='import'?2:['history','link-comp','scope','inspect','evidence','conclude','review','close','reopen','log','draft-engagement'].includes(cmd)?1:0;
 if(rest.length!==arity)throw Error(cmd+' requires '+arity+' positional argument(s)');
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='show'){
  const r=await resolve(db,rest[0],rest[1]);if(rest[0]!=='assignments')return r;
  return {record:r,property:(await db.query('select * from properties where id=$1',[r.property_id]))[0],comparables:await db.query('select * from comparison_grid where assignment_id=$1 order by comparable',[r.id]),evidence:await db.query('select * from evidence where assignment_id=$1 order by created_at',[r.id]),issues:await db.query('select rule,issue from compliance_issues where assignment_id=$1 order by rule',[r.id])};
 }
 if(cmd==='history'){const a=await resolve(db,'assignments',rest[0]);return db.query('select actor,action,detail,created_at from events where assignment_id=$1 order by created_at,id',[a.id]);}
 if(cmd==='insights'){const out=[];for(let i=0;i<questions.length;i++)out.push({question:questions[i],rows:await db.query(insightSql[i])});return out;}
 if(cmd==='export'){
  const output=path.resolve(req(f,'out'));const data={format:'appraisal-workfile-v1',exported_at:new Date().toISOString()};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const entity of [...entities,'selections','evidence','reviews','events','imports'])data[entity]=await db.query('select * from '+entity+' order by id');}finally{await db.exec('ROLLBACK');}
  fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file:output,records:Object.values(data).filter(Array.isArray).reduce((n,r)=>n+r.length,0)};
 }
 if(cmd==='draft-engagement'){
  const a=await resolve(db,'assignments',rest[0]);const issues=await db.query('select rule,issue from compliance_issues where assignment_id=$1 order by rule',[a.id]);
  return {file:writeOut('drafts','engagement-'+a.id+'-'+Date.now(),page({title:'Draft engagement scope',subtitle:'Internal draft. Confirm instructions and terms before client issue.',sections:[{title:'Recorded instructions',html:record(a,['code','client','valuer','purpose','intended_users','basis','valuation_date','currency','scope_ref','assumptions'])},{title:'Evidence still needed',html:htmlTable(issues)}]}))};
 }
 const actor=req(f,'actor');
 await db.exec('BEGIN');try{
  // Serialize operator writes. A reviewed result cannot race a second CLI edit.
  await db.exec('LOCK TABLE assignments,properties,comparables,selections,evidence,reviews,imports IN SHARE ROW EXCLUSIVE MODE');
  let result;
  if(cmd==='import')result=await importCsv(db,rest,f,actor);
  else if(cmd==='add-property')result=await insert(db,'properties',{code:req(f,'code'),address:req(f,'address'),property_type:req(f,'type'),area_sqm:f.area?decimal(f.area):null,interest:f.interest||null,source_ref:f.source||null});
  else if(cmd==='add'){const p=await resolve(db,'properties',req(f,'property'));result=await insert(db,'assignments',{code:req(f,'code'),property_id:p.id,client:req(f,'client'),valuer:req(f,'valuer'),due_date:date(req(f,'due')),valuation_date:date(req(f,'date')),currency:currency(req(f,'currency'))});}
  else if(cmd==='add-comp')result=await insert(db,'comparables',{code:req(f,'code'),address:req(f,'address'),property_type:req(f,'type'),area_sqm:decimal(req(f,'area')),sale_amount:decimal(req(f,'amount')),currency:currency(req(f,'currency')),sale_date:date(req(f,'date')),source_ref:req(f,'source'),verification_ref:f.verification||null});
  else {
   const a=cmd==='reopen'?await resolve(db,'assignments',rest[0]):await active(db,rest[0]);
   if(cmd==='link-comp'){
    const c=await resolve(db,'comparables',req(f,'comp'));
    if(c.currency!==a.currency)throw Error('Comparable currency must match assignment');
    const p=(await db.query('select * from properties where id=$1',[a.property_id]))[0];
    if(c.property_type!==p.property_type)throw Error('Comparable property type must match');
    if(!a.valuation_date||c.sale_date>a.valuation_date)throw Error('Comparable sale is after valuation date or valuation date missing');
    result=(await db.query(`insert into selections(assignment_id,comparable_id,adjustment_pct,weight,reason) values($1,$2,$3,$4,$5) on conflict(assignment_id,comparable_id) do update set adjustment_pct=excluded.adjustment_pct,weight=excluded.weight,reason=excluded.reason returning *`,[a.id,c.id,decimal(f.adjustment||'0',{negative:true,zero:true,max:100,scale:3}),decimal(req(f,'weight'),{scale:4}),req(f,'reason')]))[0];
   }else if(cmd==='scope')result=await update(db,a.id,{purpose:req(f,'purpose'),intended_users:req(f,'users'),basis:req(f,'basis'),scope_ref:req(f,'reference'),conflict_ref:req(f,'conflict'),valuation_date:date(req(f,'date')),assumptions:req(f,'assumptions')});
   else if(cmd==='inspect'){
    const d=date(req(f,'date'));if(d>new Date().toISOString().slice(0,10))throw Error('Inspection cannot be recorded in the future');
    result=await update(db,a.id,{inspection_date:d,inspection_ref:req(f,'reference')});
   }else if(cmd==='evidence')result=await insert(db,'evidence',{assignment_id:a.id,kind:req(f,'kind'),reference:req(f,'reference'),note:req(f,'note'),actor});
   else if(cmd==='conclude')result=await update(db,a.id,{conclusion_amount:decimal(req(f,'amount')),rationale:req(f,'rationale'),assumptions:req(f,'assumptions')});
   else if(cmd==='review'){
    if(actor.toLowerCase()===a.valuer.trim().toLowerCase())throw Error('Peer reviewer must differ from the valuer');
    const issues=await db.query('select rule,issue from compliance_issues where assignment_id=$1 order by rule',[a.id]);
    if(issues.length)throw Error('Review blocked: '+issues.map(i=>i.rule+': '+i.issue).join('; '));
    result=await insert(db,'reviews',{assignment_id:a.id,reviewer:actor,reference:req(f,'reference'),note:req(f,'note')});
   }else if(cmd==='close'){
    req(f,'note');if(!(await db.query('select id from review_ready where id=$1',[a.id])).length)throw Error('Close needs a current peer review and clear checks');
    // Closing changes only workflow state; it does not claim a report was issued.
    result=await update(db,a.id,{status:'closed'});
   }else if(cmd==='reopen'){if(a.status!=='closed')throw Error('Only a closed assignment can reopen');req(f,'note');result=await update(db,a.id,{status:'active'});}
   else if(cmd==='log')result={assignment_id:a.id,note:req(f,'note')};
   await event(db,a.id,actor,cmd,{...result,reason:f.note||f.reason||null});
  }
  if(['add-property','add','add-comp','import'].includes(cmd))await event(db,cmd==='add'?result.id:null,actor,cmd,result);
  await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
async function importCsv(db,[vendor,file],f,actor){
 if(vendor!=='valcre')throw Error('Import supports valcre');
 const kind=req(f,'kind');if(!['properties','jobs','sales'].includes(kind))throw Error('Import kind must be properties, jobs or sales');
 const source=req(f,'source'),text=fs.readFileSync(file,'utf8'),map=f.map?JSON.parse(fs.readFileSync(f.map,'utf8')):{};
 const mappingFields=['code','address','type','area','interest','reference','client','valuer','due','date','currency','amount','verification','property'];
 for(const [key,value] of Object.entries(map))if(!mappingFields.includes(key)||typeof value!=='string')throw Error('Invalid column mapping '+key);
 const digest=crypto.createHash('sha256').update(JSON.stringify({text,map,currency:f.currency||'',valuer:f.valuer||''})).digest('hex');
 if((await db.query('select id from imports where source=$1 and kind=$2 and digest=$3',[source,kind,digest])).length)return {source,kind,imported:0,duplicate_batch:true};
 const rows=parseCsv(text);if(!rows.length)throw Error('No CSV records');
 const get=(r,k,...names)=>map[k]?pick(r,map[k]):pick(r,...names);
 let n=0;
 for(const r of rows){
  n++;const v=(k,...names)=>get(r,k,...names).trim();
  const need=(k,...names)=>{const value=v(k,...names);if(!value)throw Error('CSV row '+(n+1)+': missing '+k+'; use --map for your headings');return value;};
  const code=need('code',kind==='jobs'?'Job Number':kind==='sales'?'Sale ID':'Property ID','Code','Valcre ID','ID');
  if(kind==='properties')await insert(db,'properties',{code,address:need('address','Address','Property Address','AddressStreet','Valcre AddressStreet'),property_type:v('type','Property Type','Type')||'unclassified',area_sqm:v('area','Area Sqm','Area (sqm)')?decimal(v('area','Area Sqm','Area (sqm)')):null,interest:v('interest','Interest')||null,source_ref:v('reference','Source Reference')||source});
  else if(kind==='sales')await insert(db,'comparables',{code,address:need('address','Address','Property Address'),property_type:need('type','Property Type','Type'),area_sqm:decimal(need('area','Area Sqm','Area (sqm)')),sale_amount:decimal(need('amount','Sale Price','Sale Amount')),currency:currency(v('currency','Currency')||req(f,'currency')),sale_date:date(need('date','Sale Date')),source_ref:v('reference','Source Reference')||source,verification_ref:v('verification','Verification Reference')||null});
  else{
   const prop=await resolve(db,'properties',need('property','Property ID','Property Code','Property'));
   await insert(db,'assignments',{code,property_id:prop.id,client:need('client','Client','Client Name'),valuer:v('valuer','Appraiser','Valuer','Assigned To')||req(f,'valuer'),currency:currency(v('currency','Currency')||req(f,'currency')),due_date:v('due','Due Date')?date(v('due','Due Date')):null,valuation_date:v('date','Valuation Date','Effective Date')?date(v('date','Valuation Date','Effective Date')):null,source_key:source+':'+code});
  }
 }
 await insert(db,'imports',{source,kind,digest,rows_count:rows.length,original_rows:JSON.stringify(rows),actor});
 return {source,kind,imported:rows.length,dry_run:Boolean(f['dry-run']),note:'Imported records require scope and evidence review; no approval or sign-off imported.'};
}
function print(result){
 if(Array.isArray(result)){
  if(result[0]?.question){for(const q of result){console.log('\n'+q.question);print(q.rows);}return;}
  if(!result.length){console.log('(none)');return;}
  console.log(table(result,Object.keys(result[0]).map(k=>({key:k,label:k,width:70,format:v=>typeof v==='object'&&v!==null?JSON.stringify(v):v}))));
 }else console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));else print(result);}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
