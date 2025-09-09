// 👉 अपनी Supabase प्रोजेक्ट जानकारी
const SUPABASE_URL = "https://sjfglhxjdyvcygunijvz.supabase.co"; // 🔁 बदलें
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM"; // 🔁 बदलें


const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


function onlyDigits(s=''){ return (s||'').replace(/\D+/g,''); }
function fmtINR(n){ if(n===null||n===undefined||isNaN(n)) return '₹ 0'; return '₹ ' + Number(n).toLocaleString('en-IN'); }


window.addEventListener('DOMContentLoaded', () => {
const input = document.getElementById('adhar');
const btn = document.getElementById('btnCheck');
const msg = document.getElementById('homeMsg');
const card = document.getElementById('resultCard');
const text = document.getElementById('resultText');
const sub = document.getElementById('resultSub');


btn.addEventListener('click', async () => {
msg.className='msg'; msg.textContent='जांच हो रही है…'; card.style.display='none';
let adhar = onlyDigits(input.value.trim());
if(adhar.length !== 12){ msg.className='msg err'; msg.textContent='कृपया 12 अंकों का वैध आधार नंबर दर्ज करें'; return; }


const { data, error } = await sb.rpc('public_due_by_adhar', { p_adhar: adhar });
if (error){ msg.className='msg err'; msg.textContent = 'त्रुटि: ' + error.message; return; }
msg.textContent='';


const row = Array.isArray(data) ? data[0] : data;
if(!row || (Number(row.total_due||0)===0 && Number(row.total_collected||0)===0)){
card.style.display='block';
text.textContent = 'रिकॉर्ड नहीं मिला';
sub.textContent = 'कृपया आधार संख्या जाँचकर पुनः प्रयास करें।';
return;
}
const remaining = Number(row.remaining_due || 0);
card.style.display='block';


});
