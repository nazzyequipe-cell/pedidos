// scripts.js - comportamento cliente (localStorage protótipo) atualizado
(function(){
  const STORAGE_USERS = 'nazzy_users';
  const STORAGE_SESSION = 'nazzy_session';
  const STORAGE_ORDERS = 'nazzy_orders';
  const STORAGE_ADMINS = 'nazzy_admins';
  const STORAGE_NOTIFS = 'nazzy_notifications';
  const SETTINGS_KEY = 'site_settings';

  // utilities
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from((el||document).querySelectorAll(s));
  const load = (k, def) => JSON.parse(localStorage.getItem(k) || 'null') || def;
  const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));

  // apply site settings (background, logo, sidebarText)
  function applySiteSettings(){
    const settings = load(SETTINGS_KEY, {});
    if(settings.bg){
      // use inline style on body
      document.body.style.backgroundImage = `url('${settings.bg}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }
    if(settings.logo){
      // replace occurrences of text brand with logo image where appropriate
      $$('.brand').forEach(el=>{
        el.innerHTML = `<img src="${settings.logo}" alt="Logo" style="height:${(settings.logoSize||120)}px;object-fit:contain;vertical-align:middle">`;
      });
    }
    if(settings.sidebarText){
      // for visitor sidebars that use #sidebarLeft .sidebar-content, update text if present
      $$('.sidebar .sidebar-content').forEach(c=>{
        const t = c.querySelector('.sidebar-text-custom');
        if(t) t.textContent = settings.sidebarText;
        else {
          const p = document.createElement('div');
          p.className = 'sidebar-text-custom';
          p.style.marginTop = '8px';
          p.style.color = 'var(--muted)';
          p.textContent = settings.sidebarText;
          c.appendChild(p);
        }
      });
    }
  }

  // notification filter: only show notifs for current logged-in user or global (no 'to')
  function getUserNotifications(){
    const all = load(STORAGE_NOTIFS, []);
    const sess = load(STORAGE_SESSION, null);
    if(!sess) return all.filter(n => !n.to); // if not logged, only global
    return all.filter(n => !n.to || n.to === sess.phone);
  }

  // expose method used by admin panel to push notifications
  window.pushNotification = function(n){
    const arr = load(STORAGE_NOTIFS, []);
    arr.push(n);
    save(STORAGE_NOTIFS, arr);
  };

  // existing initialization (users, admins)
  if(!localStorage.getItem(STORAGE_ADMINS)){
    // keep placeholder admins if missing (should be created by admin panel)
    const defaults = [
      {id:'mica', name:'Mica', role:'Dona', avatar:'assets/admin-mica.jpg'},
      {id:'rav', name:'Rav', role:'Sub Líder', avatar:'assets/admin-rav.jpg'},
      {id:'maria', name:'Maria Costa', role:'', avatar:'assets/admin-maria.jpg'},
      {id:'joao', name:'João Oliveira', role:'', avatar:'assets/admin-joao.jpg'},
      {id:'lucia', name:'Lucia Ferreira', role:'', avatar:'assets/admin-lucia.jpg'},
      {id:'pedro', name:'Pedro Lima', role:'', avatar:'assets/admin-pedro.jpg'},
      {id:'sofia', name:'Sofia Rocha', role:'', avatar:'assets/admin-sofia.jpg'},
      {id:'bruno', name:'Bruno Alves', role:'', avatar:'assets/admin-bruno.jpg'}
    ];
    save(STORAGE_ADMINS, defaults);
  }

  // apply settings on load
  document.addEventListener('DOMContentLoaded', ()=>{
    applySiteSettings();
    renderNotifBadge();
  });

  // render notification badge on header (if exists)
  function renderNotifBadge(){
    const sess = load(STORAGE_SESSION, null);
    const unread = getUserNotifications().filter(n=>!n.read).length;
    const badge = $('#notifBadge');
    if(badge){
      if(unread>0){ badge.style.display='inline-block'; badge.textContent = unread; }
      else badge.style.display='none';
    }
  }

  // integrate with earlier scripts: open/close sidebars
  const sidebarLeft = $('#sidebarLeft');
  const sidebarRight = $('#sidebarRight');
  if(sidebarLeft){
    document.querySelectorAll('#menuBtn').forEach(b=>b.addEventListener('click', ()=> sidebarLeft.classList.toggle('open')));
  }
  if(sidebarRight){
    document.querySelectorAll('#notifyBtn').forEach(b=>b.addEventListener('click', ()=>{ sidebarRight.classList.toggle('open'); renderNotifications(); }));
  }

  // render notifications list in sidebarRight (filtered)
  function renderNotifications(){
    const listEl = $('#notificationsList');
    if(!listEl) return;
    const notifs = getUserNotifications();
    listEl.innerHTML = '';
    if(notifs.length===0){ listEl.innerHTML = '<li>Nenhuma notificação.</li>'; return; }
    notifs.forEach(n=>{
      const li = document.createElement('li');
      li.dataset.id = n.id;
      li.innerHTML = `<div><strong>${n.title}</strong><div style="font-size:13px;color:var(--muted)">${n.body}</div></div>`;
      const actions = document.createElement('div');
      actions.className = 'notif-actions';
      const open = document.createElement('button'); open.className='btn small outline'; open.textContent='Abrir';
      open.addEventListener('click', ()=> handleNotifClick(n));
      const del = document.createElement('button'); del.className='btn small outline'; del.textContent='Remover';
      del.addEventListener('click', ()=>{ removeNotification(n.id); renderNotifications(); renderNotifBadge(); });
      actions.appendChild(open); actions.appendChild(del);
      li.appendChild(actions);
      if(!n.read) li.style.background = 'linear-gradient(90deg, rgba(110,231,183,0.04), rgba(96,165,250,0.02))';
      listEl.appendChild(li);
    });
  }

  function removeNotification(id){
    const arr = load(STORAGE_NOTIFS, []);
    const rem = arr.filter(x=>x.id !== id);
    save(STORAGE_NOTIFS, rem);
  }

  function handleNotifClick(n){
    // mark read
    const arr = load(STORAGE_NOTIFS, []);
    const idx = arr.findIndex(x=>x.id===n.id);
    if(idx>=0){ arr[idx].read = true; save(STORAGE_NOTIFS, arr); }
    renderNotifBadge();

    if(n.type === 'pedido_aceito'){
      alert('Abrindo chat (simulado) com o administrador.');
      // redirect to nazzygram or chat area (not yet implemented client-side for users)
    } else if(n.type === 'pedido_recusado'){
      if(confirm('Deseja refazer o pedido agora?')) location.href = 'select-admin.html';
    } else if(n.type === 'pedido_entregue'){
      alert('Abrindo entregas (simulado).');
    } else {
      alert(n.title + '\n' + n.body);
    }
  }

  // expose renderNotifications to be called externally (admin panel)
  window.renderNotifications = renderNotifications;

  // Add listener to update badge when localStorage changes (other tabs)
  window.addEventListener('storage', e=>{
    if(e.key === STORAGE_NOTIFS || e.key === SETTINGS_KEY) { applySiteSettings(); renderNotifBadge(); }
  });

  // Keep existing features from the prototype: create account, login, profile avatar handling, orders etc.
  // Minimal integration: when creating account, ensure created timestamp
  const caForm = $('#createAccountForm');
  if(caForm){
    caForm.addEventListener('submit', e=>{
      e.preventDefault();
      const f = new FormData(caForm);
      const nickname = f.get('nickname').trim();
      const phone = f.get('phone').trim();
      const password = f.get('password');
      const users = load(STORAGE_USERS, []);
      if(users.find(u=>u.phone===phone)){
        $('#createMsg').textContent = 'Já existe uma conta com esse telefone.';
        return;
      }
      const user = {id: Math.random().toString(36).slice(2,9), nickname, phone, password, avatar:null, created: Date.now()};
      users.push(user);
      save(STORAGE_USERS, users);
      save(STORAGE_SESSION, {phone, nickname});
      $('#createMsg').textContent = 'Conta criada com sucesso! Faça login agora mesmo!';
      setTimeout(()=> location.href = 'main.html', 800);
    });
  }

  // login
  const loginForm = $('#loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', e=>{
      e.preventDefault();
      const f = new FormData(loginForm);
      const phone = f.get('phone').trim();
      const password = f.get('password');
      const users = load(STORAGE_USERS, []);
      const user = users.find(u=>u.phone===phone && u.password===password);
      if(!user){ $('#loginMsg').textContent = 'Telefone ou senha incorretos.'; return; }
      save(STORAGE_SESSION, {phone:user.phone, nickname:user.nickname});
      location.href = 'main.html';
    });
  }

  // minimal profile rendering in sidebar for logged pages
  function getSessionUser(){
    const s = load(STORAGE_SESSION, null);
    if(!s) return null;
    const users = load(STORAGE_USERS, []);
    return users.find(u => u.phone === s.phone) || null;
  }

  // update profile sidebar if present
  function renderProfileSidebar(){
    const user = getSessionUser();
    if(!user) return;
    const pa = $('#profileAvatar'); if(pa && user.avatar) pa.src = user.avatar;
    const pn = $('#profileNickname'); if(pn) pn.textContent = user.nickname || '—';
    const pp = $('#profilePhone'); if(pp) pp.textContent = user.phone || '—';
    const pw = $('#profilePassword'); if(pw) pw.textContent = user.password || '—';
  }
  renderProfileSidebar();

  // when orders are created, admin panel will generate notifications via window.pushNotification
  // ensure notif badge updated when page becomes visible
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) renderNotifBadge(); });

})();
