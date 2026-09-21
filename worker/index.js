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

function sourceUrl(env, forceDownload=true){
  const raw=(env.SHAREPOINT_FILE_URL||'').trim();
  if(!raw)throw new Error('Falta SHAREPOINT_FILE_URL en Cloudflare.');
  const u=new URL(raw);
  if(forceDownload)u.searchParams.set('download','1');
  return u.toString();
}

function setCookieValues(headers){
  if(typeof headers.getSetCookie==='function')return headers.getSetCookie();
  const raw=headers.get('set-cookie');
  if(!raw)return [];
  // Best-effort fallback. Cloudflare Workers normally exposes getSetCookie().
  return raw.split(/,(?=\s*[^;,=]+=[^;,]+)/g);
}

function absorbCookies(jar,headers){
  for(const line of setCookieValues(headers)){
    const first=String(line||'').split(';',1)[0];
    const eq=first.indexOf('=');
    if(eq<=0)continue;
    const name=first.slice(0,eq).trim();
    const value=first.slice(eq+1).trim();
    if(!name)continue;
    if(!value)jar.delete(name); else jar.set(name,value);
  }
}

function cookieHeader(jar){
  return [...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ');
}

async function sharePointFetchWithCookieJar(startUrl,{jar=new Map(),maxRedirects=12}={}){
  let current=startUrl;
  const trace=[];
  for(let i=0;i<=maxRedirects;i++){
    const headers={
      'accept':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'accept-language':'es-MX,es;q=0.9,en;q=0.7',
      'cache-control':'no-cache',
      'pragma':'no-cache',
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'
    };
    const cookies=cookieHeader(jar);
    if(cookies)headers.cookie=cookies;

    const r=await fetch(current,{method:'GET',redirect:'manual',headers});
    absorbCookies(jar,r.headers);
    const u=new URL(current);
    trace.push({status:r.status,host:u.hostname,redirect:!!r.headers.get('location')});

    if(r.status>=300 && r.status<400){
      const loc=r.headers.get('location');
      if(!loc)throw Object.assign(new Error(`SharePoint respondió HTTP ${r.status} sin Location.`),{trace});
      current=new URL(loc,current).toString();
      continue;
    }
    return {response:r,jar,trace,finalUrl:current};
  }
  throw Object.assign(new Error('SharePoint excedió el límite de redirecciones.'),{trace});
}

async function downloadSource(env,{includeTrace=false}={}){
  // Paso 1: abrir el vínculo anónimo como lo hace un navegador para obtener
  // las cookies de invitado que SharePoint usa durante la cadena de redirecciones.
  const jar=new Map();
  const landing=await sharePointFetchWithCookieJar(sourceUrl(env,false),{jar});
  const landingType=(landing.response.headers.get('content-type')||'').toLowerCase();

  // Si el primer recorrido ya entrega el XLSX, úsalo directamente.
  let r=landing.response;
  let trace=[...landing.trace];
  let finalUrl=landing.finalUrl;
  let buffer=await r.arrayBuffer();
  let bytes=new Uint8Array(buffer);

  // Paso 2: normalmente el vínculo de compartir termina en una página HTML.
  // Conservando las cookies recién obtenidas, pedimos la descarga del MISMO vínculo.
  if(bytes.length<4 || bytes[0]!==0x50 || bytes[1]!==0x4b){
    const dl=await sharePointFetchWithCookieJar(sourceUrl(env,true),{jar});
    r=dl.response;
    trace=trace.concat(dl.trace);
    finalUrl=dl.finalUrl;
    buffer=await r.arrayBuffer();
    bytes=new Uint8Array(buffer);
  }

  if(!r.ok){
    const err=new Error(`SharePoint respondió HTTP ${r.status}`);
    err.trace=trace;
    throw err;
  }
  if(bytes.length<4 || bytes[0]!==0x50 || bytes[1]!==0x4b){
    const ct=r.headers.get('content-type')||landingType||'';
    const err=new Error(`SharePoint respondió, pero no entregó un XLSX válido (${ct||'content-type desconocido'}).`);
    err.trace=trace;
    throw err;
  }
  return {
    buffer,
    contentType:r.headers.get('content-type')||'',
    lastModified:r.headers.get('last-modified')||'',
    etag:r.headers.get('etag')||'',
    finalUrl,
    ...(includeTrace?{trace}:null)
  };
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

let schemaReady=false;
async function ensureSchema(env){
  if(schemaReady || !env.DB)return;

  const advisorInfo=await env.DB.prepare('PRAGMA table_info(advisors)').all();
  const advisorCols=new Set((advisorInfo.results||[]).map(x=>x.name));
  const advisorAdditions=[
    ['ranking_enabled','INTEGER NOT NULL DEFAULT 1'],
    ['top_seller_eligible','INTEGER NOT NULL DEFAULT 1'],
    ['public_visible','INTEGER NOT NULL DEFAULT 1'],
    ['exclusion_reason','TEXT'],
    ['display_name','TEXT']
  ];
  for(const [name,type] of advisorAdditions){
    if(!advisorCols.has(name)){
      try{await env.DB.prepare(`ALTER TABLE advisors ADD COLUMN ${name} ${type}`).run();}
      catch(e){if(!String(e.message||e).toLowerCase().includes('duplicate column'))throw e;}
    }
  }

  const adminInfo=await env.DB.prepare('PRAGMA table_info(admins)').all();
  const adminCols=new Set((adminInfo.results||[]).map(x=>x.name));
  const adminAdditions=[
    ['password_hash','TEXT'],
    ['password_salt','TEXT'],
    ['password_iterations','INTEGER'],
    ['last_login_at','TEXT'],
    ['updated_at','TEXT']
  ];
  for(const [name,type] of adminAdditions){
    if(!adminCols.has(name)){
      try{await env.DB.prepare(`ALTER TABLE admins ADD COLUMN ${name} ${type}`).run();}
      catch(e){if(!String(e.message||e).toLowerCase().includes('duplicate column'))throw e;}
    }
  }

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    user_agent TEXT,
    FOREIGN KEY(admin_id) REFERENCES admins(id)
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)').run();

  schemaReady=true;
}

function mapAdvisorRow(x){
  return {
    id:x.id,
    name:x.displayName||x.name,
    sourceName:x.name,
    sales:Number(x.sales||0),
    amount:Number(x.amount||0),
    photoUrl:x.photoUrl||null,
    previousPosition:x.previousPosition==null?null:Number(x.previousPosition),
    rankingEnabled:Number(x.rankingEnabled??1)===1,
    topSellerEligible:Number(x.topSellerEligible??1)===1,
    publicVisible:Number(x.publicVisible??1)===1,
    exclusionReason:x.exclusionReason||''
  };
}

async function allActiveAdvisors(env){
  await ensureSchema(env);
  const rows=await env.DB.prepare(`SELECT id,name,display_name AS displayName,sales,amount,photo_url AS photoUrl,
    previous_position AS previousPosition,ranking_enabled AS rankingEnabled,
    top_seller_eligible AS topSellerEligible,public_visible AS publicVisible,
    exclusion_reason AS exclusionReason
    FROM advisors WHERE active=1 ORDER BY sales DESC,amount DESC,name ASC`).all();
  return (rows.results||[]).map(mapAdvisorRow).map((a,i)=>({...a,actualPosition:i+1}));
}

function publicRankingFrom(all){
  const eligible=all.filter(a=>a.publicVisible && a.rankingEnabled);
  return eligible.map((a,i)=>({...a,publicPosition:i+1}));
}

function recognizedTopSeller(publicRank){
  return publicRank.find(a=>a.topSellerEligible)||null;
}

async function getScore(env){
  if(!env.DB)return{month:new Date().toISOString().slice(0,7),updatedAt:nowIso(),sourceStatus:'demo',advisors:demo,topSeller:demo[0]};
  await ensureSchema(env);
  await maybeSync(env);
  const all=await allActiveAdvisors(env);
  const publicRank=publicRankingFrom(all);
  const updatedAt=await getSetting(env,'last_sync_at')||nowIso();
  const syncError=await getSetting(env,'last_sync_error');
  const sourceStatus=all.length?(syncError?'warning':'synced'):'demo';
  return {
    month:new Date().toISOString().slice(0,7),updatedAt,sourceStatus,
    sourceMeta:{
      sheet:await getSetting(env,'source_sheet'),
      rows:Number(await getSetting(env,'source_rows')||0),
      usedRows:Number(await getSetting(env,'source_used_rows')||0),
      monthFilter:await getSetting(env,'month_filter'),
      error:syncError||null
    },
    advisors:publicRank.length?publicRank:[],
    topSeller:recognizedTopSeller(publicRank)
  };
}

async function sourceStatus(env){
  await ensureSchema(env);
  const base={configured:!!env.SHAREPOINT_FILE_URL,lastSyncAt:await getSetting(env,'last_sync_at'),lastError:await getSetting(env,'last_sync_error')};
  if(!env.SHAREPOINT_FILE_URL)return {ok:false,...base,error:'Falta SHAREPOINT_FILE_URL'};
  try{
    const {buffer,...meta}=await downloadSource(env);
    return {ok:true,...base,size:buffer.byteLength,contentType:meta.contentType,lastModified:meta.lastModified,etag:meta.etag};
  }catch(e){return {ok:false,...base,error:e.message};}
}

async function adminOverview(env){
  const all=await allActiveAdvisors(env);
  const publicRank=publicRankingFrom(all);
  return {
    ok:true,
    realRanking:all,
    publicRanking:publicRank,
    realLeader:all[0]||null,
    topSeller:recognizedTopSeller(publicRank),
    totals:{sales:all.reduce((s,a)=>s+a.sales,0),advisors:all.length,publicAdvisors:publicRank.length},
    source:{
      lastSyncAt:await getSetting(env,'last_sync_at'),
      lastError:await getSetting(env,'last_sync_error'),
      sheet:await getSetting(env,'source_sheet'),
      rows:Number(await getSetting(env,'source_rows')||0),
      usedRows:Number(await getSetting(env,'source_used_rows')||0),
      monthFilter:await getSetting(env,'month_filter')
    }
  };
}

async function updateAdvisor(env,id,body){
  await ensureSchema(env);
  const current=await env.DB.prepare('SELECT * FROM advisors WHERE id=?').bind(id).first();
  if(!current)return {ok:false,error:'Asesor no encontrado'};
  const rankingEnabled=body.rankingEnabled==null?Number(current.ranking_enabled??1):(body.rankingEnabled?1:0);
  const topSellerEligible=body.topSellerEligible==null?Number(current.top_seller_eligible??1):(body.topSellerEligible?1:0);
  const publicVisible=body.publicVisible==null?Number(current.public_visible??1):(body.publicVisible?1:0);
  const displayName=body.displayName===undefined?current.display_name:String(body.displayName||'').trim()||null;
  const photoUrl=body.photoUrl===undefined?current.photo_url:String(body.photoUrl||'').trim()||null;
  const exclusionReason=body.exclusionReason===undefined?current.exclusion_reason:String(body.exclusionReason||'').trim()||null;
  await env.DB.prepare(`UPDATE advisors SET ranking_enabled=?,top_seller_eligible=?,public_visible=?,display_name=?,photo_url=?,exclusion_reason=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(rankingEnabled,topSellerEligible,publicVisible,displayName,photoUrl,exclusionReason,id).run();
  const row=await env.DB.prepare(`SELECT id,name,display_name AS displayName,sales,amount,photo_url AS photoUrl,previous_position AS previousPosition,
      ranking_enabled AS rankingEnabled,top_seller_eligible AS topSellerEligible,public_visible AS publicVisible,exclusion_reason AS exclusionReason
      FROM advisors WHERE id=?`).bind(id).first();
  return {ok:true,advisor:mapAdvisorRow(row)};
}

async function historyData(env){
  await ensureSchema(env);
  const rows=await env.DB.prepare(`SELECT r.month,r.position,r.sales,r.amount,r.captured_at AS capturedAt,
      a.id AS advisorId,COALESCE(NULLIF(a.display_name,''),a.name) AS advisorName
      FROM monthly_rankings r LEFT JOIN advisors a ON a.id=r.advisor_id
      ORDER BY r.month DESC,r.position ASC`).all();
  const groups={};
  for(const row of rows.results||[]){
    (groups[row.month]??=[]).push({advisorId:row.advisorId,advisorName:row.advisorName||row.advisorId,position:Number(row.position),sales:Number(row.sales),amount:Number(row.amount||0),capturedAt:row.capturedAt});
  }
  return {ok:true,months:Object.entries(groups).map(([month,ranking])=>({month,ranking}))};
}


const SESSION_COOKIE='marnez_admin_session';
const SESSION_SECONDS=60*60*12;
const LEGACY_PASSWORD_ITERATIONS=120000;

function bytesToBase64Url(bytes){
  let binary='';
  for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlToBytes(value=''){
  let s=String(value).replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const binary=atob(s);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function randomToken(byteLength=32){
  const bytes=new Uint8Array(byteLength);crypto.getRandomValues(bytes);return bytesToBase64Url(bytes);
}
async function sha256Text(value=''){
  const bytes=new TextEncoder().encode(String(value));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function authSecret(env){
  return String(env.ADMIN_AUTH_SECRET||env.SUPERADMIN_PASSWORD||'');
}
async function fastPasswordHash(env,password,saltValue=null){
  const secret=authSecret(env);
  if(!secret)throw new Error('Falta SUPERADMIN_PASSWORD o ADMIN_AUTH_SECRET en Cloudflare.');
  const salt=saltValue||randomToken(16);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const data=new TextEncoder().encode(`${salt}:${String(password)}`);
  const signature=await crypto.subtle.sign('HMAC',key,data);
  return {hash:bytesToBase64Url(new Uint8Array(signature)),salt,iterations:0};
}
async function legacyPasswordHash(password,saltValue,iterations=LEGACY_PASSWORD_ITERATIONS){
  const salt=base64UrlToBytes(saltValue);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);
  return bytesToBase64Url(new Uint8Array(bits));
}
function safeEqualBase64Url(a,b){
  try{
    const aa=base64UrlToBytes(a),bb=base64UrlToBytes(b);
    if(aa.length!==bb.length)return false;
    if(typeof crypto.subtle.timingSafeEqual==='function')return crypto.subtle.timingSafeEqual(aa,bb);
    let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;
  }catch{return false;}
}
async function verifyPassword(env,password,row){
  if(!row?.password_hash||!row?.password_salt)return false;
  const iterations=Number(row.password_iterations||0);
  if(iterations>0){
    const hash=await legacyPasswordHash(password,row.password_salt,iterations);
    return safeEqualBase64Url(hash,row.password_hash);
  }
  const result=await fastPasswordHash(env,password,row.password_salt);
  return safeEqualBase64Url(result.hash,row.password_hash);
}
function parseCookieHeader(value=''){
  const out={};
  for(const part of String(value||'').split(';')){
    const i=part.indexOf('=');if(i<=0)continue;
    out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
  }
  return out;
}
function sessionCookie(token,maxAge=SESSION_SECONDS){
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function expiredSessionCookie(){return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;}
function authResponse(body,status=200,cookie=null){
  const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
  if(cookie)headers['set-cookie']=cookie;
  return new Response(JSON.stringify(body),{status,headers});
}
async function authConfigured(env){
  await ensureSchema(env);
  const row=await env.DB.prepare(`SELECT COUNT(*) AS count FROM admins WHERE active=1 AND password_hash IS NOT NULL AND password_hash<>''`).first();
  return Number(row?.count||0)>0;
}
async function createSession(env,admin,request){
  await ensureSchema(env);
  const token=randomToken(32),tokenHash=await sha256Text(token),id=crypto.randomUUID();
  const created=new Date(),expires=new Date(created.getTime()+SESSION_SECONDS*1000);
  await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(created.toISOString()).run();
  await env.DB.prepare('INSERT INTO admin_sessions(id,admin_id,token_hash,created_at,expires_at,user_agent) VALUES(?,?,?,?,?,?)')
    .bind(id,admin.id,tokenHash,created.toISOString(),expires.toISOString(),request.headers.get('user-agent')||'').run();
  return {token,expiresAt:expires.toISOString()};
}
async function getSessionUser(request,env){
  if(!env.DB)return null;
  await ensureSchema(env);
  const cookies=parseCookieHeader(request.headers.get('cookie')||'');
  const token=cookies[SESSION_COOKIE];if(!token)return null;
  const tokenHash=await sha256Text(token),now=nowIso();
  const row=await env.DB.prepare(`SELECT a.id,a.email,a.name,a.role,a.active,s.expires_at AS expiresAt
    FROM admin_sessions s JOIN admins a ON a.id=s.admin_id
    WHERE s.token_hash=? AND s.expires_at>? AND a.active=1 LIMIT 1`).bind(tokenHash,now).first();
  if(!row)return null;
  return {id:row.id,email:row.email,name:row.name||row.email,role:row.role,active:Number(row.active)===1,expiresAt:row.expiresAt};
}
async function requireUser(request,env,roles=null){
  const user=await getSessionUser(request,env);
  if(!user)return {response:json({ok:false,error:'Inicia sesión para continuar.'},401),user:null};
  if(roles && !roles.includes(user.role))return {response:json({ok:false,error:'No tienes permisos para realizar esta acción.'},403),user};
  return {response:null,user};
}
function seedConfigured(env){
  return !!(env.SUPERADMIN_EMAIL && env.SUPERADMIN_PASSWORD);
}

async function provisionSeedSuperadmin(env){
  await ensureSchema(env);
  if(await authConfigured(env))return null;
  if(!seedConfigured(env))throw new Error('Faltan SUPERADMIN_EMAIL y/o SUPERADMIN_PASSWORD en Cloudflare.');
  const email=String(env.SUPERADMIN_EMAIL).trim().toLowerCase();
  const password=String(env.SUPERADMIN_PASSWORD);
  if(!email.includes('@'))throw new Error('SUPERADMIN_EMAIL no es válido.');
  if(password.length<10)throw new Error('SUPERADMIN_PASSWORD debe tener al menos 10 caracteres.');
  const ph=await fastPasswordHash(env,password);
  const existing=await env.DB.prepare('SELECT id,name FROM admins WHERE email=? LIMIT 1').bind(email).first();
  const id=existing?.id||crypto.randomUUID();
  const name=String(env.SUPERADMIN_NAME||existing?.name||email.split('@')[0]).trim();
  if(existing){
    await env.DB.prepare(`UPDATE admins SET name=?,role='superadmin',active=1,password_hash=?,password_salt=?,password_iterations=?,updated_at=? WHERE id=?`)
      .bind(name||email,ph.hash,ph.salt,ph.iterations,nowIso(),id).run();
  }else{
    await env.DB.prepare(`INSERT INTO admins(id,email,name,role,active,password_hash,password_salt,password_iterations,updated_at) VALUES(?,?,?,?,1,?,?,?,?)`)
      .bind(id,email,name||email,'superadmin',ph.hash,ph.salt,ph.iterations,nowIso()).run();
  }
  return {id,email,name:name||email,role:'superadmin',active:true};
}

async function loginAdmin(request,env,body){
  await ensureSchema(env);
  const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
  if(!(await authConfigured(env))){
    if(!seedConfigured(env))return authResponse({ok:false,error:'Falta configurar SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD en Cloudflare.'},503);
    if(email!==String(env.SUPERADMIN_EMAIL).trim().toLowerCase() || password!==String(env.SUPERADMIN_PASSWORD))
      return authResponse({ok:false,error:'Correo o contraseña incorrectos.'},401);
    await provisionSeedSuperadmin(env);
  }
  const row=await env.DB.prepare('SELECT * FROM admins WHERE email=? AND active=1 LIMIT 1').bind(email).first();
  if(!row || !(await verifyPassword(env,password,row)))return authResponse({ok:false,error:'Correo o contraseña incorrectos.'},401);
  const user={id:row.id,email:row.email,name:row.name||row.email,role:row.role,active:true};
  const session=await createSession(env,user,request);
  await env.DB.prepare('UPDATE admins SET last_login_at=?,updated_at=? WHERE id=?').bind(nowIso(),nowIso(),row.id).run();
  return authResponse({ok:true,user},200,sessionCookie(session.token));
}

async function logoutAdmin(request,env){
  const cookies=parseCookieHeader(request.headers.get('cookie')||''),token=cookies[SESSION_COOKIE];
  if(token && env.DB){const tokenHash=await sha256Text(token);await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(tokenHash).run();}
  return authResponse({ok:true},200,expiredSessionCookie());
}

async function listAdmins(env){
  await ensureSchema(env);
  const rows=await env.DB.prepare(`SELECT id,email,name,role,active,created_at AS createdAt,last_login_at AS lastLoginAt,
    CASE WHEN password_hash IS NOT NULL AND password_hash<>'' THEN 1 ELSE 0 END AS hasPassword
    FROM admins ORDER BY active DESC,name ASC,email ASC`).all();
  return {ok:true,users:(rows.results||[]).map(x=>({...x,active:Number(x.active)===1,hasPassword:Number(x.hasPassword)===1}))};
}

async function createAdmin(env,body){
  await ensureSchema(env);
  const email=String(body.email||'').trim().toLowerCase();
  if(!email || !email.includes('@'))return {ok:false,error:'Ingresa un correo válido.'};
  const name=String(body.name||'').trim();
  const role=['superadmin','admin','viewer'].includes(body.role)?body.role:'admin';
  const password=String(body.password||'');
  if(password.length<10)return {ok:false,error:'La contraseña temporal debe tener al menos 10 caracteres.'};
  const id=crypto.randomUUID(),ph=await fastPasswordHash(env,password);
  try{
    await env.DB.prepare(`INSERT INTO admins(id,email,name,role,active,password_hash,password_salt,password_iterations,updated_at)
      VALUES(?,?,?,?,1,?,?,?,?)`).bind(id,email,name||email,role,ph.hash,ph.salt,ph.iterations,nowIso()).run();
    return {ok:true,user:{id,email,name:name||email,role,active:true,hasPassword:true}};
  }catch(e){return {ok:false,error:String(e.message||e).includes('UNIQUE')?'Ese correo ya está registrado.':String(e.message||e)};}
}

async function updateAdmin(env,id,body){
  await ensureSchema(env);
  const current=await env.DB.prepare('SELECT * FROM admins WHERE id=?').bind(id).first();
  if(!current)return {ok:false,error:'Usuario no encontrado'};
  const role=body.role===undefined?current.role:(['superadmin','admin','viewer'].includes(body.role)?body.role:current.role);
  const active=body.active===undefined?Number(current.active):(body.active?1:0);
  const name=body.name===undefined?current.name:String(body.name||'').trim();
  let passwordHashValue=current.password_hash,passwordSalt=current.password_salt,passwordIterations=current.password_iterations;
  const password=String(body.password||'');
  if(password){
    if(password.length<10)return {ok:false,error:'La nueva contraseña debe tener al menos 10 caracteres.'};
    const ph=await fastPasswordHash(env,password);passwordHashValue=ph.hash;passwordSalt=ph.salt;passwordIterations=ph.iterations;
    await env.DB.prepare('DELETE FROM admin_sessions WHERE admin_id=?').bind(id).run();
  }
  await env.DB.prepare(`UPDATE admins SET name=?,role=?,active=?,password_hash=?,password_salt=?,password_iterations=?,updated_at=? WHERE id=?`)
    .bind(name,role,active,passwordHashValue,passwordSalt,passwordIterations,nowIso(),id).run();
  return {ok:true};
}

async function readJson(request){
  try{return await request.json();}catch{return {};}
}

export default{
  async fetch(request,env){
    const url=new URL(request.url),path=url.pathname;
    if(path==='/api/health'){
      await ensureSchema(env);
      return json({ok:true,version:'0.6.2',d1:!!env.DB,sharepointConfigured:!!env.SHAREPOINT_FILE_URL,authConfigured:env.DB?await authConfigured(env):false});
    }
    if(path==='/api/score')return json(await getScore(env));

    if(path==='/api/auth/status' && request.method==='GET'){
      if(!env.DB)return json({ok:false,error:'D1 no está conectada.'},500);
      return json({ok:true,configured:await authConfigured(env),seedConfigured:seedConfigured(env)});
    }
    if(path==='/api/auth/login' && request.method==='POST'){
      try{return await loginAdmin(request,env,await readJson(request));}
      catch(e){console.error('loginAdmin failed',e);return authResponse({ok:false,error:`No se pudo iniciar sesión: ${e?.message||String(e)}`},500);}
    }
    if(path==='/api/auth/logout' && request.method==='POST')return logoutAdmin(request,env);
    if(path==='/api/auth/me' && request.method==='GET'){
      const user=await getSessionUser(request,env);
      return json({ok:true,authenticated:!!user,user:user||null});
    }

    if(path==='/api/admin/overview'){
      const auth=await requireUser(request,env);if(auth.response)return auth.response;
      return json(await adminOverview(env));
    }
    if(path==='/api/admin/advisors' && request.method==='GET'){
      const auth=await requireUser(request,env);if(auth.response)return auth.response;
      return json({ok:true,advisors:await allActiveAdvisors(env)});
    }
    if(path.startsWith('/api/admin/advisors/') && request.method==='PATCH'){
      const auth=await requireUser(request,env,['superadmin','admin']);if(auth.response)return auth.response;
      const id=decodeURIComponent(path.slice('/api/admin/advisors/'.length));
      const result=await updateAdvisor(env,id,await readJson(request));
      return json(result,result.ok?200:404);
    }
    if(path==='/api/admin/history'){
      const auth=await requireUser(request,env);if(auth.response)return auth.response;
      return json(await historyData(env));
    }
    if(path==='/api/admin/users' && request.method==='GET'){
      const auth=await requireUser(request,env,['superadmin']);if(auth.response)return auth.response;
      return json(await listAdmins(env));
    }
    if(path==='/api/admin/users' && request.method==='POST'){
      const auth=await requireUser(request,env,['superadmin']);if(auth.response)return auth.response;
      const result=await createAdmin(env,await readJson(request));
      return json(result,result.ok?200:400);
    }
    if(path.startsWith('/api/admin/users/') && request.method==='PATCH'){
      const auth=await requireUser(request,env,['superadmin']);if(auth.response)return auth.response;
      const id=decodeURIComponent(path.slice('/api/admin/users/'.length));
      if(id===auth.user.id){
        const body=await readJson(request);
        if(body.active===false || (body.role && body.role!=='superadmin'))return json({ok:false,error:'No puedes desactivar o quitar tu propio rol de superadministrador.'},400);
        const result=await updateAdmin(env,id,body);return json(result,result.ok?200:404);
      }
      const result=await updateAdmin(env,id,await readJson(request));
      return json(result,result.ok?200:404);
    }
    if(path==='/api/admin/settings'){
      const auth=await requireUser(request,env);if(auth.response)return auth.response;
      const overview=await adminOverview(env);
      return json({ok:true,version:'0.6.2',sharepointConfigured:!!env.SHAREPOINT_FILE_URL,d1:!!env.DB,source:overview.source,authUser:auth.user});
    }
    if(path==='/api/sharepoint/status'){
      const auth=await requireUser(request,env);if(auth.response)return auth.response;
      return json(await sourceStatus(env));
    }
    if(path==='/api/sharepoint/diagnostic'){
      const auth=await requireUser(request,env,['superadmin','admin']);if(auth.response)return auth.response;
      if(!env.SHAREPOINT_FILE_URL)return json({ok:false,error:'Falta SHAREPOINT_FILE_URL'});
      try{const {buffer,trace,contentType}=await downloadSource(env,{includeTrace:true});return json({ok:true,size:buffer.byteLength,contentType,trace});}
      catch(e){return json({ok:false,error:e.message,trace:e.trace||[]},500);}
    }
    if(path==='/api/sync' && request.method==='POST'){
      const auth=await requireUser(request,env,['superadmin','admin']);if(auth.response)return auth.response;
      try{return json(await syncFromSharePoint(env,{force:true}));}
      catch(e){await setSetting(env,'last_sync_error',e.message);return json({ok:false,error:e.message},500);}
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(event,env,ctx){
    ctx.waitUntil((async()=>{
      try{await ensureSchema(env);await syncFromSharePoint(env);}catch(e){if(env.DB)await setSetting(env,'last_sync_error',e.message);}
    })());
  }
};
