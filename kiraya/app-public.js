const tbody = document.getElementById('dues-body');
const empty = document.getElementById('empty');
const search = document.getElementById('search');
const refreshBtn = document.getElementById('refresh');

const money = (n)=> '₹' + Number(n||0).toFixed(2);
const fmtDate = (d)=> new Date(d).toLocaleDateString('en-IN');

let cache = [];

async function loadDues() {
  const { data, error } = await supabase.rpc('get_public_dues');
  if (error) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = 'लोडिंग में समस्या हुई।';
    return;
  }
  cache = data || [];
  render(cache);
}

function render(rows) {
  tbody.innerHTML = '';
  if (!rows.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.shop_no}</td>
      <td>${r.holder_name}</td>
      <td>${r.complex}</td>
      <td>${fmtDate(r.open_date)}</td>
      <td>${money(r.monthly_rent)}</td>
      <td>${money(r.expected)}</td>
      <td>${money(r.paid)}</td>
      <td><b>${money(r.balance)}</b></td>
    `;
    tbody.appendChild(tr);
  }
}

search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  const filtered = cache.filter(r =>
    String(r.shop_no).toLowerCase().includes(q) ||
    String(r.holder_name).toLowerCase().includes(q) ||
    String(r.complex || '').toLowerCase().includes(q)
  );
  render(filtered);
});

refreshBtn.addEventListener('click', loadDues);
document.addEventListener('DOMContentLoaded', loadDues);
