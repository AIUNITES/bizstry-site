/**
 * AIUNITES SSO — Shared Single Sign-On for the AIUNITES Network
 * Drop this script into any AIUNITES site. Because all sites live on
 * aiunites.github.io, they share localStorage automatically.
 *
 * Features:
 *   - Auth bar below the webring bar with sign-in / profile controls
 *   - Lightweight modal login (name + email, demo-grade)
 *   - Cross-site "Signing you in…" animation on arrival
 *   - Logout everywhere with one click
 *   - Slide-in account panel (click name to open)
 */

(function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────── */
  const SSO_KEY    = 'aiunites_sso_user';
  const VISIT_KEY  = 'aiunites_sso_last_login_site';
  const SITES_KEY  = 'aiunites_sso_sites_visited';
  const CURRENT_SITE = document.title.split(' - ')[0].split(' | ')[0].trim();

  /* ── helpers ───────────────────────────────────────────────── */
  function getUser () {
    try { return JSON.parse(localStorage.getItem(SSO_KEY)); }
    catch { return null; }
  }
  function setUser (u) { localStorage.setItem(SSO_KEY, JSON.stringify(u)); }
  function clearUser () {
    localStorage.removeItem(SSO_KEY);
    localStorage.removeItem(VISIT_KEY);
    localStorage.removeItem(SITES_KEY);
  }
  function trackSiteVisit () {
    try {
      const visited = JSON.parse(localStorage.getItem(SITES_KEY) || '[]');
      if (!visited.includes(CURRENT_SITE)) {
        visited.push(CURRENT_SITE);
        localStorage.setItem(SITES_KEY, JSON.stringify(visited));
      }
      return visited;
    } catch { return [CURRENT_SITE]; }
  }
  function getVisitedSites () {
    try { return JSON.parse(localStorage.getItem(SITES_KEY) || '[]'); }
    catch { return []; }
  }
  function formatDate (ts) {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ── inject CSS ────────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
/* ---- SSO Auth Bar ---- */
.aiunites-auth-bar{position:fixed;top:36px;left:0;right:0;z-index:9999;
  background:linear-gradient(90deg,#0d1117,#161b22);border-bottom:1px solid rgba(99,102,241,.18);
  padding:6px 0;font-size:12px;font-family:'Inter',system-ui,sans-serif;transition:all .3s}
.aiunites-auth-inner{max-width:1400px;margin:0 auto;padding:0 20px;
  display:flex;align-items:center;justify-content:space-between}
.aiunites-auth-left{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.55)}
.aiunites-auth-left svg{width:14px;height:14px;opacity:.5}
.aiunites-auth-right{display:flex;align-items:center;gap:10px}

.sso-btn{background:rgba(99,102,241,.15);color:#a5b4fc;border:1px solid rgba(99,102,241,.3);
  border-radius:6px;padding:4px 12px;font-size:11px;cursor:pointer;transition:all .2s;font-family:inherit}
.sso-btn:hover{background:rgba(99,102,241,.3);color:#c7d2fe}
.sso-btn-primary{background:rgba(99,102,241,.8);color:#fff;border-color:transparent}
.sso-btn-primary:hover{background:rgba(99,102,241,1)}

.sso-user-badge{display:flex;align-items:center;gap:6px;color:#a5b4fc;font-size:11px;font-weight:500;
  cursor:pointer;padding:3px 8px;border-radius:6px;transition:background .2s}
.sso-user-badge:hover{background:rgba(99,102,241,.2)}
.sso-avatar{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);
  display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;
  flex-shrink:0}
.sso-site-list{color:rgba(255,255,255,.35);font-size:10px}

/* ---- SSO Toast ---- */
.sso-toast{position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-20px);
  background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:10px 24px;
  border-radius:10px;font-size:13px;font-weight:500;z-index:99999;opacity:0;
  transition:all .4s ease;pointer-events:none;box-shadow:0 8px 32px rgba(99,102,241,.4);
  font-family:'Inter',system-ui,sans-serif}
.sso-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* ---- SSO Login Modal ---- */
.sso-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99998;
  display:flex;align-items:center;justify-content:center;opacity:0;
  transition:opacity .3s;pointer-events:none;font-family:'Inter',system-ui,sans-serif}
.sso-overlay.open{opacity:1;pointer-events:auto}
.sso-modal{background:#1a1a2e;border:1px solid rgba(99,102,241,.3);border-radius:16px;
  padding:32px;width:380px;max-width:90vw;transform:scale(.9);transition:transform .3s}
.sso-overlay.open .sso-modal{transform:scale(1)}
.sso-modal h2{color:#fff;margin:0 0 4px;font-size:20px;font-weight:700}
.sso-modal p{color:rgba(255,255,255,.5);margin:0 0 20px;font-size:13px}
.sso-modal label{display:block;color:rgba(255,255,255,.7);font-size:12px;margin-bottom:4px;font-weight:500}
.sso-modal input{width:100%;padding:10px 12px;background:#0d1117;border:1px solid rgba(99,102,241,.25);
  border-radius:8px;color:#fff;font-size:14px;margin-bottom:14px;outline:none;
  transition:border-color .2s;box-sizing:border-box;font-family:inherit}
.sso-modal input:focus{border-color:#6366f1}
.sso-modal .sso-submit{width:100%;padding:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;
  transition:opacity .2s;font-family:inherit}
.sso-modal .sso-submit:hover{opacity:.9}
.sso-modal .sso-close{position:absolute;top:12px;right:16px;background:none;border:none;
  color:rgba(255,255,255,.4);font-size:20px;cursor:pointer}
.sso-modal .sso-network{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
.sso-modal .sso-network span{background:rgba(99,102,241,.1);color:rgba(255,255,255,.5);
  padding:2px 8px;border-radius:4px;font-size:10px}

/* ---- SSO Account Panel ---- */
.sso-panel-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99996;
  opacity:0;pointer-events:none;transition:opacity .3s}
.sso-panel-backdrop.open{opacity:1;pointer-events:auto}

.sso-panel{position:fixed;top:0;right:0;width:320px;max-width:90vw;height:100vh;
  background:#0d1117;border-left:1px solid rgba(99,102,241,.25);z-index:99997;
  display:flex;flex-direction:column;transform:translateX(100%);
  transition:transform .35s cubic-bezier(.4,0,.2,1);
  font-family:'Inter',system-ui,sans-serif;overflow:hidden}
.sso-panel.open{transform:translateX(0)}

.sso-panel-header{padding:20px;border-bottom:1px solid rgba(255,255,255,.08);
  display:flex;align-items:center;justify-content:space-between}
.sso-panel-header h3{color:#fff;font-size:14px;font-weight:600;margin:0}
.sso-panel-close{background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;
  cursor:pointer;line-height:1;padding:0;transition:color .2s}
.sso-panel-close:hover{color:#fff}

.sso-panel-body{flex:1;overflow-y:auto;padding:24px 20px}

/* Avatar section */
.sso-panel-avatar-section{text-align:center;margin-bottom:28px}
.sso-panel-avatar-lg{width:72px;height:72px;border-radius:50%;
  background:linear-gradient(135deg,#6366f1,#a855f7);
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:26px;font-weight:700;margin:0 auto 14px}
.sso-panel-name{color:#fff;font-size:18px;font-weight:600;margin-bottom:4px}
.sso-panel-email{color:rgba(255,255,255,.45);font-size:13px}
.sso-panel-member-since{color:rgba(255,255,255,.3);font-size:11px;margin-top:6px}

/* Edit profile */
.sso-panel-section{margin-bottom:24px}
.sso-panel-section-label{color:rgba(255,255,255,.35);font-size:10px;font-weight:600;
  text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
.sso-panel-field{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  border-radius:10px;padding:12px 14px;margin-bottom:8px}
.sso-panel-field label{display:block;color:rgba(255,255,255,.4);font-size:10px;
  font-weight:500;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
.sso-panel-field input{background:none;border:none;outline:none;color:#fff;
  font-size:14px;width:100%;font-family:inherit}
.sso-panel-field input::placeholder{color:rgba(255,255,255,.2)}
.sso-panel-save{width:100%;padding:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
  transition:opacity .2s;font-family:inherit;margin-top:4px}
.sso-panel-save:hover{opacity:.85}
.sso-panel-saved{color:#10b981;font-size:12px;text-align:center;margin-top:6px;
  height:16px;transition:opacity .3s}

/* Sites visited */
.sso-panel-sites{display:flex;flex-wrap:wrap;gap:6px}
.sso-panel-site-tag{background:rgba(99,102,241,.12);color:#a5b4fc;
  border:1px solid rgba(99,102,241,.2);border-radius:6px;padding:3px 9px;font-size:11px}
.sso-panel-site-tag.current{background:rgba(99,102,241,.25);border-color:rgba(99,102,241,.5)}

/* Network status */
.sso-panel-network-status{display:flex;align-items:center;gap:8px;
  background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);
  border-radius:8px;padding:10px 12px}
.sso-panel-dot{width:7px;height:7px;border-radius:50%;background:#10b981;
  box-shadow:0 0 6px #10b981;flex-shrink:0}
.sso-panel-network-text{color:rgba(255,255,255,.6);font-size:12px}

/* Footer */
.sso-panel-footer{padding:16px 20px;border-top:1px solid rgba(255,255,255,.06)}
.sso-panel-signout{width:100%;padding:10px;background:rgba(239,68,68,.1);
  color:#f87171;border:1px solid rgba(239,68,68,.25);border-radius:8px;
  font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.sso-panel-signout:hover{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.5)}

/* body offset for the auth bar */
body{padding-top:68px!important}
.nav{top:68px!important}
  `;
  document.body.appendChild(css);

  /* ── auth bar ──────────────────────────────────────────────── */
  const bar = document.createElement('div');
  bar.className = 'aiunites-auth-bar';
  bar.innerHTML = `<div class="aiunites-auth-inner">
    <div class="aiunites-auth-left">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      <span class="sso-status">AIUNITES Single Sign-On</span>
    </div>
    <div class="aiunites-auth-right"></div>
  </div>`;
  document.body.prepend(bar);

  const rightSlot = bar.querySelector('.aiunites-auth-right');
  const statusEl  = bar.querySelector('.sso-status');

  /* ── toast ─────────────────────────────────────────────────── */
  const toast = document.createElement('div');
  toast.className = 'sso-toast';
  document.body.appendChild(toast);

  function showToast (msg, duration) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration || 2500);
  }

  /* ── login modal ────────────────────────────────────────────── */
  const overlay = document.createElement('div');
  overlay.className = 'sso-overlay';
  overlay.innerHTML = `
    <div class="sso-modal" style="position:relative">
      <button class="sso-close">&times;</button>
      <h2>Sign in to AIUNITES</h2>
      <p>One account across the entire network</p>
      <div class="sso-network">
        <span>BizStry</span><span>AI YHWH</span><span>UptownIT</span>
        <span>+ 14 more sites</span>
      </div>
      <form id="sso-login-form">
        <label>Display Name</label>
        <input type="text" id="sso-name" placeholder="e.g. Tom" required>
        <label>Email</label>
        <input type="email" id="sso-email" placeholder="you@example.com" required>
        <button type="submit" class="sso-submit">Sign In →</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('.sso-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  overlay.querySelector('#sso-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const name  = document.getElementById('sso-name').value.trim();
    const email = document.getElementById('sso-email').value.trim();
    if (!name || !email) return;

    const user = {
      name, email,
      initials: name.slice(0, 2).toUpperCase(),
      loginSite: CURRENT_SITE,
      loginTime: Date.now()
    };
    setUser(user);
    localStorage.setItem(VISIT_KEY, CURRENT_SITE);
    trackSiteVisit();
    overlay.classList.remove('open');
    renderLoggedIn(user);
    showToast('Welcome to AIUNITES! You\'re signed in across the network.');
  });

  /* ── account panel ──────────────────────────────────────────── */
  const backdrop = document.createElement('div');
  backdrop.className = 'sso-panel-backdrop';
  document.body.appendChild(backdrop);

  const panel = document.createElement('div');
  panel.className = 'sso-panel';
  document.body.appendChild(panel);

  function openPanel (user) {
    const visited = getVisitedSites();
    const siteTags = visited.length
      ? visited.map(s => `<span class="sso-panel-site-tag${s === CURRENT_SITE ? ' current' : ''}">${s}</span>`).join('')
      : `<span class="sso-panel-site-tag current">${CURRENT_SITE}</span>`;

    panel.innerHTML = `
      <div class="sso-panel-header">
        <h3>My Account</h3>
        <button class="sso-panel-close">&times;</button>
      </div>
      <div class="sso-panel-body">

        <div class="sso-panel-avatar-section">
          <div class="sso-panel-avatar-lg">${user.initials}</div>
          <div class="sso-panel-name">${user.name}</div>
          <div class="sso-panel-email">${user.email}</div>
          <div class="sso-panel-member-since">Member since ${formatDate(user.loginTime)}</div>
        </div>

        <div class="sso-panel-section">
          <div class="sso-panel-section-label">Edit Profile</div>
          <div class="sso-panel-field">
            <label>Display Name</label>
            <input type="text" id="sso-panel-name-input" value="${user.name}" placeholder="Your name">
          </div>
          <div class="sso-panel-field">
            <label>Email</label>
            <input type="email" id="sso-panel-email-input" value="${user.email}" placeholder="your@email.com">
          </div>
          <button class="sso-panel-save" id="sso-panel-save-btn">Save Changes</button>
          <div class="sso-panel-saved" id="sso-panel-saved-msg"></div>
        </div>

        <div class="sso-panel-section">
          <div class="sso-panel-section-label">Sites Visited</div>
          <div class="sso-panel-sites">${siteTags}</div>
        </div>

        <div class="sso-panel-section">
          <div class="sso-panel-section-label">Network Status</div>
          <div class="sso-panel-network-status">
            <div class="sso-panel-dot"></div>
            <span class="sso-panel-network-text">Signed in across AIUNITES network</span>
          </div>
        </div>

      </div>
      <div class="sso-panel-footer">
        <button class="sso-panel-signout" id="sso-panel-signout-btn">Sign Out of All Sites</button>
      </div>`;

    panel.querySelector('.sso-panel-close').addEventListener('click', closePanel);

    panel.querySelector('#sso-panel-save-btn').addEventListener('click', function () {
      const newName  = document.getElementById('sso-panel-name-input').value.trim();
      const newEmail = document.getElementById('sso-panel-email-input').value.trim();
      if (!newName || !newEmail) return;
      const updated = { ...user, name: newName, email: newEmail, initials: newName.slice(0, 2).toUpperCase() };
      setUser(updated);
      // Refresh avatar and name display
      panel.querySelector('.sso-panel-avatar-lg').textContent = updated.initials;
      panel.querySelector('.sso-panel-name').textContent = updated.name;
      panel.querySelector('.sso-panel-email').textContent = updated.email;
      renderLoggedIn(updated);
      const msg = document.getElementById('sso-panel-saved-msg');
      msg.textContent = '✓ Saved!';
      setTimeout(() => { msg.textContent = ''; }, 2000);
    });

    panel.querySelector('#sso-panel-signout-btn').addEventListener('click', function () {
      clearUser();
      closePanel();
      renderLoggedOut();
      showToast('Signed out from all AIUNITES sites');
    });

    backdrop.classList.add('open');
    panel.classList.add('open');
  }

  function closePanel () {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
  }

  backdrop.addEventListener('click', closePanel);

  /* ── render states ──────────────────────────────────────────── */
  function renderLoggedOut () {
    statusEl.textContent = 'AIUNITES Single Sign-On';
    rightSlot.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'sso-btn sso-btn-primary';
    btn.textContent = 'Sign In';
    btn.addEventListener('click', () => overlay.classList.add('open'));
    rightSlot.appendChild(btn);
  }

  function renderLoggedIn (user) {
    statusEl.textContent = 'Signed in across AIUNITES network';
    rightSlot.innerHTML = '';

    const badge = document.createElement('span');
    badge.className = 'sso-user-badge';
    badge.title = 'Open account panel';
    badge.innerHTML = `<span class="sso-avatar">${user.initials}</span>${user.name} ▾`;
    badge.addEventListener('click', () => openPanel(user));
    rightSlot.appendChild(badge);

    const signoutBtn = document.createElement('button');
    signoutBtn.className = 'sso-btn';
    signoutBtn.textContent = 'Sign Out';
    signoutBtn.addEventListener('click', () => {
      clearUser();
      renderLoggedOut();
      showToast('Signed out from all AIUNITES sites');
    });
    rightSlot.appendChild(signoutBtn);
  }

  /* ── init ───────────────────────────────────────────────────── */
  const user = getUser();
  if (user) {
    const lastSite = localStorage.getItem(VISIT_KEY);
    if (lastSite && lastSite !== CURRENT_SITE) {
      showToast('✓ Signed in via AIUNITES SSO — welcome to ' + CURRENT_SITE + '!', 3000);
    }
    localStorage.setItem(VISIT_KEY, CURRENT_SITE);
    trackSiteVisit();
    renderLoggedIn(user);
  } else {
    renderLoggedOut();
  }

})();
