// आपकी Supabase प्रोजेक्ट की जानकारी
const SUPABASE_URL = 'https://sjfglhxjdyvcygunijvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzII1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {

    // सभी HTML एलिमेंट्स
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
    const downloadTemplateBtn = document.getElementById('download-template-btn');
    const csvFileInput = document.getElementById('csv-file-input');
    const uploadCsvBtn = document.getElementById('upload-csv-btn');
    const uploadStatus = document.getElementById('upload-status');

    // पब्लिक सर्च फॉर्म
    publicSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const aadhaarNumber = document.getElementById('public-aadhaar-search').value.trim();
        if (!aadhaarNumber) return;
        publicResultsContainer.innerHTML = '<p>Searching...</p>';
        const { data, error } = await supabaseClient.from('farmers').select('name, father_name, bl_number').eq('aadhaar_number', aadhaarNumber).single();
        if (error || !data) {
            publicResultsContainer.innerHTML = '<p class="error">No record found.</p>';
        } else {
            publicResultsContainer.innerHTML = `<div class="card"><p><strong>Name:</strong> ${data.name}</p><p><strong>Father's Name:</strong> ${data.father_name}</p><p><strong>BL Number:</strong> ${data.bl_number}</p></div>`;
        }
    });

    // एडमिन सर्च फॉर्म
    adminSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        dashboardResultsContainer.innerHTML = '<p>Searching...</p>';
        const aadhaar = document.getElementById('admin-aadhaar-search').value.trim();
        const account = document.getElementById('admin-account-search').value.trim();
        const name = document.getElementById('admin-name-search').value.trim();
        const bl = document.getElementById('admin-bl-search').value.trim();
        const fatherName = document.getElementById('admin-father-search').value.trim();
        let query = supabaseClient.from('farmers').select('*');
        if (aadhaar) query = query.eq('aadhaar_number', aadhaar);
        if (account) query = query.eq('account_number', account);
        if (bl) query = query.eq('bl_number', bl);
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
        dashboardResultsContainer.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h4>Editing Record for: ${item.name}</h4>
                <p><strong>Aadhaar Number:</strong> <input type="text" id="aadhaar_number-${item.aadhaar_number}" value="${item.aadhaar_number || ''}"></p>
                <p><strong>Name:</strong> <input type="text" id="name-${item.aadhaar_number}" value="${item.name || ''}"></p>
                <p><strong>Father's Name:</strong> <input type="text" id="father_name-${item.aadhaar_number}" value="${item.father_name || ''}"></p>
                <p><strong>BL Number:</strong> <input type="text" id="bl_number-${item.aadhaar_number}" value="${item.bl_number || ''}"></p>
                <p><strong>Gender:</strong> <input type="text" id="gender-${item.aadhaar_number}" value="${item.gender || ''}"></p>
                <p><strong>Share Capital:</strong> <input type="text" id="share_capital-${item.aadhaar_number}" value="${item.share_capital || ''}"></p>
                <p><strong>Address:</strong> <input type="text" id="address-${item.aadhaar_number}" value="${item.address || ''}"></p>
                <p><strong>Age:</strong> <input type="text" id="age-${item.aadhaar_number}" value="${item.age || ''}"></p>
                <p><strong>Marriage Status:</strong> <input type="text" id="marriage_status-${item.aadhaar_number}" value="${item.marriage_status || ''}"></p>
                <p><strong>Mobile Number:</strong> <input type="text" id="mobile_number-${item.aadhaar_number}" value="${item.mobile_number || ''}"></p>
                <p><strong>Category:</strong> <input type="text" id="category-${item.aadhaar_number}" value="${item.category || ''}"></p>
                <p><strong>Account Number:</strong> <input type="text" id="account_number-${item.aadhaar_number}" value="${item.account_number || ''}"></p>
                <p><strong>Application Year:</strong> <input type="text" id="application_year-${item.aadhaar_number}" value="${item.application_year || ''}"></p>
                <p><strong>Nominee Name:</strong> <input type="text" id="nominee_name-${item.aadhaar_number}" value="${item.nominee_name || ''}"></p>
                <p><strong>Relation:</strong> <input type="text" id="relation-${item.aadhaar_number}" value="${item.relation || ''}"></p>
                <p><strong>Nominee Aadhaar:</strong> <input type="text" id="nominee_aadhaar_number-${item.aadhaar_number}" value="${item.nominee_aadhaar_number || ''}"></p>
                <p><strong>WhatsApp Number:</strong> <input type="text" id="whatsapp_number-${item.aadhaar_number}" value="${item.whatsapp_number || ''}"></p>
                <button onclick="updateRecord('${item.aadhaar_number}')">Save Changes</button>
                <button style="background-color:#6c757d;">Update Photo (Soon)</button>`;
            dashboardResultsContainer.appendChild(card);
        });
    });

    // लॉगिन फॉर्म
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { authError.textContent = error.message; } else { authError.textContent = ''; checkUserSession(); }
    });

    // लॉगिन/लॉगआउट बटन
    loginButton.addEventListener('click', () => { loginSection.style.display = loginSection.style.display === 'block' ? 'none' : 'block'; });
    logoutButton.addEventListener('click', async () => { await supabaseClient.auth.signOut(); checkUserSession(); });

    // CSV टेम्पलेट डाउनलोड
    downloadTemplateBtn.addEventListener('click', () => {
        const headers = "aadhaar_number,name,father_name,bl_number,gender,share_capital,address,age,marriage_status,mobile_number,category,account_number,application_year,application_expire,nominee_name,relation,nominee_aadhaar_number,whatsapp_number";
        const csvContent = "data:text/csv;charset=utf-8," + headers;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "farmers_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // CSV अपलोड
    uploadCsvBtn.addEventListener('click', () => {
        const file = csvFileInput.files[0];
        if (!file) {
            uploadStatus.innerHTML = `<p style="color: red;">Please select a CSV file first.</p>`;
            return;
        }
        uploadStatus.innerHTML = `<p>Parsing file...</p>`;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async function(results) {
                const dataToInsert = results.data;
                if (dataToInsert.length === 0) {
                    uploadStatus.innerHTML = `<p style="color: red;">The selected file is empty or invalid.</p>`;
                    return;
                }
                uploadStatus.innerHTML = `<p>File parsed. Found ${dataToInsert.length} records. Uploading...</p>`;
                const { error } = await supabaseClient.from('farmers').insert(dataToInsert);
                if (error) {
                    uploadStatus.innerHTML = `<p style="color: red;">Error uploading data: ${error.message}</p>`;
                } else {
                    uploadStatus.innerHTML = `<p style="color: green;">Successfully added ${dataToInsert.length} new farmers!</p>`;
                    csvFileInput.value = '';
                }
            },
            error: function(error) {
                uploadStatus.innerHTML = `<p style="color: red;">Error parsing file: ${error.message}</p>`;
            }
        });
    });

    // UI मैनेजमेंट फंक्शन
    async function checkUserSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            publicSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            loginSection.style.display = 'none';
        } else {
            publicSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
        }
    }
    checkUserSession();
});

// ग्लोबल फंक्शन (HTML से कॉल करने के लिए)
async function updateRecord(aadhaarNumber) {
    const updates = {
        aadhaar_number: document.getElementById(`aadhaar_number-${aadhaarNumber}`).value,
        name: document.getElementById(`name-${aadhaarNumber}`).value,
        father_name: document.getElementById(`father_name-${aadhaarNumber}`).value,
        bl_number: document.getElementById(`bl_number-${aadhaarNumber}`).value,
        gender: document.getElementById(`gender-${aadhaarNumber}`).value,
        share_capital: document.getElementById(`share_capital-${aadhaarNumber}`).value,
        address: document.getElementById(`address-${aadhaarNumber}`).value,
        age: document.getElementById(`age-${aadhaarNumber}`).value,
        marriage_status: document.getElementById(`marriage_status-${aadhaarNumber}`).value,
        mobile_number: document.getElementById(`mobile_number-${aadhaarNumber}`).value,
        category: document.getElementById(`category-${aadhaarNumber}`).value,
        account_number: document.getElementById(`account_number-${aadhaarNumber}`).value,
        application_year: document.getElementById(`application_year-${aadhaarNumber}`).value,
        nominee_name: document.getElementById(`nominee_name-${aadhaarNumber}`).value,
        relation: document.getElementById(`relation-${aadhaarNumber}`).value,
        nominee_aadhaar_number: document.getElementById(`nominee_aadhaar_number-${aadhaarNumber}`).value,
        whatsapp_number: document.getElementById(`whatsapp_number-${aadhaarNumber}`).value,
    };
    const { error } = await supabaseClient.from('farmers').update(updates).eq('aadhaar_number', aadhaarNumber);
    if (error) {
        alert('Update failed: ' + error.message);
    } else {
        alert('Record updated successfully!');
    }
}
window.updateRecord = updateRecord;
