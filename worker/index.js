import { unzipSync, strFromU8 } from 'fflate';

const demo=[
  {id:'1',name:'Marta Ongay',sales:11,previousPosition:2,amount:0},
  {id:'2',name:'Andrea Torres',sales:9,previousPosition:1,amount:0},
  {id:'3',name:'Carlos Medina',sales:8,previousPosition:4,amount:0},
  {id:'4',name:'Fernanda López',sales:7,previousPosition:3,amount:0},
  {id:'5',name:'Jorge Pech',sales:6,previousPosition:5,amount:0}
];

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const nowIso=()=>new Date().toISOString();
const normalize=(s='')=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const slug=(s='')=>normalize(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,120) || crypto.randomUUID();

function decodeXml(s=''){
  return String(s)
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&apos;/g,"'").replace(/&amp;/g,'&')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
}

function colIndex(ref='A1'){
  const m=String(ref).match(/^([A-Z]+)/i);
  if(!m)return -1;
  return [...m[1].toUpperCase()].reduce((n,c)=>n*26+(c.charCodeAt(0)-64),0)-1;
}

function parseSharedStrings(xml=''){
  const out=[];
  const sis=xml.match(/<si\b[^>]*>[\s\S]*?<\/si>/g)||[];
  for(const si of sis){
    const parts=[...si.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m=>decodeXml(m[1]));
    out.push(parts.join(''));
  }
  return out;
}

function cellValue(cellXml, shared){
  const t=(cellXml.match(/\bt="([^"]+)"/)||[])[1]||'';
  if(t==='inlineStr'){
    const parts=[...cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m=>decodeXml(m[1]));
    return parts.join('');
  }
  const vm=cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
  if(!vm)return '';
  const raw=decodeXml(vm[1]);
  if(t==='s')return shared[Number(raw)] ?? '';
  if(t==='b')return raw==='1';
  if(t==='str')return raw;
  const n=Number(raw);
  return Number.isFinite(n)?n:raw;
}

function parseWorksheet(xml, shared){
  const rows=[];
  const rowMatches=xml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g)||[];
  for(const rowXml of rowMatches){
    const row=[];
    const cells=rowXml.match(/<c\b[^>]*>[\s\S]*?<\/c>/g)||[];
    for(const c of cells){
      const ref=(c.match(/\br="([A-Z]+\d+)"/i)||[])[1]||'';
      const idx=colIndex(ref);
      if(idx>=0)row[idx]=cellValue(c,shared);
    }
    rows.push(row);
  }
  return rows;
}

function parseMoney(v){
  if(typeof v==='number' && Number.isFinite(v))return v;
  if(v==null)return 0;
  let s=String(v).trim().replace(/[^0-9,.-]/g,'');
  if(!s)return 0;
  const lastComma=s.lastIndexOf(','), lastDot=s.lastIndexOf('.');
  if(lastComma>lastDot){
    s=s.replace(/\./g,'').replace(',','.');
  }else if(lastDot>lastComma && lastComma>=0){
    s=s.replace(/,/g,'');
  }else if(lastComma>=0 && lastDot<0){
    const decimals=s.length-lastComma-1;
    s=decimals===2?s.replace(',','.'):s.replace(/,/g,'');
  }
  const n=Number(s);
  return Number.isFinite(n)?n:0;
}

function excelSerialToDate(n){
  if(typeof n!=='number' || n<20000 || n>80000)return null;
  return new Date(Date.UTC(1899,11,30)+Math.round(n)*86400000);
}

function parseDateLike(v, now=new Date()){
  if(v instanceof Date && !Number.isNaN(v.valueOf()))return v;
  if(typeof v==='number')return excelSerialToDate(v);
  const s=String(v??'').trim();
  if(!s)return null;
  const m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if(m){
    let y=Number(m[3]); if(y<100)y+=2000;
    const d=new Date(Date.UTC(y,Number(m[2])-1,Number(m[1])));
    if(!Number.isNaN(d.valueOf()))return d;
  }
  const names={ENERO:0,FEBRERO:1,MARZO:2,ABRIL:3,MAYO:4,JUNIO:5,JULIO:6,AGOSTO:7,SEPTIEMBRE:8,SETIEMBRE:8,OCTUBRE:9,NOVIEMBRE:10,DICIEMBRE:11,ENE:0,FEB:1,MAR:2,ABR:3,MAY:4,JUN:5,JUL:6,AGO:7,SEP:8,SEPT:8,OCT:9,NOV:10,DIC:11};
  const ns=normalize(s);
  for(const [name,month] of Object.entries(names)){
    if(ns===name || ns.startsWith(name+' ')){
      const ym=ns.match(/(20\d{2})/);
      return new Date(Date.UTC(ym?Number(ym[1]):now.getUTCFullYear(),month,1));
    }
  }
  const d=new Date(s);
  return Number.isNaN(d.valueOf())?null:d;
}

function findHeader(rows){
  for(let r=0;r<Math.min(rows.length,30);r++){
    const vals=(rows[r]||[]).map(normalize);
    const advisor=vals.findIndex(v=>v==='ASESOR'||v.includes('ASESOR')||v==='VENDEDOR'||v.includes('VENDEDOR'));
    const amount=vals.findIndex(v=>v.includes('MONTO')||v==='IMPORTE'||v==='VENTA'||v.includes('MONTO DE VENTA'));
    if(advisor>=0 && amount>=0)return {row:r,advisor,amount,vals};
  }
  return null;
}

function findOptionalColumns(headerVals){
  const first=(tests)=>headerVals.findIndex(v=>tests.some(t=>v.includes(t)));
  return {
    client:first(['CLIENTE','PROSPECTO']),
    product:first(['PRODUCTO','DESARROLLO']),
    date:first(['FECHA','MES DE VENTA','MES VENTA','MES'])
  };
}

function parseWorkbook(buffer){
  const zip=unzipSync(new Uint8Array(buffer));
  const shared=zip['xl/sharedStrings.xml']?parseSharedStrings(strFromU8(zip['xl/sharedStrings.xml'])):[];
  const sheetNames=Object.keys(zip).filter(k=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(!sheetNames.length)throw new Error('No se encontraron hojas dentro del XLSX.');

  let chosen=null;
  for(const name of sheetNames){
    const rows=parseWorksheet(strFromU8(zip[name]),shared);
    const header=findHeader(rows);
    if(header){chosen={name,rows,header};break;}
  }
  if(!chosen)throw new Error('No encontré encabezados de ASESOR y MONTO DE VENTA en el Excel.');

  const optional=findOptionalColumns(chosen.header.vals);
  const now=new Date();
  const currentYear=now.getUTCFullYear(), currentMonth=now.getUTCMonth();
  const candidates=[];
  let parsedDateCount=0;

  for(let r=chosen.header.row+1;r<chosen.rows.length;r++){
    const row=chosen.rows[r]||[];
    const advisor=String(row[chosen.header.advisor]??'').trim();
    if(!advisor)continue;
    const na=normalize(advisor);
    if(na==='ASESOR'||na.includes('TOTAL'))continue;
    const dateVal=optional.date>=0?row[optional.date]:null;
    const parsedDate=optional.date>=0?parseDateLike(dateVal,now):null;
    if(parsedDate)parsedDateCount++;
    candidates.push({
      advisor,
      amount:parseMoney(row[chosen.header.amount]),
      product:optional.product>=0?String(row[optional.product]??'').trim():'',
      client:optional.client>=0?String(row[optional.client]??'').trim():'',
      date:parsedDate
    });
  }

  const canFilterByMonth=optional.date>=0 && candidates.length>0 && parsedDateCount/Math.max(candidates.length,1)>=0.5;
  const filtered=canFilterByMonth?candidates.filter(x=>x.date && x.date.getUTCFullYear()===currentYear && x.date.getUTCMonth()===currentMonth):candidates;
  const effective=filtered.length||!canFilterByMonth?filtered:candidates;

  const map=new Map();
  for(const item of effective){
    const key=normalize(item.advisor);
    const cur=map.get(key)||{name:item.advisor,sales:0,amount:0};
    cur.sales+=1;
    cur.amount+=item.amount||0;
    map.set(key,cur);
  }

  const advisors=[...map.values()].sort((a,b)=>b.sales-a.sales || b.amount-a.amount || a.name.localeCompare(b.name,'es'));
  return {
    advisors,
    sheet:chosen.name,
    rowCount:candidates.length,
    usedRows:effective.length,
    headerRow:chosen.header.row+1,
    monthFilter:canFilterByMonth?'current-month':'all-rows'
  };
}

async function getSetting(env,key){
  if(!env.DB)return null;
  const row=await env.DB.prepare('SELECT value FROM app_settings WHERE key=?').bind(key).first();
  return row?.value??null;
}
async function setSetting(env,key,value){
  if(!env.DB)return;
  await env.DB.prepare(`INSERT INTO app_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).bind(key,String(value??'')).run();
}

async function sha256Hex(buffer){
  const digest=await crypto.subtle.digest('SHA-256',buffer);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function sourceUrl(env){
  const raw=(env.SHAREPOINT_FILE_URL||'').trim();
  if(!raw)throw new Error('Falta SHAREPOINT_FILE_URL en Cloudflare.');
  const u=new URL(raw);
  if(!u.searchParams.has('download'))u.searchParams.set('download','1');
  return u.toString();
}

async function downloadSource(env){
  const url=sourceUrl(env);
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'MARNEZ-Sales-Score/0.2'}});
  if(!r.ok)throw new Error(`SharePoint respondió HTTP ${r.status}`);
  const buffer=await r.arrayBuffer();
  const bytes=new Uint8Array(buffer);
  if(bytes.length<4 || bytes[0]!==0x50 || bytes[1]!==0x4b)throw new Error('El vínculo no devolvió un archivo XLSX válido. Revisa que el enlace permita descarga sin iniciar sesión.');
  return {buffer,contentType:r.headers.get('content-type')||'',lastModified:r.headers.get('last-modified')||'',etag:r.headers.get('etag')||'',finalUrl:r.url};
}

async function persistRanking(env, parsed, hash, meta){
  const existing=await env.DB.prepare('SELECT name FROM advisors WHERE active=1 ORDER BY sales DESC,amount DESC,name ASC').all();
  const previous=new Map((existing.results||[]).map((x,i)=>[normalize(x.name),i+1]));
  const month=new Date().toISOString().slice(0,7);
  const statements=[env.DB.prepare('UPDATE advisors SET active=0')];

  parsed.advisors.forEach((a,i)=>{
    statements.push(env.DB.prepare(`INSERT INTO advisors(id,name,sales,amount,previous_position,active,updated_at)
      VALUES(?,?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,sales=excluded.sales,amount=excluded.amount,
      previous_position=excluded.previous_position,active=1,updated_at=CURRENT_TIMESTAMP`)
      .bind(slug(a.name),a.name,a.sales,a.amount,previous.get(normalize(a.name))||null));
    statements.push(env.DB.prepare(`INSERT INTO monthly_rankings(month,advisor_id,position,sales,amount,captured_at)
      VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(month,advisor_id) DO UPDATE SET position=excluded.position,sales=excluded.sales,amount=excluded.amount,captured_at=CURRENT_TIMESTAMP`)
      .bind(month,slug(a.name),i+1,a.sales,a.amount));
  });
  await env.DB.batch(statements);
  await Promise.all([
    setSetting(env,'source_hash',hash),
    setSetting(env,'last_sync_at',nowIso()),
    setSetting(env,'last_sync_error',''),
    setSetting(env,'source_last_modified',meta.lastModified||''),
    setSetting(env,'source_etag',meta.etag||''),
    setSetting(env,'source_sheet',parsed.sheet),
    setSetting(env,'source_rows',String(parsed.rowCount)),
    setSetting(env,'source_used_rows',String(parsed.usedRows)),
    setSetting(env,'month_filter',parsed.monthFilter)
  ]);
}

async function syncFromSharePoint(env,{force=false}={}){
  if(!env.DB)throw new Error('D1 no está enlazado.');
  const {buffer,...meta}=await downloadSource(env);
  const hash=await sha256Hex(buffer);
  const prev=await getSetting(env,'source_hash');
  if(!force && prev===hash){
    await setSetting(env,'last_check_at',nowIso());
    return {ok:true,changed:false,hash,lastSyncAt:await getSetting(env,'last_sync_at')};
  }
  const parsed=parseWorkbook(buffer);
  if(!parsed.advisors.length)throw new Error('El Excel se pudo leer, pero no encontré ventas para procesar.');
  await persistRanking(env,parsed,hash,meta);
  await setSetting(env,'last_check_at',nowIso());
  return {ok:true,changed:true,hash,parsed,lastSyncAt:await getSetting(env,'last_sync_at')};
}

async function maybeSync(env){
  if(!env.DB || !env.SHAREPOINT_FILE_URL)return null;
  const last=await getSetting(env,'last_check_at');
  if(last && Date.now()-new Date(last).getTime()<25000)return null;
  try{return await syncFromSharePoint(env);}catch(e){
    await Promise.all([setSetting(env,'last_check_at',nowIso()),setSetting(env,'last_sync_error',e.message)]);
    return {ok:false,error:e.message};
  }
}

async function getScore(env){
  if(!env.DB)return{month:new Date().toISOString().slice(0,7),updatedAt:nowIso(),sourceStatus:'demo',advisors:demo};
  await maybeSync(env);
  const rows=await env.DB.prepare(`SELECT id,name,sales,amount,photo_url AS photoUrl,previous_position AS previousPosition
    FROM advisors WHERE active=1 ORDER BY sales DESC,amount DESC,name ASC`).all();
  const updatedAt=await getSetting(env,'last_sync_at')||nowIso();
  const syncError=await getSetting(env,'last_sync_error');
  const sourceStatus=rows.results?.length?(syncError?'warning':'synced'):'demo';
  return {
    month:new Date().toISOString().slice(0,7),updatedAt,sourceStatus,
    sourceMeta:{
      sheet:await getSetting(env,'source_sheet'),
      rows:Number(await getSetting(env,'source_rows')||0),
      usedRows:Number(await getSetting(env,'source_used_rows')||0),
      monthFilter:await getSetting(env,'month_filter'),
      error:syncError||null
    },
    advisors:rows.results?.length?rows.results:demo
  };
}

async function sourceStatus(env){
  const base={configured:!!env.SHAREPOINT_FILE_URL,lastSyncAt:await getSetting(env,'last_sync_at'),lastError:await getSetting(env,'last_sync_error')};
  if(!env.SHAREPOINT_FILE_URL)return {ok:false,...base,error:'Falta SHAREPOINT_FILE_URL'};
  try{
    const {buffer,...meta}=await downloadSource(env);
    return {ok:true,...base,size:buffer.byteLength,contentType:meta.contentType,lastModified:meta.lastModified,etag:meta.etag};
  }catch(e){return {ok:false,...base,error:e.message};}
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/health')return json({ok:true,version:'0.2.0',d1:!!env.DB,sharepointConfigured:!!env.SHAREPOINT_FILE_URL});
    if(url.pathname==='/api/score')return json(await getScore(env));
    if(url.pathname==='/api/sharepoint/status')return json(await sourceStatus(env));
    if(url.pathname==='/api/sync'){
      if(request.method!=='POST')return json({ok:false,error:'Usa POST' },405);
      try{return json(await syncFromSharePoint(env,{force:true}));}
      catch(e){await setSetting(env,'last_sync_error',e.message);return json({ok:false,error:e.message},500);}
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event,env,ctx){
    ctx.waitUntil(syncFromSharePoint(env).catch(e=>setSetting(env,'last_sync_error',e.message)));
  }
};
