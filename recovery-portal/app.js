// 👉 अपनी प्रोजेक्ट जानकारी भरें
const SUPABASE_URL = "https://sjfglhxjdyvcygunijvz.supabase.co"; // 🔁 बदलें
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM"; // 🔁 बदलें


// Supabase client
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
auth: { persistSession: true, autoRefreshToken: true }
});


// --- Login page logic ---
window.addEventListener('DOMContentLoaded', async () => {
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
if (loginForm) {
loginForm.addEventListener('submit', async (e) => {
e.preventDefault();
loginMsg.textContent = 'लॉगिन हो रहा है…';
const email = document.getElementById('email').value.trim();
const password = document.getElementById('password').value.trim();
const { data, error } = await sb.auth.signInWithPassword({ email, password });
if (error) { loginMsg.className='msg err'; loginMsg.textContent = 'लॉगिन त्रुटि: '+ error.message; return; }
loginMsg.className='msg ok'; loginMsg.textContent='सफल!';
window.location.href = 'dashboard.html';
});
}


// Guard dashboard
const guard = document.getElementById('guarded');
if (guard) {
const { data: { user } } = await sb.auth.getUser();
if (!user) { window.location.href = 'index.html'; return; }
document.getElementById('userEmail').textContent = user.email || '';


// tabs
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.getElementById('btnLogout').addEventListener('click', async () => { await sb.auth.signOut(); window.location.href='index.html'; });
}
});


function switchTab(id){
document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
document.querySelectorAll('.tabpanel').forEach(x=>x.classList.remove('show'));
document.querySelector(`.tab[data-tab="${id}"]`).classList.add('active');
document.getElementById(`tab-${id}`).classList.add('show');
}


// --- Helpers ---
function onlyDigits(s=''){ return (s||'').replace(/\D+/g,''); }
function toE164(m){ const d=onlyDigits(m||''); if(d.startsWith('91') && d.length===12) return '+'+d; if(d.length===10) return '+91'+d; if((m||'').startsWith('+')) return m; return '+91'+d; }
function fmtINR(n){ if(n===null||n===undefined||isNaN(n)) return '—'; return Number(n).toLocaleString('en-IN'); }


// CSV helpers
function downloadCsv(filename, rows){
const csv = rows.map(r => r.map(v => '"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
