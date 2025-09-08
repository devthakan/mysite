// app-admin.js

// ------------ Helpers ------------
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 2500);
}
const money = (n)=> '₹' + (Number(n||0).toFixed(2));

// Drawer refs
const drawer = $('#drawer');
const dShop = $('#d-shop');
const dHolder = $('#d-holder');
const dComplex = $('#d-complex');
const dWA = $('#d-wa');
const dRent = $('#d-rent');
const dDue = $('#d-due');
const dPaid = $('#d-paid');
const dBalance = $('#d-balance');

const pf = {
  amount: $('#pf-amount'),
  receipt: $('#pf-receipt'),
  date: $('#pf-date'),
  notes: $('#pf-notes'),
  monthTo: $('#pf-month-to'),
  month: $('#pf-month'),
  save: $('#pf-save'),
  remind: $('#pf-remind'),
  status: $('#pf-status'),
};

// Auth refs
const loginCard = $('#login-card');
const content = $('#content');
const userEmail = $('#user-email');
const logoutBtn = $('#logout');
const loginBtn = $('#login');
const email = $('#email');
const password = $('#password');

// Search / list refs
const q = $('#q');
const btnSearch = $('#btn-search');
const btnClear = $('#btn-clear');
const chips = $$('.chip');
const grid = $('#shops-grid');
const loadMore = $('#load-more');

let session = null;
let selectedShop = null;
let filterMode = 'all';
let query = '';
let page = 0;
const PAGE_SIZE = 24;

// ------------ Auth ------------
function setLoggedIn(s) {
  session = s;
  if (session?.user) {
    userEmail.textContent = session.user.email;
    logoutBtn.style.display = 'inline-flex';
    loginCard.style.display = 'none';
    content.style.display = 'block';
    // auto-load shops on login
    hardRefresh();
  } else {
    userEmail.textContent = '';
    logoutBtn.style.display = 'none';
    content.style.display = 'none';
    loginCard.style.display = 'flex';
  }
}

async function init() {
  const { data: { session: s } } = await supabase.auth.getSession();
  setLoggedIn(s);
  supabase.auth.onAuthStateChange((_e, s2) => setLoggedIn(s2));
  pf.date.valueAsDate = new Date();
  const now = new Date();
  pf.month.value = now.toLocaleString('en-US',{month:'short'});
  pf.monthTo.value = pf.month.value + ' ' + now.getFullYear();
}
document.addEventListener('DOMContentLoaded', init);

loginBtn.addEventListener('click', async () => {
  loginBtn.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value, password: password.value
  });
  loginBtn.disabled = false;
  if (error) toast('Login failed: ' + error.message);
});
logoutBtn.addEventListener('click', async ()=>{ await supabase.auth.signOut(); });

// ------------ Shops Load ------------
async function fetchShops({ q='', page=0, mode='all' }) {
  // Base query
  let qb = supabase.from('shops')
    .select('id, sn, shop_no, holder_name, father_name, whatsapp, monthly_rent, open_date, complex, is_active')
    .order('shop_no', { ascending: true })
    .range(page*PAGE_SIZE, page*PAGE_SIZE + PAGE_SIZE - 1);

  // Search
  if (q) {
    qb = qb.or(`shop_no.ilike.%${q}%,holder_name.ilike.%${q}%,complex.ilike.%${q}%`);
  }

  // Filter (client/basic server)
  // For 'due' we will color via RPC (per shop dues fetched lazily in drawer).
  if (mode === 'active') qb = qb.eq('is_active', true);

  const { data, error } = await qb;
  if (error) { toast('Load error: '+error.message); return []; }
  return data || [];
}

function shopCard(shop) {
  const el = document.createElement('div');
  el.className = 'card-shop';
  el.innerHTML = `
    <div class="title">${shop.shop_no} — ${shop.holder_name}</div>
    <div class="tags">
      <span class="tag">${shop.complex || '-'}</span>
      <span class="tag">Open: ${new Date(shop.open_date).toLocaleDateString('en-IN')}</span>
      <span class="tag">Rent: ${money(shop.monthly_rent)}</span>
      ${shop.is_active ? '<span class="badge positive">Active</span>' : '<span class="badge warn">Inactive</span>'}
    </div>
    <div class="actions">
      <button class="btn btn-collect">किराया जमा</button>
      <button class="btn btn-ghost btn-remind">रिमाइंडर</button>
    </div>
  `;
  // actions
  el.querySelector('.btn-collect').addEventListener('click', () => openDrawer(shop));
  el.querySelector('.btn-remind').addEventListener('click', () => remindOne(shop));
  return el;
}

async function renderPage() {
  const rows = await fetchShops({ q: query, page, mode: filterMode });
  if (!rows.length && page===0) {
    grid.innerHTML = '<div class="card">कोई दुकान नहीं मिली।</div>';
    loadMore.style.display = 'none';
    return;
  }
  if (rows.length < PAGE_SIZE) loadMore.style.display = 'none';
  else loadMore.style.display = 'inline-flex';

  const frag = document.createDocumentFragment();
  rows.forEach(r => frag.appendChild(shopCard(r)));
  grid.appendChild(frag);
}

function hardRefresh() {
  page = 0;
  grid.innerHTML = '';
  loadMore.style.display = 'inline-flex';
  renderPage();
}

btnSearch.addEventListener('click', ()=>{ query = q.value.trim(); hardRefresh(); });
btnClear.addEventListener('click', ()=>{ q.value=''; query=''; hardRefresh(); });
loadMore.addEventListener('click', ()=>{ page++; renderPage(); });

chips.forEach(ch => ch.addEventListener('click', ()=>{
  chips.forEach(c=>c.classList.remove('active'));
  ch.classList.add('active');
  filterMode = ch.dataset.filter;
  hardRefresh();
}));

// ------------ Drawer (Payment) ------------
function openDrawer(shop) {
  selectedShop = shop;
  // Fill static
  dShop.textContent = shop.shop_no;
  dHolder.textContent = shop.holder_name + (shop.father_name ? ` (S/O ${shop.father_name})` : '');
  dComplex.textContent = shop.complex || '-';
  dWA.textContent = shop.whatsapp || '-';
  dRent.textContent = money(shop.monthly_rent);

  // Defaults
  pf.amount.value = Number(shop.monthly_rent || 0).toFixed(2);
  pf.receipt.value = '';
  pf.notes.value = '';
  pf.status.textContent = '';

  // Dynamic dues (via RPC list then filter by this shop_no)
  loadDuesForShop(shop.shop_no);

  drawer.classList.add('open');
}
$('#drawer-close').addEventListener('click', ()=> drawer.classList.remove('open'));

async function loadDuesForShop(shop_no) {
  const { data, error } = await supabase.rpc('get_public_dues');
  if (error) { dDue.textContent = '—'; dPaid.textContent='—'; dBalance.textContent='—'; return; }
  const row = (data||[]).find(r => String(r.shop_no) === String(shop_no));
  if (!row) { dDue.textContent = '—'; dPaid.textContent='—'; dBalance.textContent='₹0'; return; }
  dDue.textContent = money(row.expected);
  dPaid.textContent = money(row.paid);
  dBalance.textContent = money(row.balance);
}

// ------------ Actions: Save + Reminder ------------
pf.save.addEventListener('click', async () => {
  if (!selectedShop) return;

  const amount = Number((pf.amount.value || "0").toString().replace(/[^\d.]/g, ''));
  if (!amount || amount <= 0) { pf.status.textContent = 'राशि सही डालें'; return; }

  pf.save.disabled = true;
  pf.status.textContent = 'Saving...';

  // 1) Save ledger
  const { error } = await supabase
    .from('rent_ledger')
    .insert({
      shop_id: selectedShop.id,
      amount,
      receipt_no: (pf.receipt.value || '').toString().trim() || '-',
      payment_date: pf.date.value || null,
      notes: (pf.notes.value || '').toString().trim() || null
    });

  if (error) {
    pf.status.textContent = 'Error: ' + error.message;
    pf.save.disabled = false;
    return;
  }

  // 2) Send receipt (Edge Function) — हिंदी टेम्पलेट पहले से ready
  try {
    const father = (selectedShop.father_name || '').toString().trim() || '---';
    const complex = (selectedShop.complex || '').toString().trim() || '---';
    const mto = (pf.monthTo.value || '').toString().trim() ||
      new Date().toLocaleString('en-US',{month:'short',year:'numeric'});
    const m = (pf.month.value || '').toString().trim() ||
      new Date().toLocaleString('en-US',{month:'short'});

    const resp = await supabase.functions.invoke('send-whatsapp', {
      body: {
        kind: 'receipt',
        to: selectedShop.whatsapp || '',
        name: (selectedShop.holder_name || '').toString().trim() || '---',
        father_name: father,
        shop_no: (selectedShop.shop_no || '').toString().trim(),
        complex: complex,
        month_to: mto,
        month: m,
        amount: amount,
        receipt_no: (pf.receipt.value || '').toString().trim() || '-'
      }
    });
    if (!resp.data?.ok) {
      pf.status.textContent = 'WA error: ' + (resp.data?.reason||'') + ' ' + (resp.data?.status||'');
      console.log('WA detail:', resp.data);
    } else {
      pf.status.textContent = 'सेव + रसीद भेजी गई ✅';
      toast('रसीद WhatsApp पर भेजी गई');
      // refresh dues quick
      loadDuesForShop(selectedShop.shop_no);
    }
  } catch (e) {
    pf.status.textContent = 'WhatsApp exception: ' + e;
  }

  pf.save.disabled = false;
});

async function remindOne(shop) {
  try {
    toast('रिमाइंडर भेज रहे हैं…');
    // balance निकालने के लिए RPC
    const { data } = await supabase.rpc('get_public_dues');
    const row = (data||[]).find(r => String(r.shop_no) === String(shop.shop_no));
    const balance = row ? Number(row.balance) : Number(shop.monthly_rent) || 0;

    const r = await supabase.functions.invoke('send-whatsapp', {
      body: {
        kind:'reminder',
        to: shop.whatsapp || '',
        name: shop.holder_name || '',
        father_name: shop.father_name || '(Father Name)',
        balance
      }
    });
    if (!r.data?.ok) { toast('WA error (reminder)'); console.log(r.data); }
    else toast('रिमाइंडर भेजा गया ✅');
  } catch (e) {
    toast('Exception (reminder)');
    console.error(e);
  }
}

// Bulk remind
$('#bulk-remind').addEventListener('click', async ()=>{
  if (!confirm('बकाया वालों को WhatsApp रिमाइंडर भेजें?')) return;
  $('#bulk-remind').disabled = true;
  $('#bulk-status').textContent = 'रिमाइंडर भेज रहे हैं...';

  try {
    const { data, error } = await supabase.rpc('get_public_dues');
    if (error) throw error;
    const dues = data || [];
    let sent=0, skipped=0, failed=0;

    for (const r of dues) {
      const { data: shop, error: e2 } = await supabase
        .from('shops')
        .select('shop_no, holder_name, father_name, whatsapp')
        .eq('shop_no', r.shop_no)
        .maybeSingle();
      if (e2 || !shop?.whatsapp) { skipped++; continue; }

      try {
        const res = await supabase.functions.invoke('send-whatsapp', {
          body: {
            kind:'reminder',
            to: shop.whatsapp,
            name: shop.holder_name,
            father_name: shop.father_name || '(Father Name)',
            balance: Number(r.balance || 0)
          }
        });
        if (!res.data?.ok) failed++; else sent++;
      } catch { failed++; }

      $('#bulk-status').textContent = `भेजे गए: ${sent} | स्किप: ${skipped} | फेल: ${failed}`;
      await new Promise(r=>setTimeout(r, 900));
    }

    $('#bulk-status').textContent = `पूर्ण ✅ भेजे गए: ${sent}, स्किप: ${skipped}, फेल: ${failed}`;
  } catch (e) {
    $('#bulk-status').textContent = 'Error: ' + e.message;
  } finally {
    $('#bulk-remind').disabled = false;
  }
});
