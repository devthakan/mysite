// आपकी Supabase प्रोजेक्ट की जानकारी
const SUPABASE_URL = 'https://sjfglhxjdyvcygunijvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === ग्लोबल वेरिएबल्स ===
let currentStream;
let currentAadhaarForPhoto;
let cropper;

// === हेल्पर फंक्शन: Toast नोटिफिकेशन ===
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toast.innerHTML = `<i class="${iconClass}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    // सभी HTML एलिमेंट्स का रेफरेंस
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const loginSection = document.getElementById('login-section');
    const publicSearchForm = document.getElementById('public-search-form');
    const adminSearchForm = document.getElementById('admin-search-form');
    const loginForm = document.getElementById('login-form');
    const downloadTemplateBtn = document.getElementById('download-template-btn');
    const uploadCsvBtn = document.getElementById('upload-csv-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cameraSelect = document.getElementById('camera-select');
    const captureUploadBtn = document.getElementById('capture-upload-btn');
    
    // सभी इवेंट लिस्नर
    if (loginButton) loginButton.addEventListener('click', () => { loginSection.style.display = loginSection.style.display === 'block' ? 'none' : 'block'; });
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (publicSearchForm) publicSearchForm.addEventListener('submit', handlePublicSearch);
    if (adminSearchForm) adminSearchForm.addEventListener('submit', handleAdminSearch);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', downloadCSVTemplate);
    if (uploadCsvBtn) uploadCsvBtn.addEventListener('click', uploadCSV);
    if (closeModalBtn) closeModalBtn.addEventListener('click', stopCameraAndDestroyCropper);
    if (cameraSelect) cameraSelect.addEventListener('change', startCamera);
    if (captureUploadBtn) captureUploadBtn.addEventListener('click', captureAndUpload);

    checkUserSession();
});


// === NEW DASHBOARD LOGIC ===

// 1. Function to show the main table view
function showTableView() {
    document.getElementById('table-view').style.display = 'block';
    document.getElementById('detail-view').style.display = 'none';
}

// 2. Function to show the detail/edit view for a single farmer
async function viewFarmerDetails(aadhaarNumber) {
    const detailViewContainer = document.getElementById('detail-view');
    detailViewContainer.innerHTML = '<div>Loading Details...</div>';
    
    const { data: item, error } = await supabaseClient
        .from('farmers')
        .select('*')
        .eq('aadhaar_number', aadhaarNumber)
        .single();

    if (error || !item) {
        showToast('Could not fetch farmer details.', 'error');
        return;
    }

    document.getElementById('table-view').style.display = 'none';
    detailViewContainer.style.display = 'block';
    
    const photoLink = getGoogleDriveEmbedLink(item.photo_link);
    const imgSrc = photoLink || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    const formattedExpireDate = item.application_expire ? new Date(item.application_expire).toISOString().split('T')[0] : '';
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = `card-${item.aadhaar_number}`;
    card.innerHTML = `
        <button onclick="showTableView()" class="cancel-btn" style="float: right;"><i class="fas fa-arrow-left"></i> Back to List</button>
        <div class="card-header"><img id="photo-${item.aadhaar_number}" src="${imgSrc}" alt="Farmer Photo" class="farmer-photo"><div class="card-header-text"><h4>${item.name || 'N/A'}</h4></div></div>
        <div class="details-grid">
            <h5 class="group-title">Personal Details</h5>
            <p><strong>Aadhaar Number:</strong><span class="readonly-field">${item.aadhaar_number || ''}</span></p>
            <p><strong>Name:</strong><input type="text" id="name-${item.aadhaar_number}" value="${item.name || ''}"></p>
            <p><strong>Father's Name:</strong><input type="text" id="father_name-${item.aadhaar_number}" value="${item.father_name || ''}"></p>
            <p><strong>Gender:</strong><input type="text" id="gender-${item.aadhaar_number}" value="${item.gender || ''}"></p>
            <p><strong>Age:</strong><input type="text" id="age-${item.aadhaar_number}" value="${item.age || ''}"></p>
            <p><strong>Marriage Status:</strong><input type="text" id="marriage_status-${item.aadhaar_number}" value="${item.marriage_status || ''}"></p>
            <p><strong>Category:</strong><input type="text" id="category-${item.aadhaar_number}" value="${item.category || ''}"></p>
            <h5 class="group-title">Contact & Address</h5>
            <p><strong>Mobile Number:</strong><input type="text" id="mobile_number-${item.aadhaar_number}" value="${item.mobile_number || ''}"></p>
            <p><strong>WhatsApp Number:</strong><input type="text" id="whatsapp_number-${item.aadhaar_number}" value="${item.whatsapp_number || ''}"></p>
            <p style="grid-column: 1 / -1;"><strong>Address:</strong><input type="text" id="address-${item.aadhaar_number}" value="${item.address || ''}"></p>
            <h5 class="group-title">Financial & Application Details</h5>
            <p><strong>BL Number:</strong><input type="text" id="bl_number-${item.aadhaar_number}" value="${item.bl_number || ''}"></p>
            <p><strong>Account Number:</strong><input type="text" id="account_number-${item.aadhaar_number}" value="${item.account_number || ''}"></p>
            <p><strong>Share Capital:</strong><input type="text" id="share_capital-${item.aadhaar_number}" value="${item.share_capital || ''}"></p>
            <p><strong>Application Year:</strong><input type="text" id="application_year-${item.aadhaar_number}" value="${item.application_year || ''}"></p>
            <p><strong>Application Expire:</strong><input type="date" id="application_expire-${item.aadhaar_number}" value="${formattedExpireDate}"></p>
            <h5 class="group-title">Nominee Details</h5>
            <p><strong>Nominee Name:</strong><input type="text" id="nominee_name-${item.aadhaar_number}" value="${item.nominee_name || ''}"></p>
            <p><strong>Relation:</strong><input type="text" id="relation-${item.aadhaar_number}" value="${item.relation || ''}"></p>
            <p><strong>Nominee Aadhaar:</strong><input type="text" id="nominee_aadhaar_number-${item.aadhaar_number}" value="${item.nominee_aadhaar_number || ''}"></p>
            <div class="card-actions">
                <button onclick="updateRecord('${item.aadhaar_number}')"><i class="fas fa-save"></i> Save Changes</button>
                <button onclick="openCameraModal('${item.aadhaar_number}')"><i class="fas fa-camera"></i> Update Photo</button>
                <button class="delete-btn" onclick="deleteRecord('${item.aadhaar_number}')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>`;
    detailViewContainer.innerHTML = ''; // Clear "Loading..."
    detailViewContainer.appendChild(card);
}

// 3. Function to load and render the main farmer table
async function loadAndDisplayFarmerTable(filters = []) {
    const tableContainer = document.getElementById('farmer-table-container');
    tableContainer.innerHTML = '<div>Loading farmer list...</div>';

    let query = supabaseClient.from('farmers').select('aadhaar_number, name, father_name, mobile_number, bl_number');
    if (filters.length > 0) {
        query = query.or(filters.join(','));
    }
    query = query.order('name', { ascending: true }); // Sort by name

    const { data, error } = await query;
    if (error) { showToast(`Error fetching data: ${error.message}`, 'error'); tableContainer.innerHTML = ''; return; }
    if (!data || data.length === 0) { tableContainer.innerHTML = '<p>No matching records found.</p>'; return; }

    const table = document.createElement('table');
    table.className = 'farmer-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Name</th>
                <th>Father's Name</th>
                <th>Aadhaar Number</th>
                <th>Mobile Number</th>
                <th>BL Number</th>
                <th class="action-cell">Actions</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(item => `
                <tr>
                    <td>${item.name || ''}</td>
                    <td>${item.father_name || ''}</td>
                    <td>${item.aadhaar_number || ''}</td>
                    <td>${item.mobile_number || ''}</td>
                    <td>${item.bl_number || ''}</td>
                    <td class="action-cell">
                        <button class="view-btn" onclick="viewFarmerDetails('${item.aadhaar_number}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `).join('')}
        </tbody>`;
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}


// === UPDATED HANDLER FUNCTIONS ===
async function handleAdminSearch(e) {
    e.preventDefault();
    const aadhaar = document.getElementById('admin-aadhaar-search').value.trim();
    const account = document.getElementById('admin-account-search').value.trim();
    const name = document.getElementById('admin-name-search').value.trim();
    const bl = document.getElementById('admin-bl-search').value.trim();
    const fatherName = document.getElementById('admin-father-search').value.trim();
    const filters = [];
    if (aadhaar) filters.push(`aadhaar_number.eq.${aadhaar}`);
    if (account) filters.push(`account_number.eq.${account}`);
    if (bl) filters.push(`bl_number.eq.${bl}`);
    if (name) filters.push(`name.ilike.*${name}*`);
    if (fatherName) filters.push(`father_name.ilike.*${fatherName}*`);
    
    // Call the main table display function with the filters
    loadAndDisplayFarmerTable(filters);
}

async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const loginSection = document.getElementById('login-section');
    const publicSection = document.getElementById('public-section');
    const dashboardSection = document.getElementById('dashboard-section');

    if (session) {
        publicSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        loginSection.style.display = 'none';
        showTableView(); // Show the table by default
        loadAndDisplayFarmerTable(); // Load all farmers
    } else {
        publicSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
    }
}


// === Existing Functions (Unchanged but included for completeness) ===
async function handlePublicSearch(e) { e.preventDefault(); const aadhaarNumber = document.getElementById('public-aadhaar-search').value.trim(); if (!aadhaarNumber) return; const publicResultsContainer = document.getElementById('public-results-container'); publicResultsContainer.innerHTML = '<div>Searching...</div>'; const { data, error } = await supabaseClient.from('farmers').select('name, father_name, bl_number').eq('aadhaar_number', aadhaarNumber).single(); if (error || !data) { publicResultsContainer.innerHTML = '<p class="error">No record found.</p>'; } else { publicResultsContainer.innerHTML = `<div class="card" style="grid-template-columns: 1fr;"><div class="card-header-text"><h4>${data.name}</h4><p><strong>Father's Name:</strong> ${data.father_name}</p><p><strong>BL Number:</strong> ${data.bl_number}</p></div></div>`; } }
async function updateRecord(aadhaarNumber) { const updates = { name: document.getElementById(`name-${aadhaarNumber}`).value, father_name: document.getElementById(`father_name-${aadhaarNumber}`).value, bl_number: document.getElementById(`bl_number-${aadhaarNumber}`).value, gender: document.getElementById(`gender-${aadhaarNumber}`).value, share_capital: document.getElementById(`share_capital-${aadhaarNumber}`).value, address: document.getElementById(`address-${aadhaarNumber}`).value, age: document.getElementById(`age-${aadhaarNumber}`).value, marriage_status: document.getElementById(`marriage_status-${aadhaarNumber}`).value, mobile_number: document.getElementById(`mobile_number-${aadhaarNumber}`).value, category: document.getElementById(`category-${aadhaarNumber}`).value, account_number: document.getElementById(`account_number-${aadhaarNumber}`).value, application_year: document.getElementById(`application_year-${aadhaarNumber}`).value, application_expire: document.getElementById(`application_expire-${aadhaarNumber}`).value, nominee_name: document.getElementById(`nominee_name-${aadhaarNumber}`).value, relation: document.getElementById(`relation-${aadhaarNumber}`).value, nominee_aadhaar_number: document.getElementById(`nominee_aadhaar_number-${aadhaarNumber}`).value, whatsapp_number: document.getElementById(`whatsapp_number-${aadhaarNumber}`).value, }; if (!updates.application_expire) { updates.application_expire = null; } const { error } = await supabaseClient.from('farmers').update(updates).eq('aadhaar_number', aadhaarNumber); if (error) { showToast(`Update failed: ${error.message}`, 'error'); } else { showToast('Record updated successfully!', 'success'); } }
async function deleteRecord(aadhaarNumber) { if (confirm('Are you sure you want to delete this record?')) { const { error } = await supabaseClient.from('farmers').delete().eq('aadhaar_number', aadhaarNumber); if (error) { showToast(`Delete failed: ${error.message}`, 'error'); } else { showToast('Record deleted successfully!', 'success'); showTableView(); loadAndDisplayFarmerTable(); } } }
async function handleLogin(e) { e.preventDefault(); const email = document.getElementById('email').value; const password = document.getElementById('password').value; const { error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { showToast(error.message, 'error'); } else { showToast('Login Successful!', 'success'); checkUserSession(); } }
async function handleLogout() { await supabaseClient.auth.signOut(); showToast('You have been logged out.', 'success'); checkUserSession(); }
function downloadCSVTemplate() { const headers = "aadhaar_number,name,father_name,bl_number,gender,share_capital,address,age,marriage_status,mobile_number,category,account_number,application_year,application_expire,nominee_name,relation,nominee_aadhaar_number,whatsapp_number"; const link = document.createElement("a"); link.setAttribute("href", 'data:text/csv;charset=utf-8,' + encodeURI(headers)); link.setAttribute("download", "farmers_template.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); }
async function uploadCSV() { const file = document.getElementById('csv-file-input').files[0]; if (!file) { showToast('Please select a CSV file first.', 'error'); return; } showToast(`Processing file... Please wait.`, 'success'); Papa.parse(file, { header: true, skipEmptyLines: true, complete: async function(results) { const dataToInsert = results.data; if (dataToInsert.length === 0) { showToast('File is empty or invalid.', 'error'); return; } let successCount = 0; let errorCount = 0; for (const row of dataToInsert) { if (row.aadhaar_number) { const { error } = await supabaseClient.rpc('upsert_farmer_conditionally', { new_data: row }); if (error) { console.error('Upsert error for', row.aadhaar_number, error); errorCount++; } else { successCount++; } } } showToast(`Process complete! ${successCount} records processed, ${errorCount} failed.`, 'success'); loadAndDisplayFarmerTable(); } }); }
async function populateCameraList() { /* ... same as before ... */ }
async function startCamera() { /* ... same as before ... */ }
async function cropAndUploadImage() { /* ... same as before ... */ }
function stopCameraAndDestroyCropper() { /* ... same as before ... */ }
function getGoogleDriveEmbedLink(driveLink) { /* ... same as before ... */ }
// Global functions
window.updateRecord = updateRecord; window.deleteRecord = deleteRecord; window.openCameraModal = openCameraModal; window.viewFarmerDetails = viewFarmerDetails; window.showTableView = showTableView;
