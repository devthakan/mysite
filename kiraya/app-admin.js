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

const bulkBtn = document.getElementById('bulk-remind');
const bulkStatus = document.getElementById('bulk-status');

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
  monthTo: document.getElementById('pf-month-to'),
  month: document.getElementById('pf-month'),
  save: document.getElementById('pf-save'),
  remind: document.getElementById('pf-remind'),
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

function monthLabel(d = new Date()) {
  return d.toLocaleString('en-US', { month: 'short' }); // "Sep"
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  setLoggedIn(session);
  supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(s));
  pf.date.valueAsDate = new Date();
  const now = new Date();
  pf.month.value = monthLabel(now);
  pf.monthTo.value = `${monthLabel(now)} ${now.getFullYear()}`;
}
document.addEventListener('DOMContentLoaded', init);

// ========== AUTH ==========
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

// ========== SEARCH ==========
shopSearch.addEventListener('click', async () => {
  const q = shopQuery.value.trim();
  if (!q) return;
  shopResults.innerHTML = 'Searching...';
  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_no, holder_name, father_name, whatsapp, monthly_rent, open_date, complex')
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
        <div class="meta">Father: ${row.father_name || '-'} | WhatsApp: ${row.whatsapp || '-'} | Rent: ₹${Number(row.monthly_rent).toFixed(2)}</div>
        <div class="meta">Complex: ${row.complex || '-'} | Opened: ${new Date(row.open_date).toLocaleDateString('en-IN')}</div>
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

// ========== SAVE PAYMENT + RECEIPT TEMPLATE ==========
pf.save.addEventListener('click', async () => {
  if (!selectedShop) return;
  const amount = Number(pf.amount.value);
  if (!amount || amount <= 0) {
    pf.status.textContent = 'राशि सही डालें';
    return;
  }
  pf.save.disabled = true;
  pf.status.textContent = 'Saving...';

  // 1) Save in ledger
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

  // 2) WhatsApp receipt template (receivekiraya01)
  try {
    await supabase.functions.invoke('send-whatsapp', {
      body: {
        kind: 'receipt',
        to: selectedShop.whatsapp || '',
        name: selectedShop.holder_name || '',
        father_name: selectedShop.father_name || '(Father Name)',
        shop_no: selectedShop.shop_no,
        complex: selectedShop.complex || '',
        month_to: pf.monthTo.value || '',
        month: pf.month.value || '',
        amount: amount,
        receipt_no: pf.receipt.value || undefined
      }
    });
  } catch (e) {
    console.warn('WhatsApp receipt send failed:', e);
  }

  pf.status.textContent = 'सेव हो गया ✅';
  pf.save.disabled = false;
});

// ========== REMINDER (Single) ==========
async function fetchSelectedShopBalance() {
  const { data, error } = await supabase.rpc('get_public_dues');
  if (error) return null;
  const row = (data || []).find(r => String(r.shop_no) === String(selectedShop.shop_no));
  return row ? Number(row.balance) : null;
}

pf.remind.addEventListener('click', async () => {
  if (!selectedShop) return;
  pf.remind.disabled = true;
  pf.status.textContent = 'रिमाइंडर भेज रहा हूँ...';

  const balance = await fetchSelectedShopBalance();

  try {
    await supabase.functions.invoke('send-whatsapp', {
      body: {
        kind: 'reminder',
        to: selectedShop.whatsapp || '',
        name: selectedShop.holder_name || '',
        father_name: selectedShop.father_name || '(Father Name)',
        balance: (balance != null ? balance : Number(pf.rent.value) || 0)
      }
    });
    pf.status.textContent = 'रिमाइंडर भेज दिया ✅';
  } catch (e) {
    pf.status.textContent = 'रिमाइंडर भेजने में समस्या: ' + e;
  } finally {
    pf.remind.disabled = false;
  }
});

// ========== BULK REMINDER (All dues) ==========
async function getAllDues() {
  const { data, error } = await supabase.rpc('get_public_dues');
  if (error) throw error;
  return data || [];
}

async function findShopByShopNo(shop_no) {
  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_no, holder_name, father_name, whatsapp, complex')
    .eq('shop_no', shop_no)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

bulkBtn?.addEventListener('click', async () => {
  if (!confirm('बकाया वालों को WhatsApp रिमाइंडर भेजें?')) return;
  bulkBtn.disabled = true;
  bulkStatus.textContent = 'रिमाइंडर भेज रहा हूँ...';

  try {
    const dues = await getAllDues();  // {shop_no, holder_name, complex, balance, ...}
    let sent = 0, skipped = 0, failed = 0;

    for (const r of dues) {
      try {
        const shop = await findShopByShopNo(r.shop_no);
        if (!shop?.whatsapp) { skipped++; continue; }

        await supabase.functions.invoke('send-whatsapp', {
          body: {
            kind: 'reminder',
            to: shop.whatsapp,
            name: shop.holder_name,
            father_name: shop.father_name || '(Father Name)',
            balance: Number(r.balance || 0)
          }
        });

        sent++;
        bulkStatus.textContent = `भेजे गए: ${sent} | स्किप: ${skipped} | फेल: ${failed}`;
        await sleep(1000); // throttle (1/sec)
      } catch {
        failed++;
        bulkStatus.textContent = `भेजे गए: ${sent} | स्किप: ${skipped} | फेल: ${failed}`;
        await sleep(1000);
      }
    }

    bulkStatus.textContent = `पूर्ण ✅ भेजे गए: ${sent}, स्किप: ${skipped}, फेल: ${failed}`;
  } catch (e) {
    bulkStatus.textContent = 'Error: ' + e.message;
  } finally {
    bulkBtn.disabled = false;
  }
});
