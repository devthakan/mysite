// आपकी Supabase प्रोजेक्ट की जानकारी
const SUPABASE_URL = 'https://sjfglhxjdyvcygunijvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === ग्लोबल वेरिएबल्स ===
let currentStream;
let currentAadhaarForPhoto;
let cropper;

// कैमरा मॉडल के एलिमेंट्स
const cameraModal = document.getElementById('camera-modal');
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const cameraSelect = document.getElementById('camera-select');
const captureBtn = document.getElementById('capture-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// क्रॉपिंग मॉडल के एलिमेंट्स
const cropModal = document.getElementById('crop-modal');
const imageToCrop = document.getElementById('image-to-crop');
const cropAndUploadBtn = document.getElementById('crop-upload-btn');
const cropCancelBtn = document.getElementById('crop-cancel-btn');
const cropUploadStatus = document.getElementById('crop-upload-status');


document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const loginSection = document.getElementById('login-section');
    const publicSection = document.getElementById('public-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const publicSearchForm = document.getElementById('public-search-form');
    const adminSearchForm = document.getElementById('admin-search-form');
    const loginForm = document.getElementById('login-form');
    const downloadTemplateBtn = document.getElementById('download-template-btn');
    const uploadCsvBtn = document.getElementById('upload-csv-btn');

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


function openCameraModal(aadhaarNumber) {
    currentAadhaarForPhoto = aadhaarNumber;
    cameraModal.style.display = 'flex';
    populateCameraList().then(startCamera);
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    cameraModal.style.display = 'none';
}

function capturePhotoAndOpenCropper() {
    canvasElement.getContext('2d').drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    const imageDataUrl = canvasElement.toDataURL('image/jpeg');
    
    stopCamera();
    cropModal.style.display = 'flex';
    cropUploadStatus.innerHTML = '';
    imageToCrop.src = imageDataUrl;

    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(imageToCrop, {
        aspectRatio: 1 / 1,
        viewMode: 1,
        dragMode: 'move',
        background: false,
        autoCropArea: 0.8,
    });
}

function cancelCropping() {
    cropModal.style.display = 'none';
    if (cropper) {
        cropper.destroy();
    }
}

function cropAndUploadImage() {
    if (!cropper) return;

    cropUploadStatus.innerHTML = '<p>Cropping and compressing image...</p>';
    cropAndUploadBtn.disabled = true;

    const croppedCanvas = cropper.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingQuality: 'high',
    });

    croppedCanvas.toBlob(async (blob) => {
        if (!blob) {
            alert('Cropping failed.');
            cropAndUploadBtn.disabled = false;
            return;
        }

        cropUploadStatus.innerHTML = '<p>Uploading to Supabase Storage...</p>';
        const fileName = `${currentAadhaarForPhoto}_${Date.now()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('farmer-photos')
            .upload(fileName, blob, { upsert: false });

        if (uploadError) {
            cropUploadStatus.innerHTML = `<p style="color: red;">Upload Failed: ${uploadError.message}</p>`;
            cropAndUploadBtn.disabled = false;
            return;
        }

        cropUploadStatus.innerHTML = '<p style="color: green;">Upload successful! Saving link...</p>';
        const { data: urlData } = supabaseClient.storage.from('farmer-photos').getPublicUrl(uploadData.path);
        const newPhotoLink = urlData.publicUrl;

        const { error: updateError } = await supabaseClient
            .from('farmers')
            .update({ photo_link: newPhotoLink })
            .eq('aadhaar_number', currentAadhaarForPhoto);

        if (updateError) {
            cropUploadStatus.innerHTML = `<p style="color: red;">Failed to save link: ${updateError.message}</p>`;
        } else {
            cropUploadStatus.innerHTML = '<p style="color: green;">All done!</p>';
            document.getElementById(`photo-${currentAadhaarForPhoto}`).src = newPhotoLink;
            setTimeout(cancelCropping, 1500);
        }
        cropAndUploadBtn.disabled = false;
    }, 'image/jpeg', 0.8);
}

async function populateCameraList() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const videoDevices = devices.filter(device => device.kind === 'videoinput'); const cameraSelect = document.getElementById('camera-select'); cameraSelect.innerHTML = ''; videoDevices.forEach((device, index) => { const option = document.createElement('option'); option.value = device.deviceId; option.text = device.label || `Camera ${index + 1}`; cameraSelect.appendChild(option); }); } catch (e) { console.error("Could not list devices:", e); } }
async function startCamera() { if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); } const cameraSelect = document.getElementById('camera-select'); const constraints = { video: { deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } } }; try { currentStream = await navigator.mediaDevices.getUserMedia(constraints); videoElement.srcObject = currentStream; } catch (e) { console.error("Error starting camera:", e); } }

async function handlePublicSearch(e) { e.preventDefault(); const aadhaarNumber = document.getElementById('public-aadhaar-search').value.trim(); if (!aadhaarNumber) return; const publicResultsContainer = document.getElementById('public-results-container'); publicResultsContainer.innerHTML = '<p>Searching...</p>'; const { data, error } = await supabaseClient.from('farmers').select('name, father_name, bl_number').eq('aadhaar_number', aadhaarNumber).single(); if (error || !data) { publicResultsContainer.innerHTML = '<p class="error">No record found.</p>'; } else { publicResultsContainer.innerHTML = `<div class="card"><p><strong>Name:</strong> ${data.name}</p><p><strong>Father's Name:</strong> ${data.father_name}</p><p><strong>BL Number:</strong> ${data.bl_number}</p></div>`; } }

async function handleAdminSearch(e) {
    e.preventDefault();
    const dashboardResultsContainer = document.getElementById('dashboard-results-container');
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
        const imgSrc = item.photo_link || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        card.innerHTML = `
            <div style="display: flex; align-items: flex-start;">
                <img id="photo-${item.aadhaar_number}" src="${imgSrc}" alt="Farmer Photo" class="farmer-photo">
                <div style="flex-grow: 1;">
                    <h4>Editing Record for: ${item.name || 'N/A'}</h4>
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
}

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

async function deleteRecord(aadhaarNumber) { const confirmation = confirm('Are you sure you want to delete this record? This action cannot be undone.'); if (confirmation) { const { error } = await supabaseClient.from('farmers').delete().eq('aadhaar_number', aadhaarNumber); if (error) { alert('Delete failed: ' + error.message); } else { alert('Record deleted successfully!'); document.getElementById(`card-${aadhaarNumber}`).remove(); } } }
async function handleLogin(e) { e.preventDefault(); const authError = document.getElementById('auth-error'); const email = document.getElementById('email').value; const password = document.getElementById('password').value; const { error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { authError.textContent = error.message; } else { authError.textContent = ''; checkUserSession(); } }
async function handleLogout() { await supabaseClient.auth.signOut(); checkUserSession(); }
function downloadCSVTemplate() { const headers = "aadhaar_number,name,father_name,bl_number,gender,share_capital,address,age,marriage_status,mobile_number,category,account_number,application_year,application_expire,nominee_name,relation,nominee_aadhaar_number,whatsapp_number"; const csvContent = "data:text/csv;charset=utf-8," + headers; const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "farmers_template.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); }
function uploadCSV() { const csvFileInput = document.getElementById('csv-file-input'); const uploadStatus = document.getElementById('upload-status'); const file = csvFileInput.files[0]; if (!file) { uploadStatus.innerHTML = `<p style="color: red;">Please select a CSV file first.</p>`; return; } uploadStatus.innerHTML = `<p>Parsing file...</p>`; Papa.parse(file, { header: true, skipEmptyLines: true, complete: async function(results) { const dataToInsert = results.data; if (dataToInsert.length === 0) { uploadStatus.innerHTML = `<p style="color: red;">The selected file is empty or invalid.</p>`; return; } uploadStatus.innerHTML = `<p>File parsed. Found ${dataToInsert.length} records. Uploading...</p>`; const { error } = await supabaseClient.from('farmers').insert(dataToInsert); if (error) { uploadStatus.innerHTML = `<p style="color: red;">Error uploading data: ${error.message}</p>`; } else { uploadStatus.innerHTML = `<p style="color: green;">Successfully added ${dataToInsert.length} new farmers!</p>`; csvFileInput.value = ''; } }, error: function(error) { uploadStatus.innerHTML = `<p style="color: red;">Error parsing file: ${error.message}</p>`; } }); }
async function checkUserSession() { const { data: { session } } = await supabaseClient.auth.getSession(); const loginButton = document.getElementById('login-button'); const logoutButton = document.getElementById('logout-button'); const loginSection = document.getElementById('login-section'); const publicSection = document.getElementById('public-section'); const dashboardSection = document.getElementById('dashboard-section'); if (session) { publicSection.style.display = 'none'; dashboardSection.style.display = 'block'; loginButton.style.display = 'none'; logoutButton.style.display = 'block'; loginSection.style.display = 'none'; } else { publicSection.style.display = 'block'; dashboardSection.style.display = 'none'; loginButton.style.display = 'block'; logoutButton.style.display = 'none'; } }

// ग्लोबल फंक्शन्स को विंडो ऑब्जेक्ट से जोड़ना
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.openCameraModal = openCameraModal;
