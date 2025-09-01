// आपकी Supabase प्रोजेक्ट की जानकारी
const SUPABASE_URL = 'https://sjfglhxjdyvcygunijvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM';
const FOLDER_ID = "16RDylvBe--mJ66Mlt1L8AdM-yh179CHj"; // आपका Google Drive Folder ID

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginSection = document.getElementById('login-section');
const publicView = document.getElementById('public-view');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const publicDataContainer = document.getElementById('public-data-container');
const dashboardDataContainer = document.getElementById('dashboard-data-container');
const authError = document.getElementById('auth-error');

// कैमरा Modal के Elements
const cameraModal = document.getElementById('camera-modal');
const video = document.getElementById('video');
const clickPhotoButton = document.getElementById('click-photo');
const canvas = document.getElementById('canvas');
const uploadPhotoButton = document.getElementById('upload-photo');
const closeModalButton = document.getElementById('close-modal');
const uploadStatus = document.getElementById('upload-status');
let currentRecordId = null;
let imageBlob = null;


// =================================================================
// 1. पब्लिक डेटा दिखाने का फंक्शन
// =================================================================
async function loadPublicData() {
    const { data, error } = await supabase
        .from('farmers')
        .select('name, father_name, bl_number, photo_link');

    if (error) {
        console.error('Error fetching public data:', error);
        return;
    }

    publicDataContainer.innerHTML = ''; // Clear previous data
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <img src="${item.photo_link || 'default_avatar.png'}" alt="photo">
            <h3>${item.name}</h3>
            <p><strong>Father's Name:</strong> ${item.father_name}</p>
            <p><strong>BL Number:</strong> ${item.bl_number}</p>
        `;
        publicDataContainer.appendChild(div);
    });
}

// =================================================================
// 2. डैशबोर्ड का पूरा डेटा दिखाने का फंक्शन
// =================================================================
async function loadDashboardData() {
    const { data, error } = await supabase
        .from('farmers')
        .select('*'); // सारा डेटा सेलेक्ट करें

    if (error) {
        console.error('Error fetching dashboard data:', error);
        alert('डेटा लोड करने में विफल: ' + error.message);
        return;
    }

    dashboardDataContainer.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <img src="${item.photo_link || 'default_avatar.png'}" alt="photo" style="width:100px;">
            <p><strong>Name:</strong> <input type="text" id="name-${item.id}" value="${item.name || ''}"></p>
            <p><strong>Father's Name:</strong> <input type="text" id="father_name-${item.id}" value="${item.father_name || ''}"></p>
            <p><strong>Aadhaar:</strong> ${item.aadhaar_number || ''}</p>
            <p><strong>BL Number:</strong> <input type="text" id="bl_number-${item.id}" value="${item.bl_number || ''}"></p>
            <p><strong>Mobile:</strong> <input type="text" id="mobile_number-${item.id}" value="${item.mobile_number || ''}"></p>
            <p><strong>Address:</strong> <input type="text" id="address-${item.id}" value="${item.address || ''}"></p>
            <button onclick="updateRecord(${item.id})">Save</button>
            <button onclick="openCamera(${item.id})">Update Photo</button>
        `;
        dashboardDataContainer.appendChild(div);
    });
}


// =================================================================
// 3. डेटा अपडेट करने का फंक्शन
// =================================================================
async function updateRecord(id) {
    const updates = {
        name: document.getElementById(`name-${id}`).value,
        father_name: document.getElementById(`father_name-${id}`).value,
        bl_number: document.getElementById(`bl_number-${id}`).value,
        mobile_number: document.getElementById(`mobile_number-${id}`).value,
        address: document.getElementById(`address-${id}`).value,
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
// 4. लॉगिन और लॉगआउट के फंक्शन्स
// =================================================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authError.textContent = error.message;
    } else {
        authError.textContent = '';
        checkUserSession(); // लॉगिन सफल होने पर UI अपडेट करें
    }
});

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkUserSession(); // लॉगआउट होने पर UI अपडेट करें
});


// =================================================================
// 5. यूजर का सेशन चेक करने और UI बदलने का फंक्शन
// =================================================================
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // यूजर लॉग इन है
        loginSection.style.display = 'none';
        publicView.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadDashboardData();
    } else {
        // यूजर लॉग इन नहीं है
        loginSection.style.display = 'block';
        publicView.style.display = 'block';
        dashboardSection.style.display = 'none';
        loadPublicData();
    }
}

// =================================================================
// 6. कैमरा फंक्शन्स
// =================================================================

function openCamera(recordId) {
    currentRecordId = recordId;
    imageBlob = null;
    uploadPhotoButton.disabled = true;
    uploadStatus.textContent = '';

    cameraModal.style.display = 'flex';
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Error accessing camera: ", err);
            alert("Could not access the camera.");
        });
}

clickPhotoButton.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
        imageBlob = blob;
        uploadPhotoButton.disabled = false;
    }, 'image/jpeg');
});

closeModalButton.addEventListener('click', () => {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    cameraModal.style.display = 'none';
});

// =================================================================
// 7. Google Drive पर फोटो अपलोड फंक्शन (Edge Function का उपयोग करके)
// =================================================================

uploadPhotoButton.addEventListener('click', async () => {
    if (!imageBlob || !currentRecordId) return;

    uploadStatus.textContent = 'Uploading...';
    uploadPhotoButton.disabled = true;

    // Supabase Edge Function को कॉल करें
    const { data, error } = await supabase.functions.invoke('upload-to-drive', {
        body: imageBlob,
        headers: {
            'Content-Type': 'image/jpeg',
            'x-record-id': currentRecordId, // रिकॉर्ड आईडी भेजें
            'x-folder-id': FOLDER_ID // फोल्डर आईडी भेजें
        }
    });

    if (error) {
        uploadStatus.textContent = `Upload failed: ${error.message}`;
        console.error(error);
        uploadPhotoButton.disabled = false;
    } else {
        // फंक्शन से मिला नया फोटो लिंक
        const newPhotoLink = data.photoLink;
        // टेबल में लिंक अपडेट करें
        const { error: updateError } = await supabase
            .from('farmers')
            .update({ photo_link: newPhotoLink })
            .eq('id', currentRecordId);

        if (updateError) {
             uploadStatus.textContent = `Failed to update photo link: ${updateError.message}`;
        } else {
            uploadStatus.textContent = 'Photo uploaded and link updated successfully!';
            setTimeout(() => {
                closeModalButton.click();
                loadDashboardData(); // डेटा रिफ्रेश करें
            }, 2000);
        }
    }
});


// पेज लोड होने पर सेशन चेक करें
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
});

// इन फंक्शन्स को ग्लोबल स्कोप में रखना होगा ताकि HTML onclick उन्हें कॉल कर सके
window.updateRecord = updateRecord;
window.openCamera = openCamera;
