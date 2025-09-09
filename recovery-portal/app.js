// 👉 अपनी प्रोजेक्ट जानकारी भरें
const SUPABASE_URL = "https://sjfglhxjdyvcygunijvz.supabase.co"; // 🔁 बदलें
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM"; // 🔁 बदलें


// Supabase client
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
auth: { persistSession: true, autoRefreshToken: true }
});


// --- Login / Guard logic ---
window.addEventListener('DOMContentLoaded', async () => {
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
if (loginForm) {
loginForm.addEventListener('submit', async (e) => {
e.preventDefault();
loginMsg.textContent = 'लॉगिन हो रहा है…';
const email = document.getElementById('email').value.trim();
const password = document.getElementById('password').value.trim();
const { error } = await sb.auth.signInWithPassword({ email, password });
if (error) { loginMsg.className='msg err'; loginMsg.textContent = 'लॉगिन त्रुटि: '+ error.message; return; }
loginMsg.className='msg ok'; loginMsg.textContent='सफल!';
window.location.href = 'dashboard.html';
});
}


// Guard dashboard
const guard = document.getElementById('guarded');
if (guard) {
const { data: { user } } = await sb.auth.getUser();
if (!user) { window.location.href = 'login.html'; return; }
document.getElementById('userEmail').textContent = user.email || '';


// tabs
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.getElementById('btnLogout').addEventListener('click', async () => { await sb.auth.signOut(); window.location.href='login.html'; });
}
