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
const state={data:{advisors:demo,topSeller:demo[0],updatedAt:new Date().toISOString(),sourceStatus:'demo'},adminCache:{},auth:{checked:false,authenticated:false,user:null,configured:false,seedConfigured:false}};
const month=new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(new Date()).replace(/^./,s=>s.toUpperCase());
const monthUpper=month.toUpperCase();
const TOP_SELLER_MESSAGE='Reconocemos tu liderazgo comercial, constancia y resultados extraordinarios durante este mes.';
const DIPLOMA_MOTIVATION='Tu constancia, enfoque y dedicación convierten el esfuerzo en resultados extraordinarios.';
const esc=(s='')=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const initials=n=>String(n||'').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(Number(n||0));
const avatar=(a,large=false)=>a?.photoUrl?`<span class="avatar avatar-photo ${large?'avatar-large':''}"><img class="avatar-image" src="${esc(a.photoUrl)}" alt=""><span class="avatar-fallback-inner">${initials(a?.name)}</span></span>`:`<div class="avatar avatar-fallback ${large?'avatar-large':''}">${initials(a?.name)}</div>`;
const movement=(a,p)=>!a.previousPosition?'—':a.previousPosition-p>0?`↑ ${a.previousPosition-p}`:a.previousPosition-p<0?`↓ ${Math.abs(a.previousPosition-p)}`:'—';
const movementClass=t=>t.startsWith('↑')?'up':t.startsWith('↓')?'down':'muted';
const isAdmin=()=>location.pathname.startsWith('/admin');
const adminSection=()=>location.pathname.replace(/^\/admin\/?/,'').split('/')[0]||'dashboard';

function brand(mode='default'){
  return `<div class="brand brand-${mode}"><img src="${ASSETS.logoHorizontal}" alt="Marnez Desarrollos" class="brand-logo ${mode==='compact'?'compact':''}"></div>`;
}

function ranking(advisors,{title='Sales Score',topSellerId=null,eyebrow='RANKING ACTUAL',showAwardDownloads=false}={}){
  if(!advisors?.length)return `<section class="panel empty-panel"><p class="eyebrow plain">${eyebrow}</p><h2>${title}</h2><p>No hay asesores elegibles para mostrar en este ranking.</p></section>`;
  return `<section class="panel ranking-panel"><div class="panel-title"><div><p class="eyebrow plain">${eyebrow}</p><h2>${title}</h2></div><span class="icon">🏆</span></div><div class="table-head"><span>#</span><span>Asesor</span><span>Movimiento</span><span>Ventas</span></div>${advisors.map((a,i)=>{const m=movement(a,i+1),rank=i+1;const direct=showAwardDownloads&&[2,3].includes(rank)?`<div class="rank-award-actions"><button class="rank-download-btn" data-award-download="png" data-award-rank="${rank}" data-advisor-id="${esc(a.id)}">PNG</button><button class="rank-download-btn" data-award-download="pdf" data-award-rank="${rank}" data-advisor-id="${esc(a.id)}">PDF</button></div>`:'';return `<div class="rank-row ${String(a.id)===String(topSellerId)?'leader':''}"><span class="rank-number">${String(rank).padStart(2,'0')}</span><div class="advisor-cell">${avatar(a)}<div class="advisor-name-stack"><strong>${esc(a.name)}</strong>${String(a.id)===String(topSellerId)?'<small>TOP SELLER</small>':''}${direct}</div></div><span class="${movementClass(m)}">${m}</span><strong class="sales-number">${a.sales}</strong></div>`}).join('')}</section>`;
}

function podium(advisors){
  const order=[advisors?.[1],advisors?.[0],advisors?.[2]],pos=[2,1,3];
  return `<div class="podium">${order.map((a,i)=>a?`<div class="podium-item p${pos[i]}"><div class="podium-rank">${pos[i]===1?'♛':'◉'}</div>${avatar(a,pos[i]===1)}<strong>${esc(a.name)}</strong><span>${a.sales} ventas</span>${pos[i]!==1?`<div class="podium-direct-downloads"><button data-award-download="png" data-award-rank="${pos[i]}" data-advisor-id="${esc(a.id)}">PNG</button><button data-award-download="pdf" data-award-rank="${pos[i]}" data-advisor-id="${esc(a.id)}">PDF</button></div>`:''}<div class="podium-block">${pos[i]}</div></div>`:'').join('')}</div>`;
}

function awardMeta(rank=1){
  if(Number(rank)===2)return{rank:2,title:'SEGUNDO LUGAR',subtitle:'Reconocimiento al segundo lugar del mes',short:'2do lugar',slug:'segundo-lugar'};
  if(Number(rank)===3)return{rank:3,title:'TERCER LUGAR',subtitle:'Reconocimiento al tercer lugar del mes',short:'3er lugar',slug:'tercer-lugar'};
  return{rank:1,title:'TOP SELLER',subtitle:'Reconocimiento al mejor asesor del mes',short:'Top Seller',slug:'top-seller'};
}

function awardButtons(advisor,rank,theme='light'){
  const meta=awardMeta(rank);
  const dark=theme==='dark'?' secondary-dark':'';
  return `<div class="cta-row award-actions-row"><button class="secondary${dark}" data-award-download="png" data-award-rank="${rank}" data-advisor-id="${esc(advisor.id)}">⬇ Reconocimiento PNG</button><button class="secondary${dark}" data-award-download="pdf" data-award-rank="${rank}" data-advisor-id="${esc(advisor.id)}">⬇ Certificado PDF</button></div>`;
}

function awardsShowcase(advisors,theme='light'){
  if(!advisors?.length)return '';
  return `<section class="panel award-showcase ${theme==='dark'?'award-showcase-dark':''}"><div class="panel-title"><div><p class="eyebrow plain">RECONOCIMIENTOS</p><h2>Descargas del podio</h2></div><span class="icon">🏅</span></div><div class="award-grid">${advisors.slice(0,3).map((a,i)=>{const meta=awardMeta(i+1);return `<article class="award-card ${i===0?'award-card-highlight':''}"><div class="award-card-head"><span class="award-rank-badge">${String(i+1).padStart(2,'0')}</span><div class="award-card-avatar">${avatar(a)}</div></div><div class="award-card-copy"><small>${meta.short}</small><h3>${esc(a.name)}</h3><p>${meta.subtitle}</p></div>${awardButtons(a,i+1,theme)}</article>`}).join('')}</div></section>`;
}

function advisorById(id){return (state.data.advisors||[]).find(a=>String(a.id)===String(id))||null}

function publicView(){
  const advisors=state.data.advisors||[];
  const top=state.data.topSeller||null;
  root.innerHTML=`<div class="site-shell">
    <header class="public-header">${brand()}<div class="header-actions"><span class="live"><i></i> EN VIVO</span>${state.auth.authenticated?'<button class="text-btn" data-nav="/admin">Administrador</button>':''}</div></header>
    <main class="public-main">
      <div class="hero-copy"><p class="eyebrow plain">RANKING DE VENTAS · ${monthUpper}</p><h1>Resultados que<br><span>se reconocen.</span></h1><p>Score en vivo para visualizar el desempeño comercial, destacar al Top Seller del mes y compartir su reconocimiento en PNG.</p></div>
      ${top?`<section class="top-card top-card-premium"><div class="top-watermark"><img src="${ASSETS.logoSeal}" alt=""></div><div class="top-glow"></div><div class="top-card-grid"><div class="top-copy-zone"><div class="eyebrow">TOP SELLER · ${monthUpper}</div><p class="muted">Reconocimiento del mes</p><h1>${esc(top.name)}</h1><p class="top-copy">${TOP_SELLER_MESSAGE}</p><div class="top-stats"><div><strong>${top.sales}</strong><span>Ventas</span></div>${top.amount?`<div><strong>${money(top.amount)}</strong><span>Monto</span></div>`:''}</div><div class="cta-row"><button class="primary" data-celebrate>★ Mostrar reconocimiento</button><button class="secondary secondary-dark" data-download-top>⬇ Reconocimiento PNG</button><button class="secondary secondary-dark" data-download-diploma>⬇ Certificado PDF</button></div></div><div class="top-photo-zone"><div class="top-photo-frame">${avatar(top,true)}</div><div class="top-award-badge"><span>01</span><small>TOP SELLER</small></div></div></div></section>`:`<section class="panel empty-panel"><h2>Top Seller pendiente</h2><p>No hay asesores elegibles para reconocimiento. Puedes configurarlos desde Administrador → Asesores.</p></section>`}
      <section class="panel podium-panel"><div class="panel-title"><div><p class="eyebrow plain">PODIO DEL MES</p><h2>Top 3 público</h2></div><span class="icon">🥇</span></div>${podium(advisors.slice(0,3))}</section>
      ${awardsShowcase(advisors.slice(0,3),'dark')}
      ${ranking(advisors,{topSellerId:top?.id})}
      <footer>Última actualización: ${new Date(state.data.updatedAt).toLocaleString('es-MX')} · MARNEZ Desarrollos · v0.7.3</footer>
    </main></div>`;
  wireCommon();
}

const navItems=[
  ['dashboard','▦','Dashboard','/admin'],
  ['advisors','♙','Asesores','/admin/advisors'],
  ['top-seller','🏆','Reconocimientos','/admin/top-seller'],
  ['history','◷','Historial','/admin/history'],
  ['users','◈','Usuarios','/admin/users'],
  ['settings','⚙','Configuración','/admin/settings']
];

function sidebar(active){
  const user=state.auth.user;
  const visibleNav=navItems.filter(([id])=>id!=='users'||user?.role==='superadmin');
  return `<aside class="sidebar">${brand('compact')}<nav>${visibleNav.map(([id,icon,label,path])=>`<button class="${id===active?'active':''}" data-nav="${path}">${icon} ${label}</button>`).join('')}</nav><div class="sidebar-card"><p class="eyebrow">SESIÓN</p><p><strong>${esc(user?.name||user?.email||'Administrador')}</strong><br><span>${esc(roleLabel(user?.role))}</span></p></div><div class="sidebar-card"><p class="eyebrow">RANKING PÚBLICO</p><p>Las ventas reales se conservan. Desde Asesores decides quién participa en el ranking y quién puede recibir Top Seller.</p></div><button class="ghost" data-nav="/">Ir a vista asesores →</button><div class="sidebar-version">v0.7.3</div><button class="ghost logout-button" data-logout>Cerrar sesión</button></aside>`;
}
function roleLabel(role){return role==='superadmin'?'Superadministrador':role==='admin'?'Administrador':'Visualizador'}
function canEditAdmin(){return ['superadmin','admin'].includes(state.auth.user?.role)}

function adminFrame(active,title,subtitle,body,actions=''){
  root.innerHTML=`<div class="admin-layout">${sidebar(active)}<main class="admin-main"><header class="page-header"><div><p class="eyebrow plain">ADMINISTRACIÓN</p><h1>${title}</h1>${subtitle?`<p class="page-subtitle">${subtitle}</p>`:''}</div><div class="page-actions">${actions}</div></header>${body}</main></div>`;
  wireCommon();
}

function loadingView(active,title){adminFrame(active,title,'','<section class="panel loading-panel">Cargando información…</section>')}
function statusPill(ok,label){return `<span class="status-pill ${ok?'status-ok':'status-off'}"><i></i>${label}</span>`}


async function refreshAuth(){
  try{
    const [status,me]=await Promise.all([fetchJson('/api/auth/status',false),fetchJson('/api/auth/me',false)]);
    state.auth.checked=true;
    state.auth.configured=!!status.configured;
    state.auth.seedConfigured=!!status.seedConfigured;
    state.auth.authenticated=!!me.authenticated;
    state.auth.user=me.user||null;
  }catch{
    state.auth.checked=true;state.auth.authenticated=false;state.auth.user=null;
  }
}

function authGateView(){
  root.innerHTML=`<div class="auth-shell"><section class="auth-card">${brand()}<p class="eyebrow plain">ACCESO ADMINISTRATIVO</p><h1>Iniciar sesión</h1><p>Ingresa con una cuenta autorizada para administrar MARNEZ Sales Score.</p>${(!state.auth.configured&&!state.auth.seedConfigured)?`<div class="auth-warning"><strong>Falta configurar el acceso inicial en Cloudflare.</strong><span>Crea los secretos <code>SUPERADMIN_EMAIL</code> y <code>SUPERADMIN_PASSWORD</code>. No se requiere código de configuración.</span></div>`:''}<form id="loginForm" class="stack-form auth-form"><label>Correo<input name="email" type="email" required autocomplete="username"></label><label>Contraseña<input name="password" type="password" required autocomplete="current-password"></label><button class="primary auth-primary" type="submit">Entrar al administrador</button><span id="authStatus"></span></form><button class="text-btn auth-back" data-nav="/">← Volver al ranking</button></section></div>`;
  wireCommon();
  document.getElementById('loginForm')?.addEventListener('submit',loginSubmit);
}

async function loginSubmit(e){
  e.preventDefault();const form=e.currentTarget,status=document.getElementById('authStatus'),fd=new FormData(form);status.textContent='Verificando…';
  try{const result=await fetchJson('/api/auth/login',true,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})});state.auth.authenticated=true;state.auth.user=result.user;render();}
  catch(err){status.textContent=err.message;}
}

async function logout(){
  try{await fetchJson('/api/auth/logout',false,{method:'POST'});}catch{}
  state.auth.authenticated=false;state.auth.user=null;history.pushState({},'','/');render();
}

async function dashboardView(){
  loadingView('dashboard','Dashboard de ventas');
  try{
    const data=await fetchJson('/api/admin/overview');
    const real=data.realRanking||[], pub=data.publicRanking||[], top=data.topSeller;
    const body=`<div class="kpis four"><div class="kpi"><b>▥</b><span>Ventas reales<strong>${data.totals?.sales||0}</strong></span></div><div class="kpi"><b>♙</b><span>Asesores en Excel<strong>${data.totals?.advisors||0}</strong></span></div><div class="kpi"><b>◎</b><span>Participan ranking<strong>${data.totals?.publicAdvisors||0}</strong></span></div><div class="kpi"><b>♛</b><span>Top Seller<strong>${esc(top?.name||'—')}</strong></span></div></div>
      <div class="compare-note"><strong>Ranking real vs. ranking público</strong><span>El ranking real respeta el Excel. El público aplica las reglas de reconocimiento configuradas por administración.</span></div>
      <div class="admin-grid admin-grid-equal">${ranking(real,{title:'Ranking real',eyebrow:'DATOS DEL EXCEL'})}${ranking(pub,{title:'Ranking público',eyebrow:'VISIBLE PARA ASESORES',topSellerId:top?.id,showAwardDownloads:true})}</div>
      <section class="panel source-panel"><div><p class="eyebrow plain">SINCRONIZACIÓN</p><h2>Excel original</h2><p>Última sincronización: ${data.source?.lastSyncAt?new Date(data.source.lastSyncAt).toLocaleString('es-MX'):'Pendiente'} · Filas procesadas: ${data.source?.usedRows||0}</p>${data.source?.lastError?`<p class="error-text">${esc(data.source.lastError)}</p>`:''}</div>${canEditAdmin()?'<button class="secondary" data-sync>↻ Sincronizar ahora</button>':''}<pre id="syncResult"></pre></section>`;
    adminFrame('dashboard','Dashboard de ventas','Consulta el resultado real y el ranking de reconocimiento por separado.',body,statusPill(!data.source?.lastError,data.source?.lastError?'Con alerta':'Sincronizado'));
    wireAdminActions();
  }catch(e){adminError('dashboard','Dashboard de ventas',e);}
}

async function advisorsView(){
  loadingView('advisors','Asesores');
  try{
    const data=await fetchJson('/api/admin/advisors');
    const canEdit=canEditAdmin();
    const cards=(data.advisors||[]).map(a=>`<article class="advisor-admin-card" data-advisor-id="${esc(a.id)}"><div class="advisor-admin-head">${avatar(a)}<div><strong>${esc(a.name)}</strong><span>${a.sales} ventas · ${money(a.amount)}</span></div><span class="position-badge">#${a.actualPosition||'—'} real</span></div><div class="advisor-form-grid"><label>Nombre visible<input data-field="displayName" ${canEdit?'':'disabled'} value="${esc(a.name===a.sourceName?'':a.name)}" placeholder="${esc(a.sourceName)}"></label><label>Fotografía<input type="hidden" data-field="photoUrl" value="${esc(a.photoUrl||'')}"><div class="photo-upload-row"><label class="photo-upload-button ${canEdit?'':'disabled'}">Subir fotografía<input type="file" data-photo-file accept="image/png,image/jpeg,image/webp" ${canEdit?'':'disabled'}></label>${canEdit?'<button class="secondary small-button" type="button" data-remove-photo>Quitar</button>':''}</div><small class="photo-help">El portal la optimiza y la guarda para que no dependa de enlaces externos.</small></label><label class="wide">Motivo / nota interna<input data-field="exclusionReason" ${canEdit?'':'disabled'} value="${esc(a.exclusionReason||'')}" placeholder="Ej. Coordinación comercial"></label></div><div class="toggle-grid"><label class="toggle-line"><span><strong>Participa en ranking</strong><small>Si está desactivado, sus ventas siguen en el ranking real pero no ocupan posición pública.</small></span><input type="checkbox" data-field="rankingEnabled" ${a.rankingEnabled?'checked':''} ${canEdit?'':'disabled'}><i></i></label><label class="toggle-line"><span><strong>Elegible para Top Seller</strong><small>Puede aparecer en ranking sin recibir el reconocimiento.</small></span><input type="checkbox" data-field="topSellerEligible" ${a.topSellerEligible?'checked':''} ${canEdit?'':'disabled'}><i></i></label><label class="toggle-line"><span><strong>Mostrar en portal público</strong><small>Oculta completamente al asesor de la vista pública.</small></span><input type="checkbox" data-field="publicVisible" ${a.publicVisible?'checked':''} ${canEdit?'':'disabled'}><i></i></label></div><div class="card-actions"><span class="save-status"></span>${canEdit?'<button class="primary compact-primary" data-save-advisor>Guardar cambios</button>':'<span class="viewer-note">Solo lectura</span>'}</div></article>`).join('');
    adminFrame('advisors','Asesores','Configura quién participa sin alterar las ventas del Excel.',`<div class="info-banner"><strong>Ejemplo para Diana:</strong> desactiva “Participa en ranking” y “Elegible para Top Seller”. Sus ventas seguirán visibles en el ranking real del administrador, pero no competirán por el reconocimiento.</div><section class="advisor-admin-list">${cards||'<div class="panel">Aún no hay asesores sincronizados.</div>'}</section>`);
    document.querySelectorAll('[data-save-advisor]').forEach(btn=>btn.addEventListener('click',()=>saveAdvisor(btn)));
    document.querySelectorAll('[data-photo-file]').forEach(input=>input.addEventListener('change',()=>handleAdvisorPhoto(input)));
    document.querySelectorAll('[data-remove-photo]').forEach(btn=>btn.addEventListener('click',()=>removeAdvisorPhoto(btn)));
  }catch(e){adminError('advisors','Asesores',e);}
}

async function topSellerView(){
  loadingView('top-seller','Reconocimientos');
  try{
    const data=await fetchJson('/api/admin/overview');
    state.adminCache.overview=data;
    const podiumList=(data.publicRanking||[]).slice(0,3);
    state.data={...state.data,advisors:data.publicRanking||[],topSeller:data.topSeller||podiumList[0]||null,updatedAt:data.updatedAt||state.data.updatedAt};
    if(!podiumList.length){
      adminFrame('top-seller','Reconocimientos','Descarga las piezas del Top 3.',`<section class="panel"><h2>No hay asesores elegibles</h2><p>Activa asesores en el ranking público para generar sus reconocimientos.</p><button class="secondary" data-nav="/admin/advisors">Ir a Asesores</button></section>`);
      return;
    }
    const cards=podiumList.map((a,i)=>{
      const rank=i+1,meta=awardMeta(rank);
      return `<article class="podium-download-card podium-download-card-${rank}">
        <div class="podium-download-rank"><span>${String(rank).padStart(2,'0')}</span><small>${meta.short}</small></div>
        <div class="podium-download-photo">${avatar(a,true)}</div>
        <div class="podium-download-copy"><p class="eyebrow plain">${meta.title}</p><h2>${esc(a.name)}</h2><p>${meta.subtitle}</p></div>
        <div class="podium-download-actions">${rank===1?'<button class="primary" data-celebrate>★ Ver animación</button>':''}<button class="secondary" data-award-download="png" data-award-rank="${rank}" data-advisor-id="${esc(a.id)}">⬇ Reconocimiento PNG</button><button class="secondary" data-award-download="pdf" data-award-rank="${rank}" data-advisor-id="${esc(a.id)}">⬇ Certificado PDF</button></div>
      </article>`;
    }).join('');
    const body=`<section class="recognitions-hero"><div><p class="eyebrow plain">PODIO DEL MES</p><h2>Reconocimientos del Top 3</h2><p>Descarga el reconocimiento PNG y el certificado PDF de cada posición.</p></div></section><div class="podium-download-grid">${cards}</div>`;
    adminFrame('top-seller','Reconocimientos','Top Seller, segundo y tercer lugar en un mismo apartado.',body);
    wireCommon();
  }catch(e){adminError('top-seller','Reconocimientos',e);}
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
    const rows=(data.users||[]).map(u=>`<div class="user-row user-row-auth" data-user-id="${esc(u.id)}"><div><strong>${esc(u.name||u.email)}</strong><span>${esc(u.email)} · ${u.hasPassword?'Acceso activo':'Sin contraseña'}</span></div><select data-user-role><option value="superadmin" ${u.role==='superadmin'?'selected':''}>Superadministrador</option><option value="admin" ${u.role==='admin'?'selected':''}>Administrador</option><option value="viewer" ${u.role==='viewer'?'selected':''}>Visualizador</option></select><label class="mini-check"><input type="checkbox" data-user-active ${u.active?'checked':''}> Activo</label><input class="password-reset-input" data-user-password type="password" minlength="10" placeholder="Nueva contraseña (opcional)"><button class="secondary small-button" data-save-user>Guardar</button></div>`).join('');
    const body=`<div class="admin-grid"><section class="panel"><p class="eyebrow plain">NUEVO USUARIO</p><h2>Agregar administrador</h2><form id="adminUserForm" class="stack-form"><label>Nombre<input name="name" required></label><label>Correo<input name="email" type="email" required></label><label>Contraseña temporal<input name="password" type="password" minlength="10" required></label><label>Rol<select name="role"><option value="admin">Administrador</option><option value="superadmin">Superadministrador</option><option value="viewer">Visualizador</option></select></label><button class="primary" type="submit">Agregar usuario</button><span id="userFormStatus"></span></form><p class="form-note">Cada usuario inicia sesión con su correo y contraseña. Solo el Superadministrador puede administrar usuarios.</p></section><section class="panel"><p class="eyebrow plain">USUARIOS REGISTRADOS</p><h2>Accesos y roles</h2><div class="user-list">${rows||'<p>No hay usuarios registrados.</p>'}</div></section></div>`;
    adminFrame('users','Usuarios','Crea accesos y controla el nivel de permisos.',body);
    document.getElementById('adminUserForm')?.addEventListener('submit',createUser);
    document.querySelectorAll('[data-save-user]').forEach(btn=>btn.addEventListener('click',()=>saveUser(btn)));
  }catch(e){adminError('users','Usuarios',e);}
}

async function settingsView(){
  loadingView('settings','Configuración');
  try{
    const [settings,status]=await Promise.all([fetchJson('/api/admin/settings'),fetchJson('/api/sharepoint/status',false)]);
    const body=`<div class="settings-grid"><section class="panel settings-card"><p class="eyebrow plain">SISTEMA</p><h2>Estado general</h2><div class="setting-line"><span>D1</span>${statusPill(settings.d1,'Conectado')}</div><div class="setting-line"><span>Versión</span><strong>${esc(settings.version)}</strong></div><div class="setting-line"><span>SharePoint configurado</span>${statusPill(settings.sharepointConfigured,settings.sharepointConfigured?'Sí':'No')}</div></section><section class="panel settings-card"><p class="eyebrow plain">FUENTE DE DATOS</p><h2>Excel original</h2><div class="setting-line"><span>Acceso al archivo</span>${statusPill(!!status.ok,status.ok?'Disponible':'Con error')}</div><div class="setting-line"><span>Última sincronización</span><strong>${settings.source?.lastSyncAt?new Date(settings.source.lastSyncAt).toLocaleString('es-MX'):'Pendiente'}</strong></div><div class="setting-line"><span>Hoja</span><strong>${esc(settings.source?.sheet||'—')}</strong></div><div class="setting-line"><span>Filas usadas</span><strong>${settings.source?.usedRows||0}</strong></div>${status.error?`<p class="error-text">${esc(status.error)}</p>`:''}${canEditAdmin()?'<button class="secondary" data-sync>↻ Sincronizar ahora</button>':''}<pre id="syncResult"></pre></section></div>`;
    adminFrame('settings','Configuración','Estado de D1, SharePoint y sincronización.',body,statusPill(!!status.ok,status.ok?'Operativo':'Revisar'));
    wireAdminActions();
  }catch(e){adminError('settings','Configuración',e);}
}

function adminError(active,title,e){adminFrame(active,title,'',`<section class="panel"><h2>No se pudo cargar</h2><p class="error-text">${esc(e.message)}</p></section>`)}

function render(){
  if(!isAdmin()){publicView();return;}
  if(!state.auth.checked){root.innerHTML='<div class="auth-shell"><section class="auth-card"><p>Cargando acceso…</p></section></div>';return;}
  if(!state.auth.authenticated){authGateView();return;}
  const section=adminSection();
  if(section==='users' && state.auth.user?.role!=='superadmin'){navigate('/admin');return;}
  if(section==='advisors')advisorsView();
  else if(section==='top-seller')topSellerView();
  else if(section==='history')historyView();
  else if(section==='users')usersView();
  else if(section==='settings')settingsView();
  else dashboardView();
}

function navigate(path){history.pushState({},'',path);render()}
function wireCommon(){
  wireAvatarFallbacks();
  document.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
  document.querySelector('[data-logout]')?.addEventListener('click',logout);
  document.querySelector('[data-celebrate]')?.addEventListener('click',celebration);
  document.querySelectorAll('[data-download-top]').forEach(btn=>btn.addEventListener('click',async()=>{const top=state.data.topSeller;if(top)await downloadRecognitionPng(top,1)}));
  document.querySelectorAll('[data-download-diploma]').forEach(btn=>btn.addEventListener('click',async()=>{const top=state.data.topSeller;if(top)await downloadCertificatePdf(top,1)}));
  document.querySelectorAll('[data-award-download]').forEach(btn=>btn.addEventListener('click',async()=>{const advisor=advisorById(btn.dataset.advisorId);const rank=Number(btn.dataset.awardRank||1);if(!advisor)return;if(btn.dataset.awardDownload==='pdf')await downloadCertificatePdf(advisor,rank);else await downloadRecognitionPng(advisor,rank)}));
}
function wireAdminActions(){document.querySelector('[data-sync]')?.addEventListener('click',validateSync)}

async function fetchJson(url,throwOnHttp=true,options={}){
  const r=await fetch(url,{cache:'no-store',credentials:'same-origin',...options});
  const j=await r.json().catch(()=>({}));
  if(r.status===401 && isAdmin() && !url.startsWith('/api/auth/')){
    state.auth.authenticated=false;state.auth.user=null;setTimeout(render,0);
  }
  if(throwOnHttp && (!r.ok || j.ok===false))throw new Error(j.error||`HTTP ${r.status}`);
  return j;
}

function wireAvatarFallbacks(scope=document){
  scope.querySelectorAll('.avatar-photo .avatar-image').forEach(img=>{
    const wrapper=img.closest('.avatar-photo');
    const fail=()=>wrapper?.classList.add('is-broken');
    if(img.complete && img.naturalWidth===0)fail();
    else img.addEventListener('error',fail,{once:true});
  });
}

async function handleAdvisorPhoto(input){
  const file=input.files?.[0]; if(!file)return;
  const card=input.closest('[data-advisor-id]');
  const status=card?.querySelector('.save-status');
  try{
    if(status)status.textContent='Procesando fotografía…';
    const dataUrl=await compressAdvisorPhoto(file);
    const field=card.querySelector('[data-field="photoUrl"]');field.value=dataUrl;
    const name=(card.querySelector('[data-field="displayName"]')?.value||card.querySelector('.advisor-admin-head strong')?.textContent||'Asesor').trim();
    const current=card.querySelector('.advisor-admin-head .avatar');
    if(current){current.outerHTML=avatar({name,photoUrl:dataUrl});wireAvatarFallbacks(card);}
    if(status)status.textContent='Foto lista · guarda los cambios';
  }catch(e){if(status)status.textContent=`Foto no válida: ${e.message}`;input.value='';}
}

function removeAdvisorPhoto(btn){
  const card=btn.closest('[data-advisor-id]');if(!card)return;
  const field=card.querySelector('[data-field="photoUrl"]');if(field)field.value='';
  const name=(card.querySelector('[data-field="displayName"]')?.value||card.querySelector('.advisor-admin-head strong')?.textContent||'Asesor').trim();
  const current=card.querySelector('.advisor-admin-head .avatar');if(current)current.outerHTML=avatar({name,photoUrl:null});
  const file=card.querySelector('[data-photo-file]');if(file)file.value='';
  const status=card.querySelector('.save-status');if(status)status.textContent='Foto eliminada · guarda los cambios';
}

async function compressAdvisorPhoto(file){
  if(!file.type.startsWith('image/'))throw new Error('selecciona una imagen JPG, PNG o WebP');
  if(file.size>10*1024*1024)throw new Error('la imagen supera 10 MB');
  const img=await fileToImage(file);
  const side=Math.min(img.width,img.height), sx=(img.width-side)/2, sy=(img.height-side)/2;
  const canvas=document.createElement('canvas');canvas.width=360;canvas.height=360;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#e9e9e9';ctx.fillRect(0,0,360,360);ctx.drawImage(img,sx,sy,side,side,0,0,360,360);
  let data=canvas.toDataURL('image/webp',0.82);
  if(!data.startsWith('data:image/webp'))data=canvas.toDataURL('image/jpeg',0.84);
  return data;
}

function fileToImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('no pude leer el archivo'))};
    img.src=url;
  });
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
  try{await fetchJson(`/api/admin/users/${encodeURIComponent(id)}`,true,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({role:row.querySelector('[data-user-role]').value,active:row.querySelector('[data-user-active]').checked,password:row.querySelector('[data-user-password]')?.value||''})});btn.textContent='Guardado ✓';setTimeout(()=>btn.textContent='Guardar',1000);}catch(e){btn.textContent='Error';}finally{btn.disabled=false;}
}

function formatMonthKey(v){const [y,m]=String(v).split('-').map(Number);return y&&m?new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)).replace(/^./,s=>s.toUpperCase()):v;}

function celebration(){
  const a=state.data.topSeller;if(!a)return;
  const el=document.createElement('div');
  el.className='celebration';
  el.innerHTML=`<div class="confetti c1"></div><div class="confetti c2"></div><div class="confetti c3"></div><div class="confetti c4"></div><div class="celebration-card premium-card"><div class="celebration-watermark"><img src="${ASSETS.logoSeal}" alt=""></div><div class="celebration-grid"><div class="celebration-copy"><img src="${ASSETS.logoStacked}" alt="Marnez Desarrollos" class="celebration-logo"><p class="eyebrow plain">TOP SELLER DEL MES · ${monthUpper}</p><h1>${esc(a.name)}</h1><p>${TOP_SELLER_MESSAGE}</p><div class="celebration-pill-row"><span class="celebration-pill">${a.sales} ventas</span>${a.amount?`<span class="celebration-pill">${money(a.amount)}</span>`:''}</div><blockquote>${DIPLOMA_MOTIVATION}</blockquote></div><div class="celebration-visual"><div class="celebration-photo-wrap">${avatar(a,true)}</div><div class="recognition-score"><strong>${a.sales}</strong><span>VENTAS</span></div></div></div><div class="modal-actions"><button class="primary" data-modal-download>⬇ Reconocimiento PNG</button><button class="secondary" data-modal-diploma>⬇ Certificado PDF</button><button class="secondary" data-close>Cerrar</button></div><small>MARNEZ DESARROLLOS</small></div>`;
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-close]'))el.remove()});
  el.querySelector('[data-modal-download]')?.addEventListener('click',()=>downloadRecognitionPng(a,1));
  el.querySelector('[data-modal-diploma]')?.addEventListener('click',()=>downloadCertificatePdf(a,1));
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
(async function initApp(){await Promise.all([refreshAuth(),refreshScore(false)]);render();})();
setInterval(()=>refreshScore(true),30000);

async function downloadRecognitionPng(advisor,rank=1){
  const meta=awardMeta(rank);
  const dataUrl=(await buildRecognitionCanvas(advisor,rank)).toDataURL('image/png');
  const link=document.createElement('a');
  const safeName=advisor.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  link.href=dataUrl;link.download=`${meta.slug}-reconocimiento-${safeName}-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}.png`;document.body.appendChild(link);link.click();link.remove();
}

async function downloadCertificatePdf(advisor,rank=1){
  const meta=awardMeta(rank);
  const canvas=await buildDiplomaCanvas(advisor,rank);
  const pdfBlob=canvasToPdfBlob(canvas);
  const link=document.createElement('a');
  const safeName=advisor.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  link.href=URL.createObjectURL(pdfBlob);link.download=`${meta.slug}-certificado-${safeName}-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}.pdf`;document.body.appendChild(link);link.click();setTimeout(()=>URL.revokeObjectURL(link.href),2000);link.remove();
}

async function buildRecognitionPng(advisor,rank=1){
  return (await buildRecognitionCanvas(advisor,rank)).toDataURL('image/png');
}

async function buildDiplomaPng(advisor,rank=1){
  return (await buildDiplomaCanvas(advisor,rank)).toDataURL('image/png');
}

async function buildRecognitionCanvas(advisor,rank=1){
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const meta=awardMeta(rank);
  const gold='#cba164',goldSoft='#ecd8b3',navy='#08111f',navy2='#121f36',cream='#f6f0e5',white='#ffffff';

  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#03070f'); bg.addColorStop(0.5,'#0a1020'); bg.addColorStop(1,'#131f31');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  drawGlow(ctx,260,760,420,'rgba(203,161,100,0.12)');
  drawGlow(ctx,1120,260,320,'rgba(203,161,100,0.12)');

  // dotted pattern right and left bottom
  ctx.fillStyle='rgba(236,216,179,0.18)';
  for(let x=1260;x<1540;x+=18){ for(let y=36;y<330;y+=18){ ctx.beginPath(); ctx.arc(x,y,2.2,0,Math.PI*2); ctx.fill(); } }
  for(let x=26;x<270;x+=18){ for(let y=540;y<855;y+=18){ ctx.beginPath(); ctx.arc(x,y,2.2,0,Math.PI*2); ctx.fill(); } }

  const watermark=await loadImageSafe(ASSETS.logoSeal);
  if(watermark){ctx.save();ctx.globalAlpha=.18;ctx.drawImage(watermark,420,120,720,720);ctx.restore();}

  const logo=await loadImageSafe(ASSETS.logoHorizontal);
  if(logo){const w=250,h=logo.height*(w/logo.width);ctx.drawImage(logo,W/2-w/2,50,w,h);}

  await drawAdvisorHeroImage(ctx,advisor,560,96,480,520,30);

  // name band
  const band=ctx.createLinearGradient(240,0,1320,0);
  band.addColorStop(0,'rgba(203,161,100,0.18)');
  band.addColorStop(.5,'rgba(247,240,229,0.88)');
  band.addColorStop(1,'rgba(203,161,100,0.18)');
  roundRect(ctx,240,520,1120,118,18,band,null);

  ctx.textAlign='center';
  const nameSize=fitTextWidth(ctx,advisor.name,1040,86,46,'700');
  ctx.fillStyle='#16161b'; ctx.font=`700 ${nameSize}px "Guaruja Neue", Arial, sans-serif`; ctx.fillText(advisor.name,W/2,598);

  ctx.fillStyle=gold; ctx.font='700 86px "Guaruja Neue", Arial, sans-serif'; ctx.fillText(meta.title,W/2,720);
  ctx.fillStyle=white; ctx.font='500 46px "Guaruja Neue", Arial, sans-serif'; ctx.fillText(meta.subtitle,W/2,786);
  ctx.fillStyle=goldSoft; ctx.font='600 22px "Guaruja Neue", Arial, sans-serif'; ctx.fillText(monthUpper,W/2,842);

  if(logo){const w=130,h=logo.height*(w/logo.width);ctx.save();ctx.globalAlpha=.8;ctx.drawImage(logo,W/2-w/2,855-40,w,h);ctx.restore();}
  return canvas;
}

async function buildDiplomaCanvas(advisor,rank=1){
  const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1125;const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const meta=awardMeta(rank);
  const gold='#c39a58',goldSoft='#ecd8b3',navy='#08111f',navy2='#13223a',white='#ffffff';

  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#040910'); bg.addColorStop(0.52,'#0b1324'); bg.addColorStop(1,'#142239');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  roundRect(ctx,34,34,W-68,H-68,28,null,'rgba(236,216,179,0.45)');
  roundRect(ctx,58,58,W-116,H-116,24,null,'rgba(195,154,88,0.75)');
  drawGlow(ctx,300,870,470,'rgba(203,161,100,0.10)');
  drawGlow(ctx,1510,270,340,'rgba(203,161,100,0.10)');

  // dotted pattern
  ctx.fillStyle='rgba(236,216,179,0.16)';
  for(let x=1600;x<1940;x+=18){ for(let y=36;y<370;y+=18){ ctx.beginPath(); ctx.arc(x,y,2.4,0,Math.PI*2); ctx.fill(); } }
  for(let x=44;x<320;x+=18){ for(let y=660;y<1060;y+=18){ ctx.beginPath(); ctx.arc(x,y,2.4,0,Math.PI*2); ctx.fill(); } }

  const bigMark=await loadImageSafe(ASSETS.logoSeal);
  if(bigMark){ctx.save();ctx.globalAlpha=.16;ctx.drawImage(bigMark,475,90,880,880);ctx.restore();}

  const logo=await loadImageSafe(ASSETS.logoHorizontal);
  if(logo){const w=280,h=logo.height*(w/logo.width);ctx.drawImage(logo,860,80,w,h);}

  await drawAdvisorHeroImage(ctx,advisor,250,190,620,700,38);

  // name band and copy block
  const band=ctx.createLinearGradient(0,0,0,0);
  band.addColorStop(0,'rgba(203,161,100,0.18)');
  band.addColorStop(.5,'rgba(247,240,229,0.90)');
  band.addColorStop(1,'rgba(203,161,100,0.18)');
  roundRect(ctx,760,360,1080,132,18,band,null);
  const nameSize=fitTextWidth(ctx,advisor.name,980,92,50,'700');
  ctx.textAlign='center';
  ctx.fillStyle='#16161b'; ctx.font=`700 ${nameSize}px "Guaruja Neue", Arial, sans-serif`; ctx.fillText(advisor.name,1300,446);

  ctx.fillStyle=gold; ctx.font='700 92px "Guaruja Neue", Arial, sans-serif'; ctx.fillText(meta.title,1300,620);
  ctx.fillStyle=white; ctx.font='500 46px "Guaruja Neue", Arial, sans-serif'; ctx.fillText(meta.subtitle,1300,690);
  ctx.fillStyle=goldSoft; ctx.font='600 26px "Guaruja Neue", Arial, sans-serif'; ctx.fillText(monthUpper,1300,746);

  ctx.fillStyle='rgba(236,216,179,0.12)';
  roundRect(ctx,860,792,880,154,24,'rgba(255,255,255,0.04)','rgba(236,216,179,0.18)');
  ctx.fillStyle=white; ctx.font='500 40px "Guaruja Neue", Arial, sans-serif';
  drawWrappedCentered(ctx,'Tu constancia, liderazgo y dedicación inspiran resultados extraordinarios.',1300,855,760,48,2);

  if(logo){const w=150,h=logo.height*(w/logo.width);ctx.save();ctx.globalAlpha=.85;ctx.drawImage(logo,1300-w/2,988,w,h);ctx.restore();}
  return canvas;
}

function canvasToPdfBlob(canvas){
  const jpegDataUrl=canvas.toDataURL('image/jpeg',0.95);
  const base64=jpegDataUrl.split(',')[1];
  const binary=atob(base64);
  const imgLen=binary.length;
  const isLandscape=canvas.width>canvas.height;
  const pageW=isLandscape?841.89:595.28,pageH=isLandscape?595.28:841.89,margin=24;
  const imgW=canvas.width,imgH=canvas.height;
  const scale=Math.min((pageW-margin*2)/imgW,(pageH-margin*2)/imgH);
  const drawW=imgW*scale, drawH=imgH*scale, x=(pageW-drawW)/2, y=(pageH-drawH)/2;
  const content=`q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ`;

  const header='%PDF-1.4\n%ÿÿÿÿ\n';
  const obj1='1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2='2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3=`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
  const obj4head=`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLen} >>\nstream\n`;
  const obj4tail='\nendstream\nendobj\n';
  const obj5=`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`;

  const parts=[]; const offsets=[0]; let length=0;
  function pushString(str){const bytes=new TextEncoder().encode(str); parts.push(bytes); length+=bytes.length; return bytes.length;}
  function pushBinaryString(bin){const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); parts.push(bytes); length+=bytes.length; return bytes.length;}
  pushString(header);
  offsets.push(length); pushString(obj1);
  offsets.push(length); pushString(obj2);
  offsets.push(length); pushString(obj3);
  offsets.push(length); pushString(obj4head); pushBinaryString(binary); pushString(obj4tail);
  offsets.push(length); pushString(obj5);
  const xrefOffset=length;
  let xref=`xref\n0 6\n0000000000 65535 f \n`;
  for(let i=1;i<=5;i++) xref += `${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  const trailer=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  pushString(xref); pushString(trailer);
  return new Blob(parts,{type:'application/pdf'});
}
async function drawAdvisorImage(ctx,advisor,x,y,r,borderColor){
  if(advisor.photoUrl){const photo=await loadImageSafe(advisor.photoUrl);if(photo){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.closePath();ctx.clip();drawCoverImage(ctx,photo,x-r,y-r,r*2,r*2);ctx.restore();ctx.lineWidth=8;ctx.strokeStyle=borderColor;ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.stroke();return;}}
  drawInitialsAvatar(ctx,advisor.name,x,y,r);ctx.lineWidth=8;ctx.strokeStyle=borderColor;ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.stroke();
}

async function drawAdvisorHeroImage(ctx,advisor,x,y,w,h,radius=30){
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=32; ctx.shadowOffsetY=14;
  roundRect(ctx,x,y,w,h,radius,'rgba(255,255,255,0.04)',null);
  ctx.restore();
  if(advisor.photoUrl){
    const photo=await loadImageSafe(advisor.photoUrl);
    if(photo){
      ctx.save();
      ctx.beginPath();
      roundedRectPath(ctx,x,y,w,h,radius);
      ctx.clip();
      drawCoverImage(ctx,photo,x,y,w,h);
      ctx.restore();
      ctx.strokeStyle='rgba(236,216,179,0.55)'; ctx.lineWidth=2.5;
      roundedRectPath(ctx,x,y,w,h,radius); ctx.stroke();
      return;
    }
  }
  const g=ctx.createLinearGradient(x,y,x+w,y+h); g.addColorStop(0,'#e5e8ec'); g.addColorStop(1,'#cfd4db');
  roundRect(ctx,x,y,w,h,radius,g,'rgba(236,216,179,0.55)');
  ctx.fillStyle=COLORS.navy; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='700 130px "Guaruja Neue", Arial, sans-serif'; ctx.fillText(initials(advisor.name),x+w/2,y+h/2+10);
  ctx.textBaseline='alphabetic';
}

function fitTextWidth(ctx,text,maxWidth,startSize,minSize,weight='700'){let size=startSize;while(size>minSize){ctx.font=`${weight} ${size}px "Guaruja Neue", Arial, sans-serif`;if(ctx.measureText(text).width<=maxWidth)break;size-=2}return size}
function getWrappedLines(ctx,text,maxWidth,maxLines=Infinity){const words=String(text).trim().split(/\s+/),lines=[];let line='';words.forEach(word=>{const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test});if(line)lines.push(line);if(lines.length<=maxLines)return lines;const trimmed=lines.slice(0,maxLines);let last=trimmed[maxLines-1];while(last.length && ctx.measureText(`${last}…`).width>maxWidth){last=last.slice(0,-1).trim()}trimmed[maxLines-1]=`${last}…`;return trimmed}
function drawWrappedCentered(ctx,text,centerX,startY,maxWidth,lineHeight,maxLines=Infinity){const lines=getWrappedLines(ctx,text,maxWidth,maxLines);lines.forEach((l,i)=>ctx.fillText(l,centerX,startY+i*lineHeight));return lines.length*lineHeight}
function drawWrappedAligned(ctx,text,x,startY,maxWidth,lineHeight,maxLines=Infinity,align='left'){const prev=ctx.textAlign;ctx.textAlign=align;const lines=getWrappedLines(ctx,text,maxWidth,maxLines);lines.forEach((l,i)=>ctx.fillText(l,x,startY+i*lineHeight));ctx.textAlign=prev;return lines.length*lineHeight}
function roundedRectPath(ctx,x,y,w,h,r){const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();}
function roundRect(ctx,x,y,w,h,r,fill,stroke){roundedRectPath(ctx,x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function drawGlow(ctx,x,y,radius,color){const g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,color);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill()}
function drawInitialsAvatar(ctx,name,x,y,r){ctx.save();ctx.fillStyle='#dde1e5';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle=COLORS.navy;ctx.font='700 54px "Guaruja Neue", Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials(name),x,y+4);ctx.restore();ctx.textBaseline='alphabetic'}
function drawCoverImage(ctx,img,x,y,w,h){const scale=Math.max(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
function wrapText(ctx,text,centerX,startY,maxWidth,lineHeight){drawWrappedCentered(ctx,text,centerX,startY,maxWidth,lineHeight,99)}
function loadImageSafe(src){return new Promise(resolve=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src})}
