// 👉 apni project info भरो
const SUPABASE_URL = "https://sjfglhxjdyvcygunijvz.supabase.co"; // <-- change
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM";               // <-- change

if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR-PROJECT') ||
    !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('YOUR-ANON-KEY')) {
  console.error('Supabase keys missing. app.js me SUPABASE_URL/ANON KEY भरो.');
}

// Supabase client
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// helpful logs + auto-redirects
sb.auth.onAuthStateChange((event, session) => {
  console.log('[auth change]', event, session);
  const isDashboard = !!document.getElementById('guarded');
  const isLogin = !!document.getElementById('loginForm');
  if (isLogin && session) window.location.href = 'dashboard.html';
  if (isDashboard && !session) window.location.href = 'login.html';
});

window.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const loginMsg  = document.getElementById('loginMsg');

  // already logged-in? -> dashboard
  const { data: init } = await sb.auth.getSession();
  if (loginForm && init?.session) { window.location.href = 'dashboard.html'; return; }

  // LOGIN handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginMsg.className = 'msg';
      loginMsg.textContent = 'लॉगिन हो रहा है…';

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          const emsg = (error.message || '').toLowerCase();
          if (emsg.includes('invalid') || emsg.includes('credentials')) {
            loginMsg.className = 'msg err'; loginMsg.textContent = 'गलत ईमेल या पासवर्ड.'; return;
          }
          if (emsg.includes('email') && emsg.includes('not') && emsg.includes('confirmed')) {
            loginMsg.className = 'msg err';
            loginMsg.textContent = 'ईमेल कन्फर्म नहीं है—Auth > Email settings में confirm off करें या ईमेल verify कराएँ.'; 
            return;
          }
          loginMsg.className = 'msg err'; loginMsg.textContent = 'लॉगिन त्रुटि: ' + error.message; return;
        }
        if (data?.session) {
          loginMsg.className = 'msg ok'; loginMsg.textContent = 'सफल!';
          window.location.href = 'dashboard.html';
        } else {
          loginMsg.className = 'msg err';
          loginMsg.textContent = 'लॉगिन अधूरा—Email confirmation चालू है? उसे off करें या verify करें.';
        }
      } catch (e2) {
        loginMsg.className = 'msg err'; loginMsg.textContent = 'लॉगिन अपवाद: ' + String(e2);
      }
    });
  }

  // dashboard guard
  const guard = document.getElementById('guarded');
  if (guard) {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    document.getElementById('userEmail').textContent = session.user?.email || '';

    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
    document.getElementById('btnLogout').addEventListener('click', async () => {
      await sb.auth.signOut(); window.location.href='login.html';
    });
  }
});

function switchTab(id){
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tabpanel').forEach(x=>x.classList.remove('show'));
  document.querySelector(`.tab[data-tab="${id}"]`).classList.add('active');
  document.getElementById(`tab-${id}`).classList.add('show');
}

// helpers
function onlyDigits(s=''){ return (s||'').replace(/\D+/g,''); }
function toE164(m){ const d=onlyDigits(m||''); if(d.startsWith('91')&&d.length===12) return '+'+d; if(d.length===10) return '+91'+d; if((m||'').startsWith('+')) return m; return '+91'+d; }
function fmtINR(n){ if(n===null||n===undefined||isNaN(n)) return '—'; return Number(n).toLocaleString('en-IN'); }

function downloadCsv(filename, rows){
  const csv = rows.map(r => r.map(v => '"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function toast(msg, kind='ok'){
  const el = document.getElementById('toast'); if(!el) return alert(msg);
  el.textContent = msg; el.style.background = kind==='err' ? '#dc2626' : (kind==='warn' ? '#d97706' : '#111827');
  el.classList.add('show'); setTimeout(()=> el.classList.remove('show'), 2000);
}
