const demo = [
  { id:'1', name:'Marta Ongay', sales:11, previousPosition:2, amount:0, photoUrl:null },
  { id:'2', name:'Andrea Torres', sales:9, previousPosition:1, amount:0, photoUrl:null },
  { id:'3', name:'Carlos Medina', sales:8, previousPosition:4, amount:0, photoUrl:null }
];

const ASSETS={
  logoHorizontal:'/assets/logo-marnez-horizontal.png',
  logoStacked:'/assets/logo-marnez-stacked.png',
  logoSeal:'/assets/logo-marnez-seal.png'
};
const COLORS={yellow:'#ffd939',light:'#e9e9e9',navy:'#1c2a35',charcoal:'#333333',cream:'#f7f1e7',creamStrong:'#f2ead9',line:'#d5d7da',textSoft:'#6f7680',white:'#ffffff'};
const root=document.getElementById('root');
const state={data:{advisors:demo,topSeller:demo[0],updatedAt:new Date().toISOString(),sourceStatus:'demo'},adminCache:{}};
const month=new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(new Date()).replace(/^./,s=>s.toUpperCase());
const monthUpper=month.toUpperCase();
const esc=(s='')=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const initials=n=>String(n||'').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(Number(n||0));
const avatar=(a,large=false)=>a?.photoUrl?`<img class="avatar ${large?'avatar-large':''}" src="${esc(a.photoUrl)}" alt="${esc(a.name)}">`:`<div class="avatar avatar-fallback ${large?'avatar-large':''}">${initials(a?.name)}</div>`;
const movement=(a,p)=>!a.previousPosition?'—':a.previousPosition-p>0?`↑ ${a.previousPosition-p}`:a.previousPosition-p<0?`↓ ${Math.abs(a.previousPosition-p)}`:'—';
const movementClass=t=>t.startsWith('↑')?'up':t.startsWith('↓')?'down':'muted';
const isAdmin=()=>location.pathname.startsWith('/admin');
const adminSection=()=>location.pathname.replace(/^\/admin\/?/,'').split('/')[0]||'dashboard';

function brand(mode='default'){
  return `<div class="brand brand-${mode}"><img src="${ASSETS.logoHorizontal}" alt="Marnez Desarrollos" class="brand-logo ${mode==='compact'?'compact':''}"></div>`;
}

function ranking(advisors,{title='Sales Score',topSellerId=null,eyebrow='RANKING ACTUAL'}={}){
  if(!advisors?.length)return `<section class="panel empty-panel"><p class="eyebrow plain">${eyebrow}</p><h2>${title}</h2><p>No hay asesores elegibles para mostrar en este ranking.</p></section>`;
  return `<section class="panel ranking-panel"><div class="panel-title"><div><p class="eyebrow plain">${eyebrow}</p><h2>${title}</h2></div><span class="icon">🏆</span></div><div class="table-head"><span>#</span><span>Asesor</span><span>Movimiento</span><span>Ventas</span></div>${advisors.map((a,i)=>{const m=movement(a,i+1);return `<div class="rank-row ${a.id===topSellerId?'leader':''}"><span class="rank-number">${String(i+1).padStart(2,'0')}</span><div class="advisor-cell">${avatar(a)}<div><strong>${esc(a.name)}</strong>${a.id===topSellerId?'<small>TOP SELLER</small>':''}</div></div><span class="${movementClass(m)}">${m}</span><strong class="sales-number">${a.sales}</strong></div>`}).join('')}</section>`;
}

function podium(advisors){
  const order=[advisors?.[1],advisors?.[0],advisors?.[2]],pos=[2,1,3];
  return `<div class="podium">${order.map((a,i)=>a?`<div class="podium-item p${pos[i]}"><div class="podium-rank">${pos[i]===1?'♛':'◉'}</div>${avatar(a,pos[i]===1)}<strong>${esc(a.name)}</strong><span>${a.sales} ventas</span><div class="podium-block">${pos[i]}</div></div>`:'').join('')}</div>`;
}

function publicView(){
  const advisors=state.data.advisors||[];
  const top=state.data.topSeller||null;
  root.innerHTML=`<div class="site-shell">
    <header class="public-header">${brand()}<div class="header-actions"><span class="live"><i></i> EN VIVO</span><button class="text-btn" data-nav="/admin">Administrador</button></div></header>
    <main class="public-main">
      <div class="hero-copy"><p class="eyebrow plain">RANKING DE VENTAS · ${monthUpper}</p><h1>Resultados que<br><span>se reconocen.</span></h1><p>Score en vivo para visualizar el desempeño comercial, destacar al Top Seller del mes y compartir su reconocimiento en PNG.</p></div>
      ${top?`<section class="top-card"><div class="top-watermark"><img src="${ASSETS.logoSeal}" alt=""></div><div class="top-glow"></div><div class="eyebrow">TOP SELLER · ${monthUpper}</div><div class="top-content">${avatar(top,true)}<div><p class="muted">Reconocimiento del mes</p><h1>${esc(top.name)}</h1><p class="top-copy">Liderando el Sales Score con <strong>${top.sales} ventas</strong>.</p><div class="cta-row"><button class="primary" data-celebrate>★ Mostrar reconocimiento</button><button class="secondary secondary-dark" data-download-top>⬇ Descargar PNG</button></div></div><div class="top-number"><span>01</span><small>RECONOCIMIENTO</small></div></div></section>`:`<section class="panel empty-panel"><h2>Top Seller pendiente</h2><p>No hay asesores elegibles para reconocimiento. Puedes configurarlos desde Administrador → Asesores.</p></section>`}
      <section class="panel podium-panel"><div class="panel-title"><div><p class="eyebrow plain">PODIO DEL MES</p><h2>Top 3 público</h2></div><span class="icon">🥇</span></div>${podium(advisors.slice(0,3))}</section>
      ${ranking(advisors,{topSellerId:top?.id})}
      <footer>Última actualización: ${new Date(state.data.updatedAt).toLocaleString('es-MX')} · MARNEZ Desarrollos</footer>
    </main></div>`;
  wireCommon();
}

const navItems=[
  ['dashboard','▦','Dashboard','/admin'],
  ['advisors','♙','Asesores','/admin/advisors'],
  ['top-seller','🏆','Top Seller','/admin/top-seller'],
  ['history','◷','Historial','/admin/history'],
  ['users','◈','Usuarios','/admin/users'],
  ['settings','⚙','Configuración','/admin/settings']
];

function sidebar(active){
  return `<aside class="sidebar">${brand('compact')}<nav>${navItems.map(([id,icon,label,path])=>`<button class="${id===active?'active':''}" data-nav="${path}">${icon} ${label}</button>`).join('')}</nav><div class="sidebar-card"><p class="eyebrow">RANKING PÚBLICO</p><p>Las ventas reales se conservan. Desde Asesores decides quién participa en el ranking y quién puede recibir Top Seller.</p></div><button class="ghost" data-nav="/">Ir a vista asesores →</button></aside>`;
}

function adminFrame(active,title,subtitle,body,actions=''){
  root.innerHTML=`<div class="admin-layout">${sidebar(active)}<main class="admin-main"><header class="page-header"><div><p class="eyebrow plain">ADMINISTRACIÓN</p><h1>${title}</h1>${subtitle?`<p class="page-subtitle">${subtitle}</p>`:''}</div><div class="page-actions">${actions}</div></header>${body}</main></div>`;
  wireCommon();
}

function loadingView(active,title){adminFrame(active,title,'','<section class="panel loading-panel">Cargando información…</section>')}
function statusPill(ok,label){return `<span class="status-pill ${ok?'status-ok':'status-off'}"><i></i>${label}</span>`}

async function dashboardView(){
  loadingView('dashboard','Dashboard de ventas');
  try{
    const data=await fetchJson('/api/admin/overview');
    const real=data.realRanking||[], pub=data.publicRanking||[], top=data.topSeller;
    const body=`<div class="kpis four"><div class="kpi"><b>▥</b><span>Ventas reales<strong>${data.totals?.sales||0}</strong></span></div><div class="kpi"><b>♙</b><span>Asesores en Excel<strong>${data.totals?.advisors||0}</strong></span></div><div class="kpi"><b>◎</b><span>Participan ranking<strong>${data.totals?.publicAdvisors||0}</strong></span></div><div class="kpi"><b>♛</b><span>Top Seller<strong>${esc(top?.name||'—')}</strong></span></div></div>
      <div class="compare-note"><strong>Ranking real vs. ranking público</strong><span>El ranking real respeta el Excel. El público aplica las reglas de reconocimiento configuradas por administración.</span></div>
      <div class="admin-grid admin-grid-equal">${ranking(real,{title:'Ranking real',eyebrow:'DATOS DEL EXCEL'})}${ranking(pub,{title:'Ranking público',eyebrow:'VISIBLE PARA ASESORES',topSellerId:top?.id})}</div>
      <section class="panel source-panel"><div><p class="eyebrow plain">SINCRONIZACIÓN</p><h2>Excel original</h2><p>Última sincronización: ${data.source?.lastSyncAt?new Date(data.source.lastSyncAt).toLocaleString('es-MX'):'Pendiente'} · Filas procesadas: ${data.source?.usedRows||0}</p>${data.source?.lastError?`<p class="error-text">${esc(data.source.lastError)}</p>`:''}</div><button class="secondary" data-sync>↻ Sincronizar ahora</button><pre id="syncResult"></pre></section>`;
    adminFrame('dashboard','Dashboard de ventas','Consulta el resultado real y el ranking de reconocimiento por separado.',body,statusPill(!data.source?.lastError,data.source?.lastError?'Con alerta':'Sincronizado'));
    wireAdminActions();
  }catch(e){adminError('dashboard','Dashboard de ventas',e);}
}

async function advisorsView(){
  loadingView('advisors','Asesores');
  try{
    const data=await fetchJson('/api/admin/advisors');
    const cards=(data.advisors||[]).map(a=>`<article class="advisor-admin-card" data-advisor-id="${esc(a.id)}"><div class="advisor-admin-head">${avatar(a)}<div><strong>${esc(a.name)}</strong><span>${a.sales} ventas · ${money(a.amount)}</span></div><span class="position-badge">#${a.actualPosition||'—'} real</span></div><div class="advisor-form-grid"><label>Nombre visible<input data-field="displayName" value="${esc(a.name===a.sourceName?'':a.name)}" placeholder="${esc(a.sourceName)}"></label><label>URL de fotografía<input data-field="photoUrl" value="${esc(a.photoUrl||'')}" placeholder="https://..."></label><label class="wide">Motivo / nota interna<input data-field="exclusionReason" value="${esc(a.exclusionReason||'')}" placeholder="Ej. Coordinación comercial"></label></div><div class="toggle-grid"><label class="toggle-line"><span><strong>Participa en ranking</strong><small>Si está desactivado, sus ventas siguen en el ranking real pero no ocupan posición pública.</small></span><input type="checkbox" data-field="rankingEnabled" ${a.rankingEnabled?'checked':''}><i></i></label><label class="toggle-line"><span><strong>Elegible para Top Seller</strong><small>Puede aparecer en ranking sin recibir el reconocimiento.</small></span><input type="checkbox" data-field="topSellerEligible" ${a.topSellerEligible?'checked':''}><i></i></label><label class="toggle-line"><span><strong>Mostrar en portal público</strong><small>Oculta completamente al asesor de la vista pública.</small></span><input type="checkbox" data-field="publicVisible" ${a.publicVisible?'checked':''}><i></i></label></div><div class="card-actions"><span class="save-status"></span><button class="primary compact-primary" data-save-advisor>Guardar cambios</button></div></article>`).join('');
    adminFrame('advisors','Asesores','Configura quién participa sin alterar las ventas del Excel.',`<div class="info-banner"><strong>Ejemplo para Diana:</strong> desactiva “Participa en ranking” y “Elegible para Top Seller”. Sus ventas seguirán visibles en el ranking real del administrador, pero no competirán por el reconocimiento.</div><section class="advisor-admin-list">${cards||'<div class="panel">Aún no hay asesores sincronizados.</div>'}</section>`);
    document.querySelectorAll('[data-save-advisor]').forEach(btn=>btn.addEventListener('click',()=>saveAdvisor(btn)));
  }catch(e){adminError('advisors','Asesores',e);}
}

async function topSellerView(){
  loadingView('top-seller','Top Seller');
  try{
    const data=await fetchJson('/api/score');
    state.data=data;
    const top=data.topSeller;
    const body=top?`<div class="top-seller-admin-grid"><section class="panel top-seller-preview"><p class="eyebrow plain">RECONOCIMIENTO ACTUAL</p>${avatar(top,true)}<h2>${esc(top.name)}</h2><p>${top.sales} ventas · ${money(top.amount)}</p><div class="cta-row centered"><button class="primary" data-celebrate>★ Ver animación</button><button class="secondary" data-download-top>⬇ Descargar PNG</button></div></section><section class="panel"><p class="eyebrow plain">REGLAS</p><h2>Cómo se elige</h2><p>El Top Seller es el asesor mejor posicionado dentro del ranking público que además tenga activada la opción <strong>Elegible para Top Seller</strong>.</p><button class="secondary" data-nav="/admin/advisors">Configurar asesores →</button></section></div>`:`<section class="panel"><h2>No hay Top Seller elegible</h2><p>Activa al menos un asesor desde Asesores.</p><button class="secondary" data-nav="/admin/advisors">Ir a Asesores</button></section>`;
    adminFrame('top-seller','Top Seller','Vista previa, animación y descarga del reconocimiento.',body);
    wireCommon();
  }catch(e){adminError('top-seller','Top Seller',e);}
}

async function historyView(){
  loadingView('history','Historial');
  try{
    const data=await fetchJson('/api/admin/history');
    const months=(data.months||[]).map(m=>`<section class="panel history-month"><div class="panel-title"><div><p class="eyebrow plain">CORTE MENSUAL</p><h2>${formatMonthKey(m.month)}</h2></div><span class="position-badge">${m.ranking.length} asesores</span></div><div class="history-table">${m.ranking.slice(0,12).map(x=>`<div><b>#${x.position}</b><span>${esc(x.advisorName)}</span><strong>${x.sales} ventas</strong><small>${money(x.amount)}</small></div>`).join('')}</div></section>`).join('');
    adminFrame('history','Historial','Cortes guardados por mes a partir de las sincronizaciones.',months||'<section class="panel"><p>Aún no hay históricos guardados.</p></section>');
  }catch(e){adminError('history','Historial',e);}
}

async function usersView(){
  loadingView('users','Usuarios');
  try{
    const data=await fetchJson('/api/admin/users');
    const rows=(data.users||[]).map(u=>`<div class="user-row" data-user-id="${esc(u.id)}"><div><strong>${esc(u.name||u.email)}</strong><span>${esc(u.email)}</span></div><select data-user-role><option value="superadmin" ${u.role==='superadmin'?'selected':''}>Superadministrador</option><option value="admin" ${u.role==='admin'?'selected':''}>Administrador</option><option value="viewer" ${u.role==='viewer'?'selected':''}>Visualizador</option></select><label class="mini-check"><input type="checkbox" data-user-active ${Number(u.active)===1?'checked':''}> Activo</label><button class="secondary small-button" data-save-user>Guardar</button></div>`).join('');
    const body=`<div class="admin-grid"><section class="panel"><p class="eyebrow plain">NUEVO USUARIO</p><h2>Agregar administrador</h2><form id="adminUserForm" class="stack-form"><label>Nombre<input name="name" required></label><label>Correo<input name="email" type="email" required></label><label>Rol<select name="role"><option value="admin">Administrador</option><option value="superadmin">Superadministrador</option><option value="viewer">Visualizador</option></select></label><button class="primary" type="submit">Agregar usuario</button><span id="userFormStatus"></span></form><p class="form-note">Esta versión guarda usuarios y roles en D1. La pantalla de inicio de sesión y validación de acceso se conectará en una etapa posterior.</p></section><section class="panel"><p class="eyebrow plain">USUARIOS REGISTRADOS</p><h2>Roles</h2><div class="user-list">${rows||'<p>No hay usuarios registrados.</p>'}</div></section></div>`;
    adminFrame('users','Usuarios','Administra el registro interno de usuarios y roles.',body);
    document.getElementById('adminUserForm')?.addEventListener('submit',createUser);
    document.querySelectorAll('[data-save-user]').forEach(btn=>btn.addEventListener('click',()=>saveUser(btn)));
  }catch(e){adminError('users','Usuarios',e);}
}

async function settingsView(){
  loadingView('settings','Configuración');
  try{
    const [settings,status]=await Promise.all([fetchJson('/api/admin/settings'),fetchJson('/api/sharepoint/status',false)]);
    const body=`<div class="settings-grid"><section class="panel settings-card"><p class="eyebrow plain">SISTEMA</p><h2>Estado general</h2><div class="setting-line"><span>D1</span>${statusPill(settings.d1,'Conectado')}</div><div class="setting-line"><span>Versión</span><strong>${esc(settings.version)}</strong></div><div class="setting-line"><span>SharePoint configurado</span>${statusPill(settings.sharepointConfigured,settings.sharepointConfigured?'Sí':'No')}</div></section><section class="panel settings-card"><p class="eyebrow plain">FUENTE DE DATOS</p><h2>Excel original</h2><div class="setting-line"><span>Acceso al archivo</span>${statusPill(!!status.ok,status.ok?'Disponible':'Con error')}</div><div class="setting-line"><span>Última sincronización</span><strong>${settings.source?.lastSyncAt?new Date(settings.source.lastSyncAt).toLocaleString('es-MX'):'Pendiente'}</strong></div><div class="setting-line"><span>Hoja</span><strong>${esc(settings.source?.sheet||'—')}</strong></div><div class="setting-line"><span>Filas usadas</span><strong>${settings.source?.usedRows||0}</strong></div>${status.error?`<p class="error-text">${esc(status.error)}</p>`:''}<button class="secondary" data-sync>↻ Sincronizar ahora</button><pre id="syncResult"></pre></section></div>`;
    adminFrame('settings','Configuración','Estado de D1, SharePoint y sincronización.',body,statusPill(!!status.ok,status.ok?'Operativo':'Revisar'));
    wireAdminActions();
  }catch(e){adminError('settings','Configuración',e);}
}

function adminError(active,title,e){adminFrame(active,title,'',`<section class="panel"><h2>No se pudo cargar</h2><p class="error-text">${esc(e.message)}</p></section>`)}

function render(){
  if(!isAdmin()){publicView();return;}
  const section=adminSection();
  if(section==='advisors')advisorsView();
  else if(section==='top-seller')topSellerView();
  else if(section==='history')historyView();
  else if(section==='users')usersView();
  else if(section==='settings')settingsView();
  else dashboardView();
}

function navigate(path){history.pushState({},'',path);render()}
function wireCommon(){
  document.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
  document.querySelector('[data-celebrate]')?.addEventListener('click',celebration);
  document.querySelectorAll('[data-download-top]').forEach(btn=>btn.addEventListener('click',async()=>{const top=state.data.topSeller;if(top)await downloadRecognitionPng(top)}));
}
function wireAdminActions(){document.querySelector('[data-sync]')?.addEventListener('click',validateSync)}

async function fetchJson(url,throwOnHttp=true,options={}){
  const r=await fetch(url,{cache:'no-store',...options});
  const j=await r.json().catch(()=>({}));
  if(throwOnHttp && (!r.ok || j.ok===false))throw new Error(j.error||`HTTP ${r.status}`);
  return j;
}

async function validateSync(){
  const out=document.getElementById('syncResult');
  if(out)out.textContent='Sincronizando…';
  try{
    const j=await fetchJson('/api/sync',true,{method:'POST'});
    if(out)out.textContent=j.changed?`Actualizado\n${j.parsed?.advisors?.length||0} asesores\n${j.parsed?.usedRows||0} ventas procesadas`:'Sin cambios en el Excel.';
    await refreshScore(false);
    setTimeout(()=>{if(isAdmin())render()},350);
  }catch(e){if(out)out.textContent=`Error: ${e.message}`;}
}

async function saveAdvisor(btn){
  const card=btn.closest('[data-advisor-id]'),id=card.dataset.advisorId,status=card.querySelector('.save-status');
  const field=n=>card.querySelector(`[data-field="${n}"]`);
  const body={displayName:field('displayName').value,photoUrl:field('photoUrl').value,exclusionReason:field('exclusionReason').value,rankingEnabled:field('rankingEnabled').checked,topSellerEligible:field('topSellerEligible').checked,publicVisible:field('publicVisible').checked};
  status.textContent='Guardando…';btn.disabled=true;
  try{await fetchJson(`/api/admin/advisors/${encodeURIComponent(id)}`,true,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});status.textContent='Guardado ✓';await refreshScore(false);}catch(e){status.textContent=`Error: ${e.message}`;}finally{btn.disabled=false;}
}

async function createUser(e){
  e.preventDefault();const form=e.currentTarget,status=document.getElementById('userFormStatus');const fd=new FormData(form);status.textContent='Guardando…';
  try{await fetchJson('/api/admin/users',true,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(fd))});status.textContent='Usuario agregado ✓';setTimeout(()=>usersView(),400);}catch(err){status.textContent=err.message;}
}
async function saveUser(btn){
  const row=btn.closest('[data-user-id]'),id=row.dataset.userId;btn.disabled=true;
  try{await fetchJson(`/api/admin/users/${encodeURIComponent(id)}`,true,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({role:row.querySelector('[data-user-role]').value,active:row.querySelector('[data-user-active]').checked})});btn.textContent='Guardado ✓';setTimeout(()=>btn.textContent='Guardar',1000);}catch(e){btn.textContent='Error';}finally{btn.disabled=false;}
}

function formatMonthKey(v){const [y,m]=String(v).split('-').map(Number);return y&&m?new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)).replace(/^./,s=>s.toUpperCase()):v;}

function celebration(){
  const a=state.data.topSeller;if(!a)return;
  const el=document.createElement('div');el.className='celebration';el.innerHTML=`<div class="confetti c1"></div><div class="confetti c2"></div><div class="confetti c3"></div><div class="confetti c4"></div><div class="celebration-card"><div class="celebration-watermark"><img src="${ASSETS.logoSeal}" alt=""></div><img src="${ASSETS.logoStacked}" alt="Marnez Desarrollos" class="celebration-logo"><p class="eyebrow plain">TOP SELLER · ${monthUpper}</p>${avatar(a,true)}<h1>${esc(a.name)}</h1><p>Reconocemos tu constancia, desempeño y resultados durante este mes.</p><div class="recognition-score"><strong>${a.sales}</strong><span>VENTAS</span></div><div class="modal-actions"><button class="primary" data-modal-download>⬇ Descargar PNG</button><button class="secondary" data-close>Cerrar reconocimiento</button></div><small>MARNEZ DESARROLLOS</small></div>`;document.body.appendChild(el);el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-close]'))el.remove()});el.querySelector('[data-modal-download]').addEventListener('click',()=>downloadRecognitionPng(a));
}

let lastScoreSignature='';
async function refreshScore(renderAfter=true){
  try{
    const d=await fetchJson('/api/score');
    const sig=JSON.stringify({updatedAt:d.updatedAt,sourceStatus:d.sourceStatus,advisors:d.advisors,topSeller:d.topSeller});
    state.data=d;
    if(renderAfter && sig!==lastScoreSignature && !isAdmin())render();
    lastScoreSignature=sig;
  }catch(e){if(!lastScoreSignature&&!isAdmin())render();}
}
window.addEventListener('popstate',render);
refreshScore(false).finally(render);
setInterval(()=>refreshScore(true),30000);

async function downloadRecognitionPng(advisor){
  const dataUrl=await buildRecognitionPng(advisor),link=document.createElement('a');
  const safeName=advisor.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  link.href=dataUrl;link.download=`top-seller-${safeName}-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}.png`;document.body.appendChild(link);link.click();link.remove();
}

async function buildRecognitionPng(advisor){
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');
  ctx.fillStyle=COLORS.light;ctx.fillRect(0,0,1080,1350);const grad=ctx.createLinearGradient(0,0,0,1350);grad.addColorStop(0,'#efefef');grad.addColorStop(1,'#e3e3e3');ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1350);drawGlow(ctx,880,180,250,'rgba(255,217,57,0.16)');drawGlow(ctx,220,1180,320,'rgba(28,42,53,0.07)');
  const seal=await loadImageSafe(ASSETS.logoSeal);if(seal){ctx.save();ctx.globalAlpha=.06;ctx.drawImage(seal,715,915,255,255);ctx.restore();}roundRect(ctx,104,110,872,1120,42,COLORS.white,'rgba(28,42,53,0.08)');
  const logo=await loadImageSafe(ASSETS.logoHorizontal);if(logo){const w=320,h=logo.height*(w/logo.width);ctx.drawImage(logo,380,152,w,h)}
  ctx.textAlign='center';ctx.fillStyle=COLORS.navy;ctx.font='700 26px "Guaruja Neue", Arial, sans-serif';ctx.fillText(`TOP SELLER · ${monthUpper}`,540,300);ctx.fillStyle=COLORS.textSoft;ctx.font='500 20px "Guaruja Neue", Arial, sans-serif';ctx.fillText('Reconocimiento mensual de desempeño comercial',540,338);
  const x=540,y=470,r=92;if(advisor.photoUrl){const photo=await loadImageSafe(advisor.photoUrl);if(photo){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.closePath();ctx.clip();drawCoverImage(ctx,photo,x-r,y-r,r*2,r*2);ctx.restore();ctx.lineWidth=8;ctx.strokeStyle=COLORS.creamStrong;ctx.beginPath();ctx.arc(x,y,r+4,0,Math.PI*2);ctx.stroke()}else drawInitialsAvatar(ctx,advisor.name,x,y,r)}else drawInitialsAvatar(ctx,advisor.name,x,y,r);
  ctx.fillStyle=COLORS.charcoal;ctx.font='700 66px "Guaruja Neue", Arial, sans-serif';ctx.fillText(advisor.name,540,630);ctx.fillStyle=COLORS.textSoft;ctx.font='500 30px "Guaruja Neue", Arial, sans-serif';wrapText(ctx,'Reconocemos tu constancia, desempeño y resultados durante este mes.',540,690,680,40);ctx.fillStyle=COLORS.navy;ctx.font='700 28px "Guaruja Neue", Arial, sans-serif';ctx.fillText('SALES SCORE · MARNEZ DESARROLLOS',540,815);
  ctx.fillStyle=COLORS.navy;ctx.beginPath();ctx.arc(540,925,105,0,Math.PI*2);ctx.fill();ctx.fillStyle=COLORS.white;ctx.font='700 82px "Guaruja Neue", Arial, sans-serif';ctx.fillText(String(advisor.sales),540,940);ctx.font='700 24px "Guaruja Neue", Arial, sans-serif';ctx.fillText('VENTAS',540,980);roundRect(ctx,250,1040,580,88,44,COLORS.creamStrong);ctx.fillStyle=COLORS.charcoal;ctx.font='700 32px "Guaruja Neue", Arial, sans-serif';ctx.fillText('TOP SELLER DEL MES',540,1095);ctx.fillStyle=COLORS.navy;ctx.font='700 20px "Guaruja Neue", Arial, sans-serif';ctx.fillText('Reconocimiento oficial generado por MARNEZ Sales Score',540,1170);ctx.fillStyle=COLORS.yellow;ctx.fillRect(218,1198,644,4);ctx.fillStyle=COLORS.textSoft;ctx.font='500 18px "Guaruja Neue", Arial, sans-serif';ctx.fillText(`Emitido en ${month}`,540,1242);return canvas.toDataURL('image/png');
}
function roundRect(ctx,x,y,w,h,r,fill,stroke){const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function drawGlow(ctx,x,y,radius,color){const g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,color);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill()}
function drawInitialsAvatar(ctx,name,x,y,r){ctx.save();ctx.fillStyle='#dde1e5';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle=COLORS.navy;ctx.font='700 54px "Guaruja Neue", Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials(name),x,y+4);ctx.restore();ctx.textBaseline='alphabetic'}
function drawCoverImage(ctx,img,x,y,w,h){const scale=Math.max(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
function wrapText(ctx,text,centerX,startY,maxWidth,lineHeight){const words=text.split(' '),lines=[];let line='';words.forEach(word=>{const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test});if(line)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,centerX,startY+i*lineHeight))}
function loadImageSafe(src){return new Promise(resolve=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src})}
