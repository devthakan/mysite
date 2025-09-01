// आपकी Supabase प्रोजेक्ट की जानकारी
const SUPABASE_URL = 'https://sjfglhxjdyvcygunijvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginSection = document.getElementById('login-section');
const publicSection = document.getElementById('public-section');
const dashboardSection = document.getElementById('dashboard-section');

const publicSearchForm = document.getElementById('public-search-form');
const publicResultsContainer = document.getElementById('public-results-container');

const adminSearchForm = document.getElementById('admin-search-form');
const dashboardResultsContainer = document.getElementById('dashboard-results-container');

const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');

// =================================================================
// Event Listeners
// =================================================================

// पब्लिक सर्च फॉर्म सबमिट होने पर
publicSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const aadhaarNumber = document.getElementById('public-aadhaar-search').value.trim();
    if (!aadhaarNumber) return;

    publicResultsContainer.innerHTML = '<p>Searching...</p>';

    const { data, error } = await supabase
        .from('farmers')
        .select('name, father_name, bl_number')
        .eq('aadhaar_number', aadhaarNumber)
        .single(); // .single() क्योंकि आधार यूनिक होना चाहिए

    if (error || !data) {
        publicResultsContainer.innerHTML = '<p class="error">No record found or there was an error.</p>';
        console.error('Public search error:', error);
    } else {
        publicResultsContainer.innerHTML = `
            <div class="card">
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Father's Name:</strong> ${data.father_name}</p>
                <p><strong>BL Number:</strong> ${data.bl_number}</p>
            </div>
        `;
    }
});

// एडमिन सर्च फॉर्म सबमिट होने पर
adminSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    dashboardResultsContainer.innerHTML = '<p>Searching...</p>';
    
    // सभी इनपुट फील्ड्स से वैल्यू प्राप्त करें
    const aadhaar = document.getElementById('admin-aadhaar-search').value.trim();
    const account = document.getElementById('admin-account-search').value.trim();
    const name = document.getElementById('admin-name-search').value.trim();
    const bl = document.getElementById('admin-bl-search').value.trim();
    const fatherName = document.getElementById('admin-father-search').value.trim();

    // Supabase क्वेरी बनाएं
    let query = supabase.from('farmers').select('*');

    // जिस भी फील्ड में वैल्यू हो, उसके हिसाब से फ़िल्टर जोड़ें
    if (aadhaar) query = query.eq('aadhaar_number', aadhaar);
    if (account) query = query.eq('account_number', account);
    if (bl) query = query.eq('bl_number', bl);
    // नाम और पिता के नाम के लिए .ilike() का उपयोग करें ताकि छोटे-बड़े अक्षरों और अधूरे नाम से भी सर्च हो सके
    if (name) query = query.ilike('name', `%${name}%`);
    if (fatherName) query = query.ilike('father_name', `%${fatherName}%`);

    const { data, error } = await query;

    if (error) {
        dashboardResultsContainer.innerHTML = `<p class="error">Error fetching data: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        dashboardResultsContainer.innerHTML = '<p>No matching records found.</p>';
        return;
    }
    
    // मिले हुए हर रिकॉर्ड के लिए एडिटेबल फॉर्म दिखाएं
    dashboardResultsContainer.innerHTML = ''; // पहले के नतीजे साफ़ करें
    data.forEach(item => {
        const recordCard = document.createElement('div');
        recordCard.className = 'card';
        recordCard.innerHTML = `
            <h4>Editing Record for: ${item.name}</h4>
            <p><strong>Aadhaar Number:</strong> <input type="text" id="aadhaar_number-${item.id}" value="${item.aadhaar_number || ''}"></p>
            <p><strong>Name:</strong> <input type="text" id="name-${item.id}" value="${item.name || ''}"></p>
            <p><strong>Father's Name:</strong> <input type="text" id="father_name-${item.id}" value="${item.father_name || ''}"></p>
            <p><strong>BL Number:</strong> <input type="text" id="bl_number-${item.id}" value="${item.bl_number || ''}"></p>
            <p><strong>Gender:</strong> <input type="text" id="gender-${item.id}" value="${item.gender || ''}"></p>
            <p><strong>Share Capital:</strong> <input type="text" id="share_capital-${item.id}" value="${item.share_capital || ''}"></p>
            <p><strong>Address:</strong> <input type="text" id="address-${item.id}" value="${item.address || ''}"></p>
            <p><strong>Age:</strong> <input type="text" id="age-${item.id}" value="${item.age || ''}"></p>
            <p><strong>Marriage Status:</strong> <input type="text" id="marriage_status-${item.id}" value="${item.marriage_status || ''}"></p>
            <p><strong>Mobile Number:</strong> <input type="text" id="mobile_number-${item.id}" value="${item.mobile_number || ''}"></p>
            <p><strong>Category:</strong> <input type="text" id="category-${item.id}" value="${item.category || ''}"></p>
            <p><strong>Account Number:</strong> <input type="text" id="account_number-${item.id}" value="${item.account_number || ''}"></p>
            <p><strong>Application Year:</strong> <input type="text" id="application_year-${item.id}" value="${item.application_year || ''}"></p>
            <p><strong>Nominee Name:</strong> <input type="text" id="nominee_name-${item.id}" value="${item.nominee_name || ''}"></p>
            <p><strong>Relation:</strong> <input type="text" id="relation-${item.id}" value="${item.relation || ''}"></p>
            <p><strong>Nominee Aadhaar:</strong> <input type="text" id="nominee_aadhaar_number-${item.id}" value="${item.nominee_aadhaar_number || ''}"></p>
            <p><strong>WhatsApp Number:</strong> <input type="text" id="whatsapp_number-${item.id}" value="${item.whatsapp_number || ''}"></p>
            <button onclick="updateRecord(${item.id})">Save Changes</button>
            <button style="background-color:#6c757d;">Update Photo (Soon)</button>
        `;
        dashboardResultsContainer.appendChild(recordCard);
    });
});


// =================================================================
// फंक्शन: रिकॉर्ड अपडेट करने के लिए
// =================================================================
async function updateRecord(id) {
    // सभी इनपुट फील्ड्स से नया डेटा इकट्ठा करें
    const updates = {
        aadhaar_number: document.getElementById(`aadhaar_number-${id}`).value,
        name: document.getElementById(`name-${id}`).value,
        father_name: document.getElementById(`father_name-${id}`).value,
        bl_number: document.getElementById(`bl_number-${id}`).value,
        gender: document.getElementById(`gender-${id}`).value,
        share_capital: document.getElementById(`share_capital-${id}`).value,
        address: document.getElementById(`address-${id}`).value,
        age: document.getElementById(`age-${id}`).value,
        marriage_status: document.getElementById(`marriage_status-${id}`).value,
        mobile_number: document.getElementById(`mobile_number-${id}`).value,
        category: document.getElementById(`category-${id}`).value,
        account_number: document.getElementById(`account_number-${id}`).value,
        application_year: document.getElementById(`application_year-${id}`).value,
        nominee_name: document.getElementById(`nominee_name-${id}`).value,
        relation: document.getElementById(`relation-${id}`).value,
        nominee_aadhaar_number: document.getElementById(`nominee_aadhaar_number-${id}`).value,
        whatsapp_number: document.getElementById(`whatsapp_number-${id}`).value,
    };

    const { error } = await supabase
        .from('farmers')
        .update(updates)
        .eq('id', id);

    if (error) {
        alert('Update failed: ' + error.message);
    } else {
        alert('Record updated successfully!');
    }
}


// =================================================================
// ऑथेंटिकेशन और UI मैनेजमेंट
// =================================================================

// लॉगिन फॉर्म
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authError.textContent = error.message;
    } else {
        authError.textContent = '';
        loginSection.style.display = 'none'; // लॉगिन फॉर्म छिपाएं
        checkUserSession(); // UI अपडेट करें
    }
});

// लॉगिन बटन पर क्लिक करने पर फॉर्म दिखाना
loginButton.addEventListener('click', () => {
    loginSection.style.display = 'block';
});

// लॉगआउट बटन
logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkUserSession();
});

// यूजर सेशन चेक करने और UI को मैनेज करने का मुख्य फंक्शन
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // यूजर लॉग इन है
        publicSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        loginSection.style.display = 'none';
    } else {
        // यूजर लॉग इन नहीं है
        publicSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
    }
}

// पेज लोड होने पर तुरंत सेशन चेक करें
document.addEventListener('DOMContentLoaded', checkUserSession);

// updateRecord फंक्शन को ग्लोबल बनाना ताकि HTML onclick उसे एक्सेस कर सके
window.updateRecord = updateRecord;
