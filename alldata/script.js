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
    setTimeout(() => {
        toast.remove();
    }, 5000);
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
    const captureBtn = document.getElementById('capture-btn');
    const cropCancelBtn = document.getElementById('crop-cancel-btn');
    const cropAndUploadBtn = document.getElementById('crop-upload-btn');

    // सभी इवेंट लिस्नर
    closeModalBtn.addEventListener('click', stopCamera);
    cameraSelect.addEventListener('change', startCamera);
    captureBtn.addEventListener('click', capturePhotoAndOpenCropper);
    cropCancelBtn.addEventListener('click', cancelCropping);
    cropAndUploadBtn.addEventListener('click', cropAndUploadImage);
    publicSearchForm.addEventListener('submit', handlePublicSearch);
    adminSearchForm.addEventListener('submit', handleAdminSearch);
    loginForm.addEventListener('submit', handleLogin);
    loginButton.addEventListener('click', () => { loginSection.style.display = loginSection.style.display === 'block' ? 'none' : 'block'; });
    logoutButton.addEventListener('click', handleLogout);
    downloadTemplateBtn.addEventListener('click', downloadCSVTemplate);
    uploadCsvBtn.addEventListener('click', uploadCSV);

    checkUserSession();
});

// === फोटो और कैमरा के फंक्शन्स ===
function openCameraModal(aadhaarNumber) { currentAadhaarForPhoto = aadhaarNumber; document.getElementById('camera-modal').style.display = 'flex'; populateCameraList().then(startCamera); }
function stopCamera() { if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); } document.getElementById('camera-modal').style.display = 'none'; }
function capturePhotoAndOpenCropper() { const canvas = document.getElementById('canvas'); const video = document.getElementById('video'); canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); const imageDataUrl = canvas.toDataURL('image/jpeg'); stopCamera(); const cropModal = document.getElementById('crop-modal'); const imageToCrop = document.getElementById('image-to-crop'); cropModal.style.display = 'flex'; document.getElementById('crop-upload-status').innerHTML = ''; imageToCrop.src = imageDataUrl; if (cropper) cropper.destroy(); cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1, dragMode: 'move', background: false, autoCropArea: 0.8 }); }
function cancelCropping() { document.getElementById('crop-modal').style.display = 'none'; if (cropper) cropper.destroy(); }
async function cropAndUploadImage() { if (!cropper) return; const cropAndUploadBtn = document.getElementById('crop-upload-btn'); cropAndUploadBtn.disabled = true; const croppedCanvas = cropper.getCroppedCanvas({ width: 400, height: 400, imageSmoothingQuality: 'high' }); croppedCanvas.toBlob(async (blob) => { if (!blob) { showToast('Cropping failed.', 'error'); cropAndUploadBtn.disabled = false; return; } const fileName = `${currentAadhaarForPhoto}_${Date.now()}.jpg`; const { data: uploadData, error: uploadError } = await supabaseClient.storage.from('farmer-photos').upload(fileName, blob, { upsert: false }); if (uploadError) { showToast(`Upload Failed: ${uploadError.message}`, 'error'); cropAndUploadBtn.disabled = false; return; } const { data: urlData } = supabaseClient.storage.from('farmer-photos').getPublicUrl(uploadData.path); const newPhotoLink = urlData.publicUrl; const { error: updateError } = await supabaseClient.from('farmers').update({ photo_link: newPhotoLink }).eq('aadhaar_number', currentAadhaarForPhoto); if (updateError) { showToast(`Failed to save link: ${updateError.message}`, 'error'); } else { showToast('Photo updated successfully!', 'success'); document.getElementById(`photo-${currentAadhaarForPhoto}`).src = newPhotoLink; setTimeout(cancelCropping, 1500); } cropAndUploadBtn.disabled = false; }, 'image/jpeg', 0.8); }
async function populateCameraList() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const videoDevices = devices.filter(device => device.kind === 'videoinput'); const cameraSelect = document.getElementById('camera-select'); cameraSelect.innerHTML = ''; videoDevices.forEach((device, index) => { const option = document.createElement('option'); option.value = device.deviceId; option.text = device.label || `Camera ${index + 1}`; cameraSelect.appendChild(option); }); } catch (e) { console.error("Could not list devices:", e); } }
async function startCamera() { if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); } const cameraSelect = document.getElementById('camera-select'); const video = document.getElementById('video'); const constraints = { video: { deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } } }; try { currentStream = await navigator.mediaDevices.getUserMedia(constraints); video.srcObject = currentStream; } catch (e) { console.error("Error starting camera:", e); } }
function getGoogleDriveEmbedLink(driveLink) { if (!driveLink || driveLink.includes('supabase.co')) { return driveLink; } const match = driveLink.match(/\/d\/(.+?)(?:\/view|$)/); if (match && match[1]) { return `https://drive.google.com/uc?export=view&id=${match[1]}`; } return driveLink; }

// === डेटा और यूज़र मैनेजमेंट फंक्शन्स ===
async function handlePublicSearch(e) {
    e.preventDefault();
    const aadhaarNumber = document.getElementById('public-aadhaar-search').value.trim();
    if (!aadhaarNumber) return;
    const publicResultsContainer = document.getElementById('public-results-container');
    publicResultsContainer.innerHTML = '<div>Searching...</div>';
    const { data, error } = await supabaseClient.from('farmers').select('name, father_name, bl_number').eq('aadhaar_number', aadhaarNumber).single();
    if (error || !data) {
        publicResultsContainer.innerHTML = '<p class="error">No record found.</p>';
    } else {
        publicResultsContainer.innerHTML = `<div class="card" style="grid-template-columns: 1fr;"><div class="card-header-text"><h4>${data.name}</h4><p><strong>Father's Name:</strong> ${data.father_name}</p><p><strong>BL Number:</strong> ${data.bl_number}</p></div></div>`;
    }
}
async function handleAdminSearch(e) {
    e.preventDefault();
    const dashboardResultsContainer = document.getElementById('dashboard-results-container');
    dashboardResultsContainer.innerHTML = '<div>Searching...</div>';
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
    if (error) { showToast(`Error fetching data: ${error.message}`, 'error'); dashboardResultsContainer.innerHTML = ''; return; }
    if (!data || data.length === 0) { dashboardResultsContainer.innerHTML = '<p>No matching records found.</p>'; return; }
    dashboardResultsContainer.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${item.aadhaar_number}`;
        const photoLink = getGoogleDriveEmbedLink(item.photo_link);
        const imgSrc = photoLink || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        card.innerHTML = `<div class="card-header"><img id="photo-${item.aadhaar_number}" src="${imgSrc}" alt="Farmer Photo" class="farmer-photo"><div class="card-header-text"><h4>${item.name || 'N/A'}</h4></div></div><div class="details-grid"><h5 class="group-title">Personal Details</h5><p><strong>Aadhaar Number:</strong><span class="readonly-field">${item.aadhaar_number || ''}</span></p><p><strong>Name:</strong><input type="text" id="name-${item.aadhaar_number}" value="${item.name || ''}"></p><p><strong>Father's Name:</strong><input type="text" id="father_name-${item.aadhaar_number}" value="${item.father_name || ''}"></p><p><strong>Gender:</strong><input type="text" id="gender-${item.aadhaar_number}" value="${item.gender || ''}"></p><p><strong>Age:</strong><input type="text" id="age-${item.aadhaar_number}" value="${item.age || ''}"></p><p><strong>Marriage Status:</strong><input type="text" id="marriage_status-${item.aadhaar_number}" value="${item.marriage_status || ''}"></p><p><strong>Category:</strong><input type="text" id="category-${item.aadhaar_number}" value="${item.category || ''}"></p><h5 class="group-title">Contact & Address</h5><p><strong>Mobile Number:</strong><input type="text" id="mobile_number-${item.aadhaar_number}" value="${item.mobile_number || ''}"></p><p><strong>WhatsApp Number:</strong><input type="text" id="whatsapp_number-${item.aadhaar_number}" value="${item.whatsapp_number || ''}"></p><p style="grid-column: 1 / -1;"><strong>Address:</strong><input type="text" id="address-${item.aadhaar_number}" value="${item.address || ''}"></p><h5 class="group-title">Financial & Application Details</h5><p><strong>BL Number:</strong><input type="text" id="bl_number-${item.aadhaar_number}" value="${item.bl_number || ''}"></p><p><strong>Account Number:</strong><input type="text" id="account_number-${item.aadhaar_number}" value="${item.account_number || ''}"></p><p><strong>Share Capital:</strong><input type="text" id="share_capital-${item.aadhaar_number}" value="${item.share_capital || ''}"></p><p><strong>Application Year:</strong><input type="text" id="application_year-${item.aadhaar_number}" value="${item.application_year || ''}"></p><h5 class="group-title">Nominee Details</h5><p><strong>Nominee Name:</strong><input type="text" id="nominee_name-${item.aadhaar_number}" value="${item.nominee_name || ''}"></p><p><strong>Relation:</strong><input type="text" id="relation-${item.aadhaar_number}" value="${item.relation || ''}"></p><p><strong>Nominee Aadhaar:</strong><input type="text" id="nominee_aadhaar_number-${item.aadhaar_number}" value="${item.nominee_aadhaar_number || ''}"></p><div class="card-actions"><button onclick="updateRecord('${item.aadhaar_number}')"><i class="fas fa-save"></i> Save Changes</button><button onclick="openCameraModal('${item.aadhaar_number}')"><i class="fas fa-camera"></i> Update Photo</button><button class="delete-btn" onclick="deleteRecord('${item.aadhaar_number}')"><i class="fas fa-trash"></i> Delete</button></div></div>`;
        dashboardResultsContainer.appendChild(card);
    });
}
async function updateRecord(aadhaarNumber) {
    const updates = {
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
    if (error) { showToast(`Update failed: ${error.message}`, 'error'); } 
    else { showToast('Record updated successfully!', 'success'); }
}
async function deleteRecord(aadhaarNumber) { if (confirm('Are you sure you want to delete this record?')) { const { error } = await supabaseClient.from('farmers').delete().eq('aadhaar_number', aadhaarNumber); if (error) { showToast(`Delete failed: ${error.message}`, 'error'); } else { showToast('Record deleted successfully!', 'success'); document.getElementById(`card-${aadhaarNumber}`).remove(); } } }
async function handleLogin(e) { e.preventDefault(); const email = document.getElementById('email').value; const password = document.getElementById('password').value; const { error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { showToast(error.message, 'error'); } else { showToast('Login Successful!', 'success'); checkUserSession(); } }
async function handleLogout() { await supabaseClient.auth.signOut(); showToast('You have been logged out.', 'success'); checkUserSession(); }
function downloadCSVTemplate() { const headers = "aadhaar_number,name,father_name,bl_number,gender,share_capital,address,age,marriage_status,mobile_number,category,account_number,application_year,application_expire,nominee_name,relation,nominee_aadhaar_number,whatsapp_number"; const link = document.createElement("a"); link.setAttribute("href", 'data:text/csv;charset=utf-8,' + encodeURI(headers)); link.setAttribute("download", "farmers_template.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); }
function uploadCSV() { const file = document.getElementById('csv-file-input').files[0]; if (!file) { showToast('Please select a CSV file first.', 'error'); return; } Papa.parse(file, { header: true, skipEmptyLines: true, complete: async function(results) { const data = results.data; if (data.length === 0) { showToast('File is empty or invalid.', 'error'); return; } const { error } = await supabaseClient.from('farmers').insert(data); if (error) { showToast(`Upload Error: ${error.message}`, 'error'); } else { showToast(`Successfully added ${data.length} new farmers!`, 'success'); document.getElementById('csv-file-input').value = ''; } } }); }
async function checkUserSession() { const { data: { session } } = await supabaseClient.auth.getSession(); const loginButton = document.getElementById('login-button'); const logoutButton = document.getElementById('logout-button'); const loginSection = document.getElementById('login-section'); const publicSection = document.getElementById('public-section'); const dashboardSection = document.getElementById('dashboard-section'); if (session) { publicSection.style.display = 'none'; dashboardSection.style.display = 'block'; loginButton.style.display = 'none'; logoutButton.style.display = 'block'; loginSection.style.display = 'none'; } else { publicSection.style.display = 'block'; dashboardSection.style.display = 'none'; loginButton.style.display = 'block'; logoutButton.style.display = 'none'; } }

// ग्लोबल फंक्शन्स को विंडो ऑब्जेक्ट से जोड़ना
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.openCameraModal = openCameraModal;
