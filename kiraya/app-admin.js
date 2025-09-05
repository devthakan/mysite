// app-admin.js

const loginCard = document.getElementById('login-card');
const appCard = document.getElementById('app-card');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout');

const email = document.getElementById('email');
const password = document.getElementById('password');
const loginBtn = document.getElementById('login');

const shopQuery = document.getElementById('shop-query');
const shopSearch = document.getElementById('shop-search');
const shopResults = document.getElementById('shop-results');

const pf = {
  wrap: document.getElementById('payment-form'),
  shopNo: document.getElementById('pf-shop-no'),
  holder: document.getElementById('pf-holder'),
  whatsapp: document.getElementById('pf-whatsapp'),
  rent: document.getElementById('pf-rent'),
  amount: document.getElementById('pf-amount'),
  receipt: document.getElementById('pf-receipt'),
  date: document.getElementById('pf-date'),
  notes: document.getElementById('pf-notes'),
  save: document.getElementById('pf-save'),
  status: document.getElementById('pf-status'),
};

let selectedShop = null;

function setLoggedIn(session) {
  if (session?.user) {
    userEmail.textContent = session.user.email;
    logoutBtn.style.display = 'inline-flex';
    loginCard.style.display = 'none';
    appCard.style.display = 'block';
  } else {
    userEmail.textContent = '';
    logoutBtn.style.display = 'none';
    appCard.style.display = 'none';
    loginCard.style.display = 'block';
  }
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  setLoggedIn(session);
  supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(s));
  // default date today
  pf.date.valueAsDate = new Date();
}
document.addEventListener('DOMContentLoaded', init);

loginBtn.addEventListener('click', async () => {
  loginBtn.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value, password: password.value
  });
  loginBtn.disabled = false;
  if (error) alert('Login failed: ' + error.message);
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

shopSearch.addEventListener('click', async () => {
  const q = shopQuery.value.trim();
  if (!q) return;
  shopResults.innerHTML = 'Searching...';
  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_no, holder_name, whatsapp, monthly_rent, open_date')
    .or(`shop_no.ilike.%${q}%,holder_name.ilike.%${q}%`)
    .limit(20);

  if (error) {
    shopResults.innerHTML = '<div class="muted">Error: '+error.message+'</div>';
    return;
  }
  if (!data.length) {
    shopResults.innerHTML = '<div class="muted">कोई रिकॉर्ड नहीं मिला</div>';
    return;
  }
  renderShopResults(data);
});

function renderShopResults(rows) {
  shopResults.innerHTML = '';
  rows.forEach(row => {
    const el = document.createElement('div');
    el.className = 'result-item';
    el.innerHTML = `
      <div>
        <div><b>${row.shop_no}</b> — ${row.holder_name}</div>
        <div class="meta">WhatsApp: ${row.whatsapp || '-'} | Rent: ₹${Number(row.monthly_rent).toFixed(2)}</div>
      </div>
      <button class="btn">Select</button>
    `;
    el.querySelector('button').addEventListener('click', () => pickShop(row));
    shopResults.appendChild(el);
  });
}

function pickShop(row) {
  selectedShop = row;
  pf.wrap.style.display = 'block';
  pf.shopNo.value = row.shop_no;
  pf.holder.value = row.holder_name;
  pf.whatsapp.value = row.whatsapp || '';
  pf.rent.value = Number(row.monthly_rent).toFixed(2);
  pf.amount.value = row.monthly_rent ? Number(row.monthly_rent).toFixed(2) : '';
  pf.receipt.value = '';
  pf.notes.value = '';
  pf.status.textContent = '';
}

pf.save.addEventListener('click', async () => {
  if (!selectedShop) return;
  const amount = Number(pf.amount.value);
  if (!amount || amount <= 0) {
    pf.status.textContent = 'राशि सही डालें';
    return;
  }
  pf.save.disabled = true;
  pf.status.textContent = 'Saving...';

  // 1) rent_ledger insert
  const { data, error } = await supabase
    .from('rent_ledger')
    .insert({
      shop_id: selectedShop.id,
      amount,
      receipt_no: pf.receipt.value || null,
      payment_date: pf.date.value || null,
      notes: pf.notes.value || null
    })
    .select()
    .single();

  if (error) {
    pf.status.textContent = 'Error: ' + error.message;
    pf.save.disabled = false;
    return;
  }

  // 2) WhatsApp via Edge Function (non-blocking)
  try {
    await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: selectedShop.whatsapp || '',
        shop_no: selectedShop.shop_no,
        holder_name: selectedShop.holder_name,
        amount: amount,
        receipt_no: pf.receipt.value || undefined,
        payment_date: pf.date.value || undefined
      }
    });
  } catch (e) {
    console.warn('WhatsApp send failed:', e);
  }

  pf.status.textContent = 'सेव हो गया ✅';
  pf.save.disabled = false;
});
