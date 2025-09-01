// आपकी Supabase प्रोजेक्ट की जानकारी
const SUPABASE_URL = 'https://sjfglhxjdyvcygunijvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === कैमरा के लिए ग्लोबल वेरिएबल्स ===
let currentStream;
let currentAadhaarForPhoto;
const cameraModal = document.getElementById('camera-modal');
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const cameraSelect = document.getElementById('camera-select');
const uploadPhotoBtn = document.getElementById('upload-photo-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cameraUploadStatus = document.getElementById('camera-upload-status');

// हेल्पर फंक्शन: गूगल ड्राइव लिंक को इमेज में बदलने के लिए
function getDriveImageSrc(url) {
    if (!url || typeof url !== 'string') {
        return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // खाली इमेज
    }
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/uc?id=${fileId}`;
    }
    return url;
}

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
    publicSearchForm.addEventListener('submit', async (e) => { e.preventDefault(); const aadhaarNumber = document.getElementById('public-aadhaar-search').value.trim(); if (!aadhaarNumber) return; publicResultsContainer.innerHTML = '<p>Searching...</p>'; const { data, error } = await supabaseClient.from('farmers').select('name, father_name, bl_number').eq('aadhaar_number', aadhaarNumber).single(); if (error || !data) { publicResultsContainer.innerHTML = '<p class="error">No record found.</p>'; } else { publicResultsContainer.innerHTML = `<div class="card"><p><strong>Name:</strong> ${data.name}</p><p><strong>Father's Name:</strong> ${data.father_name}</p><p><strong>BL Number:</strong> ${data.bl_number}</p></div>`; } });

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
        if (error) { dashboardResultsContainer.innerHTML = `<p class="error">Error fetching data: ${error.message}</p>`; return; }
        if (!data || data.length === 0) { dashboardResultsContainer.innerHTML = '<p>No matching records found.</p>'; return; }
        
        dashboardResultsContainer.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.id = `card-${item.aadhaar_number}`;
            const imgSrc = getDriveImageSrc(item.photo_link);

            card.innerHTML = `
                <div style="display: flex; align-items: flex-start;">
                    <img id="photo-${item.aadhaar_number}" src="${imgSrc}" alt="Farmer Photo" class="farmer-photo">
                    <div style="flex-grow: 1;">
                        <h4>Editing Record for: ${item.name}</h4>
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
                        <button class="delete-btn" onclick="deleteRecord('${item.aadhaar_number}')">Delete</button>
                        <button onclick="openCameraModal('${item.aadhaar_number}')">Update Photo</button>
                    </div>
                </div>`;
            dashboardResultsContainer.appendChild(card);
        });
    });

    // बाकी सभी इवेंट लिस्नर
    loginForm.addEventListener('submit', async (e) => { e.preventDefault(); const email = document.getElementById('email').value; const password = document.getElementById('password').value; const { error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { authError.textContent = error.message; } else { authError.textContent = ''; checkUserSession(); } });
    loginButton.addEventListener('click', () => { loginSection.style.display = loginSection.style.display === 'block' ? 'none' : 'block'; });
    logoutButton.addEventListener('click', async () => { await supabaseClient.auth.signOut(); checkUserSession(); });
    downloadTemplateBtn.addEventListener('click', () => { const headers = "aadhaar_number,name,father_name,bl_number,gender,share_capital,address,age,marriage_status,mobile_number,category,account_number,application_year,application_expire,nominee_name,relation,nominee_aadhaar_number,whatsapp_number"; const csvContent = "data:text/csv;charset=utf-8," + headers; const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "farmers_template.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); });
    uploadCsvBtn.addEventListener('click', () => { const file = csvFileInput.files[0]; if (!file) { uploadStatus.innerHTML = `<p style="color: red;">Please select a CSV file first.</p>`; return; } uploadStatus.innerHTML = `<p>Parsing file...</p>`; Papa.parse(file, { header: true, skipEmptyLines: true, complete: async function(results) { const dataToInsert = results.data; if (dataToInsert.length === 0) { uploadStatus.innerHTML = `<p style="color: red;">The selected file is empty or invalid.</p>`; return; } uploadStatus.innerHTML = `<p>File parsed. Found ${dataToInsert.length} records. Uploading...</p>`; const { error } = await supabaseClient.from('farmers').insert(dataToInsert); if (error) { uploadStatus.innerHTML = `<p style="color: red;">Error uploading data: ${error.message}</p>`; } else { uploadStatus.innerHTML = `<p style="color: green;">Successfully added ${dataToInsert.length} new farmers!</p>`; csvFileInput.value = ''; } }, error: function(error) { uploadStatus.innerHTML = `<p style="color: red;">Error parsing file: ${error.message}</p>`; } }); });

    // कैमरा मॉडल के इवेंट लिस्नर
    closeModalBtn.addEventListener('click', stopCamera);
    cameraSelect.addEventListener('change', startCamera);
    uploadPhotoBtn.addEventListener('click', handlePhotoUpload);

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

// === कैमरा फंक्शन्स ===
async function openCameraModal(aadhaarNumber) { currentAadhaarForPhoto = aadhaarNumber; cameraModal.style.display = 'flex'; cameraUploadStatus.innerHTML = ''; uploadPhotoBtn.disabled = false; await populateCameraList(); await startCamera(); }
async function populateCameraList() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const videoDevices = devices.filter(device => device.kind === 'videoinput'); cameraSelect.innerHTML = ''; videoDevices.forEach((device, index) => { const option = document.createElement('option'); option.value = device.deviceId; option.text = device.label || `Camera ${index + 1}`; cameraSelect.appendChild(option); }); } catch (e) { console.error("Could not list devices:", e); } }
async function startCamera() { if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); } const constraints = { video: { deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } } }; try { currentStream = await navigator.mediaDevices.getUserMedia(constraints); videoElement.srcObject = currentStream; } catch (e) { console.error("Error starting camera:", e); cameraUploadStatus.innerHTML = `<p style="color: red;">Could not start camera. Please check permissions.</p>`; } }
function stopCamera() { if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); } cameraModal.style.display = 'none'; }
async function handlePhotoUpload() { uploadPhotoBtn.disabled = true; cameraUploadStatus.innerHTML = '<p>Capturing and preparing image...</p>'; const context = canvasElement.getContext('2d'); context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height); canvasElement.toBlob(async (blob) => { if (!blob) { cameraUploadStatus.innerHTML = '<p style="color: red;">Failed to capture image.</p>'; uploadPhotoBtn.disabled = false; return; } cameraUploadStatus.innerHTML = '<p>Image captured. Uploading...</p>'; const { data, error } = await supabaseClient.functions.invoke('upload-to-drive', { body: blob, headers: { 'Content-Type': 'image/jpeg' } }); if (error || !data || !data.photoLink) { cameraUploadStatus.innerHTML = `<p style="color: red;">Upload Failed: ${error ? error.message : 'No link returned'}</p>`; uploadPhotoBtn.disabled = false; return; } const newPhotoLink = data.photoLink; cameraUploadStatus.innerHTML = '<p style="color: green;">Upload successful! Saving link...</p>'; const { error: updateError } = await supabaseClient.from('farmers').update({ photo_link: newPhotoLink }).eq('aadhaar_number', currentAadhaarForPhoto); if (updateError) { cameraUploadStatus.innerHTML = `<p style="color: red;">Failed to save new link: ${updateError.message}</p>`; } else { cameraUploadStatus.innerHTML = '<p style="color: green;">All done!</p>'; document.getElementById(`photo-${currentAadhaarForPhoto}`).src = getDriveImageSrc(newPhotoLink); setTimeout(stopCamera, 1500); } }, 'image/jpeg', 0.9); }

// === ग्लोबल फंक्शन्स ===
async function updateRecord(aadhaarNumber) { const updates = { aadhaar_number: document.getElementById(`aadhaar_number-${aadhaarNumber}`).value, name: document.getElementById(`name-${aadhaarNumber}`).value, father_name: document.getElementById(`father_name-${aadhaarNumber}`).value, bl_number: document.getElementById(`bl_number-${aadhaarNumber}`).value, gender: document.getElementById(`gender-${aadhaarNumber}`).value, share_capital: document.getElementById(`share_capital-${aadhaarNumber}`).value, address: document.getElementById(`address-${aadhaarNumber}`).value, age: document.getElementById(`age-${aadhaarNumber}`).value, marriage_status: document.getElementById(`marriage_status-${aadhaarNumber}`).value, mobile_number: document.getElementById(`mobile_number-${aadhaarNumber}`).value, category: document.getElementById(`category-${aadhaarNumber}`).value, account_number: document.getElementById(`account_number-${aadhaarNumber}`).value, application_year: document.getElementById(`application_year-${aadhaarNumber}`).value, nominee_name: document.getElementById(`nominee_name-${aadhaarNumber}`).value, relation: document.getElementById(`relation-${aadhaarNumber}`).value, nominee_aadhaar_number: document.getElementById(`nominee_aadhaar_number-${aadhaarNumber}`).value, whatsapp_number: document.getElementById(`whatsapp_number-${aadhaarNumber}`).value, }; const { error } = await supabaseClient.from('farmers').update(updates).eq('aadhaar_number', aadhaarNumber); if (error) { alert('Update failed: ' + error.message); } else { alert('Record updated successfully!'); } }
async function deleteRecord(aadhaarNumber) { const confirmation = confirm('Are you sure you want to delete this record? This action cannot be undone.'); if (confirmation) { const { error } = await supabaseClient.from('farmers').delete().eq('aadhaar_number', aadhaarNumber); if (error) { alert('Delete failed: ' + error.message); } else { alert('Record deleted successfully!'); document.getElementById(`card-${aadhaarNumber}`).remove(); } } }
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.openCameraModal = openCameraModal;
