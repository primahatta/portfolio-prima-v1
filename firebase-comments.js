// firebase-comments.js
// Paste file ini di folder yang sama dengan index.html

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// =============================================
// CONFIG FIREBASE LO
// =============================================
const firebaseConfig = {
  apiKey: "AIzaSyAByJEzL0Ji0Oozv5PSPRTo3ZZ1OsWLO3U",
  authDomain: "portfolio-prima-v1.firebaseapp.com",
  databaseURL: "https://portfolio-prima-v1-default-rtdb.firebaseio.com",
  projectId: "portfolio-prima-v1",
  storageBucket: "portfolio-prima-v1.firebasestorage.app",
  messagingSenderId: "409638400461",
  appId: "1:409638400461:web:ab6275338458d0f6889484",
  measurementId: "G-DNMG5QN150"
};
// =============================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const commentsRef = ref(db, 'comments');

// ── Ticker ────────────────────────────────────
function buildTicker(comments) {
  const inner = document.getElementById('tickerInner');
  if (!inner) return;

  if (!comments.length) {
    inner.innerHTML = `
      <span class="ticker-item">Be the first to leave a comment on this portfolio!</span>
      <span class="ticker-item">Be the first to leave a comment on this portfolio!</span>
    `;
    return;
  }

  const items = comments.map(c =>
    `<span class="ticker-item">
      <span class="ticker-name">${escHtml(c.name)}</span>
      <span class="ticker-sep">—</span>
      ${escHtml(c.msg.length > 70 ? c.msg.slice(0, 70) + '…' : c.msg)}
    </span>`
  ).join('');

  // Duplikat supaya loop mulus
  inner.innerHTML = items + items;
}

// ── Comment List ──────────────────────────────
function buildList(comments) {
  const list = document.getElementById('commentList');
  if (!list) return;

  if (!comments.length) {
    list.innerHTML = `<div class="comment-empty">No comments yet. Be the first! 👇</div>`;
    return;
  }

  list.innerHTML = comments.slice().reverse().map(c => {
    const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const date = new Date(c.ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <div class="comment-card">
        <div class="comment-avatar">${initials}</div>
        <div class="comment-body">
          <div class="comment-author">
            ${escHtml(c.name)}
            ${c.role ? `<span class="comment-role">· ${escHtml(c.role)}</span>` : ''}
          </div>
          <div class="comment-date">${date}</div>
          <div class="comment-text">${escHtml(c.msg)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Real-time listener ────────────────────────
const recentQuery = query(commentsRef, orderByChild('ts'), limitToLast(50));

onValue(recentQuery, (snapshot) => {
  const data = snapshot.val();
  const comments = data ? Object.values(data).sort((a, b) => a.ts - b.ts) : [];
  buildTicker(comments);
  buildList(comments);
});

// ── Submit ────────────────────────────────────
window.submitComment = async function () {
  const nameEl   = document.getElementById('commentName');
  const roleEl   = document.getElementById('commentRole');
  const msgEl    = document.getElementById('commentMsg');
  const statusEl = document.getElementById('commentStatus');
  const btn      = document.getElementById('submitBtn');

  const name = nameEl.value.trim();
  const role = roleEl.value.trim();
  const msg  = msgEl.value.trim();

  if (!name) { showStatus('⚠️ Please enter your name.', 'error'); return; }
  if (!msg)  { showStatus('⚠️ Please write something.', 'error'); return; }

  btn.disabled = true;
  showStatus('Posting...', 'info');

  try {
    await push(commentsRef, { name, role, msg, ts: Date.now() });
    nameEl.value = '';
    roleEl.value = '';
    msgEl.value  = '';
    updateCharCount();
    showStatus('✅ Comment posted! It\'s now live on the ticker.', 'success');
  } catch (err) {
    showStatus('❌ Failed to post. Check your connection.', 'error');
    console.error(err);
  }

  btn.disabled = false;
};

// ── Char counter ──────────────────────────────
function updateCharCount() {
  const msgEl   = document.getElementById('commentMsg');
  const countEl = document.getElementById('charCount');
  if (msgEl && countEl) {
    countEl.textContent = `${msgEl.value.length} / 200`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const msgEl = document.getElementById('commentMsg');
  if (msgEl) msgEl.addEventListener('input', updateCharCount);
});

// ── Helpers ───────────────────────────────────
function showStatus(msg, type) {
  const el = document.getElementById('commentStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = `comment-status comment-status--${type}`;
  if (type === 'success') setTimeout(() => { el.textContent = ''; el.className = 'comment-status'; }, 4000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}