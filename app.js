const demo = [
  { id:'1', name:'Marta Ongay', sales:11, previousPosition:2, photoUrl:null },
  { id:'2', name:'Andrea Torres', sales:9, previousPosition:1, photoUrl:null },
  { id:'3', name:'Carlos Medina', sales:8, previousPosition:4, photoUrl:null },
  { id:'4', name:'Fernanda López', sales:7, previousPosition:3, photoUrl:null },
  { id:'5', name:'Jorge Pech', sales:6, previousPosition:5, photoUrl:null },
  { id:'6', name:'Mariana Gómez', sales:5, previousPosition:7, photoUrl:null },
  { id:'7', name:'Luis Herrera', sales:4, previousPosition:6, photoUrl:null }
];

const ASSETS = {
  logoHorizontal: '/assets/logo-marnez-horizontal.png',
  logoStacked: '/assets/logo-marnez-stacked.png',
  logoSeal: '/assets/logo-marnez-seal.png'
};

const COLORS = {
  yellow: '#ffd939',
  light: '#e9e9e9',
  navy: '#1c2a35',
  charcoal: '#333333',
  cream: '#f7f1e7',
  creamStrong: '#f2ead9',
  line: '#d5d7da',
  textSoft: '#6f7680',
  white: '#ffffff'
};

const state = {
  data:{advisors:demo,updatedAt:new Date().toISOString(),sourceStatus:'demo'},
  admin:location.pathname.startsWith('/admin')
};

const root = document.getElementById('root');
const month = new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(new Date()).replace(/^./,s=>s.toUpperCase());
const monthUpper = month.toUpperCase();
const esc = (s='') => String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const initials = n => n.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const sorted = () => [...state.data.advisors].sort((a,b)=>b.sales-a.sales || a.name.localeCompare(b.name));
const avatar = (a, large=false) => a.photoUrl ? `<img class="avatar ${large?'avatar-large':''}" src="${esc(a.photoUrl)}" alt="${esc(a.name)}">` : `<div class="avatar avatar-fallback ${large?'avatar-large':''}">${initials(a.name)}</div>`;
const movement = (a,p) => !a.previousPosition ? '—' : a.previousPosition-p>0 ? `↑ ${a.previousPosition-p}` : a.previousPosition-p<0 ? `↓ ${Math.abs(a.previousPosition-p)}` : '—';
const movementClass = t => t.startsWith('↑')?'up':t.startsWith('↓')?'down':'muted';

function brand(mode='default'){
  return `<div class="brand brand-${mode}"><img src="${ASSETS.logoHorizontal}" alt="Marnez Desarrollos" class="brand-logo ${mode==='compact'?'compact':''}"></div>`;
}

function ranking(advisors){
  return `<section class="panel ranking-panel"><div class="panel-title"><div><p class="eyebrow plain">RANKING ACTUAL</p><h2>Sales Score</h2></div><span class="icon">🏆</span></div><div class="table-head"><span>#</span><span>Asesor</span><span>Movimiento</span><span>Ventas</span></div>${advisors.map((a,i)=>{const m=movement(a,i+1);return `<div class="rank-row ${i===0?'leader':''}"><span class="rank-number">${String(i+1).padStart(2,'0')}</span><div class="advisor-cell">${avatar(a)}<div><strong>${esc(a.name)}</strong>${i===0?'<small>TOP SELLER</small>':''}</div></div><span class="${movementClass(m)}">${m}</span><strong class="sales-number">${a.sales}</strong></div>`}).join('')}</section>`;
}

function podium(advisors){
  const order=[advisors[1],advisors[0],advisors[2]];
  const pos=[2,1,3];
  return `<div class="podium">${order.map((a,i)=>a?`<div class="podium-item p${pos[i]}"><div class="podium-rank">${pos[i]===1?'♛':'◉'}</div>${avatar(a,pos[i]===1)}<strong>${esc(a.name)}</strong><span>${a.sales} ventas</span><div class="podium-block">${pos[i]}</div></div>`:'').join('')}</div>`;
}

function publicView(){
  const a=sorted();
  const top=a[0];
  root.innerHTML=`<div class="site-shell">
    <header class="public-header">
      ${brand()}
      <div class="header-actions"><span class="live"><i></i> EN VIVO</span><button class="text-btn" data-admin>Administrador</button></div>
    </header>
    <main class="public-main">
      <div class="hero-copy">
        <p class="eyebrow plain">RANKING DE VENTAS · ${monthUpper}</p>
        <h1>Resultados que<br><span>se reconocen.</span></h1>
        <p>Score en vivo para visualizar el desempeño comercial, destacar al Top Seller del mes y compartir su reconocimiento en PNG.</p>
      </div>
      ${top?`<section class="top-card">
        <div class="top-watermark"><img src="${ASSETS.logoSeal}" alt=""></div>
        <div class="top-glow"></div>
        <div class="eyebrow">TOP SELLER · ${monthUpper}</div>
        <div class="top-content">
          ${avatar(top,true)}
          <div>
            <p class="muted">Reconocimiento del mes</p>
            <h1>${esc(top.name)}</h1>
            <p class="top-copy">Liderando el Sales Score con <strong>${top.sales} ventas</strong>.</p>
            <div class="cta-row">
              <button class="primary" data-celebrate>★ Mostrar reconocimiento</button>
              <button class="secondary secondary-dark" data-download-top>⬇ Descargar PNG</button>
            </div>
          </div>
          <div class="top-number"><span>01</span><small>POSICIÓN</small></div>
        </div>
      </section>`:''}
      <section class="panel podium-panel"><div class="panel-title"><div><p class="eyebrow plain">PODIO DEL MES</p><h2>Top 3</h2></div><span class="icon">🥇</span></div>${podium(a.slice(0,3))}</section>
      ${ranking(a)}
      <footer>Última actualización: ${new Date(state.data.updatedAt).toLocaleString('es-MX')} · MARNEZ Desarrollos</footer>
    </main>
  </div>`;
  wire();
}

function adminView(){
  const a=sorted();
  root.innerHTML=`<div class="admin-layout">
    <aside class="sidebar">
      ${brand('compact')}
      <nav>
        <button class="active">▦ Dashboard</button>
        <button>♙ Asesores</button>
        <button>🏆 Top Seller</button>
        <button>◷ Historial</button>
        <button>◈ Usuarios</button>
        <button>⚙ Configuración</button>
      </nav>
      <div class="sidebar-card">
        <p class="eyebrow">MARCA APLICADA</p>
        <p>Tipografías Guaruja Neue, paleta Marnez y exportación del reconocimiento a PNG.</p>
      </div>
      <button class="ghost" data-public>Ir a vista asesores →</button>
    </aside>
    <main class="admin-main">
      <header class="page-header"><div><p class="eyebrow plain">ADMINISTRACIÓN</p><h1>Dashboard de ventas</h1></div><span class="sync-pill"><span></span> ${state.data.sourceStatus==='synced'?'Sincronizado':state.data.sourceStatus==='warning'?'Con alerta':'Datos demo'}</span></header>
      <div class="kpis"><div class="kpi"><b>▥</b><span>Ventas registradas<strong>${a.reduce((s,x)=>s+x.sales,0)}</strong></span></div><div class="kpi"><b>♙</b><span>Asesores activos<strong>${a.length}</strong></span></div><div class="kpi"><b>♛</b><span>Top Seller<strong>${esc(a[0]?.name||'—')}</strong></span></div></div>
      <div class="admin-grid">${ranking(a)}
        <section class="panel settings-card">
          <p class="eyebrow plain">PERFILES</p>
          <h2>Fotos opcionales</h2>
          <p class="muted">Si no hay fotografía, el portal genera automáticamente un avatar con iniciales.</p>
          <button class="secondary">▧ Gestionar fotografías</button>
          <hr>
          <p class="eyebrow plain">RECONOCIMIENTO</p>
          <h2>Descarga del Top Seller</h2>
          <p class="muted">La tarjeta animada ahora puede descargarse como PNG para compartirla con el asesor o en redes internas.</p>
          <button class="secondary" data-download-top>⬇ Descargar reconocimiento PNG</button>
          <hr>
          <p class="eyebrow plain">SINCRONIZACIÓN</p>
          <h2>SharePoint</h2>
          <p class="muted">El portal consulta el Excel original compartido, detecta cambios y actualiza el ranking en D1. La sincronización automática corre cada minuto.</p>
          <button class="secondary" data-sync>↻ Sincronizar ahora</button>
          <pre id="syncResult"></pre>
        </section>
      </div>
    </main>
  </div>`;
  wire();
}

function celebration(){
  const a=sorted()[0];
  if(!a) return;
  const el=document.createElement('div');
  el.className='celebration';
  el.innerHTML=`
    <div class="confetti c1"></div><div class="confetti c2"></div><div class="confetti c3"></div><div class="confetti c4"></div>
    <div class="celebration-card" data-card-root>
      <div class="celebration-watermark"><img src="${ASSETS.logoSeal}" alt=""></div>
      <img src="${ASSETS.logoStacked}" alt="Marnez Desarrollos" class="celebration-logo">
      <p class="eyebrow plain">TOP SELLER · ${monthUpper}</p>
      ${avatar(a,true)}
      <h1>${esc(a.name)}</h1>
      <p>Reconocemos tu constancia, desempeño y resultados durante este mes.</p>
      <div class="recognition-score"><strong>${a.sales}</strong><span>VENTAS</span></div>
      <div class="modal-actions">
        <button class="primary" data-download-top>⬇ Descargar PNG</button>
        <button class="secondary" data-close>Cerrar reconocimiento</button>
      </div>
      <small>MARNEZ DESARROLLOS</small>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click',e=>{
    if(e.target===el || e.target.closest('[data-close]')) el.remove();
  });
  el.querySelector('[data-download-top]')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    await downloadRecognitionPng(a);
  });
}

async function validateSync(){
  const out=document.getElementById('syncResult');
  if(!out) return;
  out.textContent='Sincronizando…';
  try {
    const r=await fetch('/api/sync',{method:'POST'});
    const j=await r.json();
    if(!r.ok||!j.ok) throw new Error(j.error||'No se pudo sincronizar');
    out.textContent=j.changed
      ? `Actualizado\n${j.parsed?.advisors?.length||0} asesores\n${j.parsed?.usedRows||0} ventas procesadas`
      : 'Sin cambios en el Excel.';
    await refreshScore(true);
  } catch(e) {
    out.textContent=`Error: ${e.message}`;
  }
}

function setView(admin){
  state.admin=admin;
  history.pushState({},'',admin?'/admin':'/');
  render();
}

function wire(){
  document.querySelector('[data-admin]')?.addEventListener('click',()=>setView(true));
  document.querySelector('[data-public]')?.addEventListener('click',()=>setView(false));
  document.querySelector('[data-celebrate]')?.addEventListener('click',celebration);
  document.querySelector('[data-sync]')?.addEventListener('click',validateSync);
  document.querySelectorAll('[data-download-top]').forEach(btn=>btn.addEventListener('click', async ()=>{
    const leader=sorted()[0];
    if(leader) await downloadRecognitionPng(leader);
  }));
}

function render(){
  state.admin?adminView():publicView();
}

window.addEventListener('popstate',()=>{
  state.admin=location.pathname.startsWith('/admin');
  render();
});

let lastScoreSignature='';
async function refreshScore(forceRender=false){
  try{
    const r=await fetch('/api/score',{cache:'no-store'});
    if(!r.ok) throw new Error('No se pudo cargar el score');
    const d=await r.json();
    const sig=JSON.stringify({updatedAt:d.updatedAt,sourceStatus:d.sourceStatus,advisors:d.advisors});
    if(forceRender || sig!==lastScoreSignature){
      state.data=d;
      lastScoreSignature=sig;
      render();
    }
  }catch(e){
    if(!lastScoreSignature) render();
  }
}
refreshScore(true);
setInterval(()=>refreshScore(false),30000);

async function downloadRecognitionPng(advisor){
  const dataUrl = await buildRecognitionPng(advisor);
  const link=document.createElement('a');
  const safeName = advisor.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  link.href=dataUrl;
  link.download=`top-seller-${safeName}-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function buildRecognitionPng(advisor){
  const canvas=document.createElement('canvas');
  canvas.width=1080;
  canvas.height=1350;
  const ctx=canvas.getContext('2d');

  ctx.fillStyle = COLORS.light;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0, '#efefef');
  grad.addColorStop(1, '#e3e3e3');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  drawGlow(ctx, 880, 180, 250, 'rgba(255,217,57,0.16)');
  drawGlow(ctx, 220, 1180, 320, 'rgba(28,42,53,0.07)');

  const seal = await loadImageSafe(ASSETS.logoSeal);
  if (seal) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.drawImage(seal, 715, 915, 255, 255);
    ctx.restore();
  }

  roundRect(ctx, 104, 110, 872, 1120, 42, COLORS.white, 'rgba(28,42,53,0.08)');

  const logo = await loadImageSafe(ASSETS.logoHorizontal);
  if (logo) {
    const w = 320;
    const h = logo.height * (w / logo.width);
    ctx.drawImage(logo, 380, 152, w, h);
  }

  ctx.fillStyle = COLORS.navy;
  ctx.font = '700 26px "Guaruja Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`TOP SELLER · ${monthUpper}`, 540, 300);

  ctx.fillStyle = COLORS.textSoft;
  ctx.font = '500 20px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText('Reconocimiento mensual de desempeño comercial', 540, 338);

  const avatarX=540, avatarY=470, avatarR=92;
  if (advisor.photoUrl) {
    const photo = await loadImageSafe(advisor.photoUrl);
    if (photo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      drawCoverImage(ctx, photo, avatarX-avatarR, avatarY-avatarR, avatarR*2, avatarR*2);
      ctx.restore();
      ctx.lineWidth = 8;
      ctx.strokeStyle = COLORS.creamStrong;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR+4, 0, Math.PI*2);
      ctx.stroke();
    } else {
      drawInitialsAvatar(ctx, advisor.name, avatarX, avatarY, avatarR);
    }
  } else {
    drawInitialsAvatar(ctx, advisor.name, avatarX, avatarY, avatarR);
  }

  ctx.fillStyle = COLORS.charcoal;
  ctx.font = '700 66px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText(advisor.name, 540, 630);

  ctx.fillStyle = COLORS.textSoft;
  ctx.font = '500 30px "Guaruja Neue", Arial, sans-serif';
  wrapText(ctx, 'Reconocemos tu constancia, desempeño y resultados durante este mes.', 540, 690, 680, 40);

  ctx.fillStyle = COLORS.navy;
  ctx.font = '700 28px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText('SALES SCORE · MARNEZ DESARROLLOS', 540, 815);

  ctx.save();
  ctx.fillStyle = COLORS.navy;
  ctx.beginPath();
  ctx.arc(540, 925, 105, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLORS.white;
  ctx.font = '700 82px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText(String(advisor.sales), 540, 940);
  ctx.font = '700 24px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText('VENTAS', 540, 980);

  roundRect(ctx, 250, 1040, 580, 88, 44, COLORS.creamStrong);
  ctx.fillStyle = COLORS.charcoal;
  ctx.font = '700 32px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText('TOP SELLER DEL MES', 540, 1095);

  ctx.fillStyle = COLORS.navy;
  ctx.font = '700 20px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText('Reconocimiento oficial generado por MARNEZ Sales Score', 540, 1170);

  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(218, 1198, 644, 4);

  ctx.fillStyle = COLORS.textSoft;
  ctx.font = '500 18px "Guaruja Neue", Arial, sans-serif';
  ctx.fillText(`Emitido en ${month}`, 540, 1242);

  return canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  const radius = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function drawGlow(ctx, x, y, radius, color){
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2);
  ctx.fill();
}

function drawInitialsAvatar(ctx, name, x, y, r){
  ctx.save();
  ctx.fillStyle = '#dde1e5';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = COLORS.navy;
  ctx.font = '700 54px "Guaruja Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(name), x, y+4);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawCoverImage(ctx, img, x, y, w, h){
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function wrapText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, centerX, startY + i * lineHeight));
}

function loadImageSafe(src){
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
