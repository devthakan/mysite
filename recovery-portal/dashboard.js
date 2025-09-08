// Table names
const T_MASTER = 'recovery_master'; // स्रोत रिपोर्ट
const T_COLL = 'collections'; // वसूली एंट्री
const V_DASH = 'v_recovery_dashboard'; // एग्रीगेट्स


window.addEventListener('DOMContentLoaded', async () => {
if (!document.getElementById('guarded')) return; // only on dashboard


await loadOverview();
bindList();
bindCollect();
bindReports();
});


async function loadOverview(){
const { data, error } = await sb.from(V_DASH).select('*').single();
if (error) { console.error(error); return; }
document.getElementById('totalMembers').textContent = fmtINR(data.total_members);
document.getElementById('totalDue').textContent = fmtINR(data.total_due);
document.getElementById('totalCollected').textContent = fmtINR(data.total_collected);
document.getElementById('remainingDue').textContent = fmtINR(data.remaining_due);
document.getElementById('unpaidMembers').textContent = fmtINR(data.unpaid_members);
document.getElementById('paidMembers').textContent = fmtINR(data.paid_members);
document.getElementById('todayCollected').textContent = fmtINR(data.today_collected);
}


function bindList(){
const q = document.getElementById('q');
document.getElementById('btnSearch').addEventListener('click', ()=> loadList(q.value.trim()));
document.getElementById('btnClear').addEventListener('click', ()=> { q.value=''; loadList(''); });
loadList('');
}


async function loadList(query){
const body = document.getElementById('dueBody'); body.innerHTML='<tr><td colspan="7">लोड हो रहा है…</td></tr>';
let req = sb.from(T_MASTER).select('adhar_number,name,account_number,dmr_number,amount,whatsapp_number').eq('active', true).order('name');
if(query){
req = req.or(`adhar_number.ilike.%${query}%,name.ilike.%${query}%,account_number.ilike.%${query}%,dmr_number.ilike.%${query}%`);
}
const { data, error } = await req.limit(2000);
if (error){ body.innerHTML = `<tr><td colspan=7>त्रुटि: ${error.message}</td></tr>`; return; }
if (!data || data.length===0){ body.innerHTML = `<tr><td colspan=7>कोई रिकॉर्ड नहीं</td></tr>`; return; }
body.innerHTML = data.map(r=>rowDue(r)).join('');


// wire send buttons
document.querySelectorAll('[data-sendwa]').forEach(btn=>{
btn.addEventListener('click', ()=> sendWhatsApp(btn.dataset.payload));
});
}


function rowDue(r){
const wa = toE164(r.whatsapp_number||'');
const payload = encodeURIComponent(JSON.stringify({
name: r.name, amount: r.amount, account_number: r.account_number, dmr_number: r.dmr_number, to: wa
}));
return `<tr>
<td>${r.adhar_number||''}</td>
<td>${r.name||''}</td>
<td>${r.account_number||''}</td>
<td>${r.dmr_number||''}</td>
<td>₹ ${fmtINR(r.amount)}</td>
<td class="whatsapp"><span class="badge">${wa||'N/A'}</span></td>
<td><button class="btn" data-sendwa="1" data-payload="${payload}">WhatsApp</button></td>
</tr>`;
}


function bindCollect(){
const f = document.getElementById('collectForm');
}
