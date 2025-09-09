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
bindMasterDataControls();
});


// -------- OVERVIEW --------
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


// -------- LIST + INLINE UPDATE --------
function bindList(){
const q = document.getElementById('q');
document.getElementById('btnSearch').addEventListener('click', ()=> loadList(q.value.trim()));
document.getElementById('btnClear').addEventListener('click', ()=> { q.value=''; loadList(''); });
loadList('');
}


}
