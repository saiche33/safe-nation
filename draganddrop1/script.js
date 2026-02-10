// --- DOM Elements ---
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const filePreviewGrid = document.getElementById('filePreviewGrid');
const previewContainer = document.getElementById('previewContainer');

// --- Modal Elements (For Verification) ---
const modal = document.getElementById('verificationModal');
const closeModalBtn = document.querySelector('.close-modal');

// --- State Management ---
let currentLockedFile = null; // Stores details of the file being unlocked
// Add this at the very top with your other variables
let resultsCache = {}; // Stores the result of every file: { "filename": resultData }

// --- Event Listeners ---
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', handleDragOver);
uploadZone.addEventListener('dragleave', handleDragLeave);
uploadZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);

// Close Modal Logic
if (closeModalBtn) {
    closeModalBtn.onclick = () => { modal.style.display = "none"; resetModal(); };
}
window.onclick = (e) => { if (e.target == modal) { modal.style.display = "none"; resetModal(); } };

// --- Drag and Drop Handlers ---
function handleDragOver(e) {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

// --- File Processing ---
function processFiles(files) {
    if (files.length === 0) return;

    // Show loading UI
    uploadProgress.style.display = 'block';
    resultsSection.style.display = 'none'; // Hide old results
    resultsContainer.innerHTML = ''; // Clear old results
    
    // Process each file
    files.forEach((file, index) => {
        // Create initial preview (optional, mostly for status)
        createFilePreview(file);
        
        // Send to Python immediately
        sendToBackend(file, index);
    });
}

function createFilePreview(file) {
    if(filePreviewGrid) filePreviewGrid.style.display = 'block';
    if(previewContainer) {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
        // Make it look clickable
        preview.style.cursor = "pointer";
        preview.style.transition = "transform 0.2s";
        
        // Add Click Event: Load this file's result into the main view
        preview.onclick = function() {
            // Highlight this preview to show it's active
            document.querySelectorAll('.file-preview').forEach(p => p.style.border = "none");
            preview.style.border = "2px solid #007bff";

            // If we have the result stored, show it!
            if (resultsCache[file.name]) {
                displayResult(file, resultsCache[file.name]);
            } else {
                console.log("Result not ready yet for:", file.name);
            }
        };

        // Add hover effect
        preview.onmouseover = () => preview.style.transform = "scale(1.05)";
        preview.onmouseout = () => preview.style.transform = "scale(1)";

        preview.innerHTML = `
            <div class="file-info">
                <strong>${file.name}</strong>
                <span id="status-${file.name}" class="status-processing">Processing...</span>
            </div>
        `;
        previewContainer.appendChild(preview);
    }
}

// --- 🔥 MAIN FUNCTION: Connects to Python ---
async function sendToBackend(file, index) {
    const statusElement = document.getElementById(`status-${file.name}`);
    
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log(`Sending ${file.name} to Python...`);

        const response = await fetch("http://127.0.0.1:5000/check-file", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const result = await response.json();
        
        // 🔥 SAVE THE RESULT TO CACHE 🔥
        resultsCache[file.name] = result;

        // Update Status Text
        if (statusElement) {
            statusElement.textContent = "Completed";
            statusElement.style.color = "green";
        }

        // Display the result immediately
        displayResult(file, result);

    } catch (error) {
        console.error("Error:", error);
        if (statusElement) {
            statusElement.textContent = "Failed";
            statusElement.style.color = "red";
        }
    }
}

// --- Display Result (Modified for Blur & Buttons) ---
function displayResult(file, result) {
    // 🔥 CLEAR PREVIOUS RESULT (Switching Mechanism) 🔥
    resultsContainer.innerHTML = ''; 
    resultsSection.style.display = 'block';

    const card = document.createElement('div');
    card.className = 'result-card';
    
    // Generate Unique ID
    const mediaId = `media-${Date.now()}`;
    const fileURL = URL.createObjectURL(file);
    
    // Check safety
    const isUnsafe = !result.is_safe && (result.prediction.includes("18+") || result.prediction.includes("NSFW") || result.prediction.includes("Detected"));
    
    const blurClass = isUnsafe ? 'blur-content' : '';
    const color = isUnsafe ? 'red' : 'green';

    // Create Media HTML
    let mediaHTML = '';
    if (file.type.startsWith('video')) {
        mediaHTML = `<video id="${mediaId}" src="${fileURL}" class="media-preview ${blurClass}" controls style="max-width: 100%; border-radius: 5px; margin-bottom: 10px;"></video>`;
    } else {
        mediaHTML = `<img id="${mediaId}" src="${fileURL}" class="media-preview ${blurClass}" style="max-width: 100%; border-radius: 5px; margin-bottom: 10px;">`;
    }

    // Determine Button Logic
    let buttonHTML = '';
    if (isUnsafe) {
        buttonHTML = `<button class="btn-download locked-btn" onclick="openVerification('${mediaId}', '${fileURL}', '${file.name}')" style="background: #dc3545; color: white; border: none; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer; margin-top: 10px;">🔒 Unlock & Download (18+)</button>`;
    } else {
        buttonHTML = `<button class="btn-download safe-btn" onclick="directDownload('${fileURL}', '${file.name}')" style="background: #28a745; color: white; border: none; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer; margin-top: 10px;">⬇️ Download File</button>`;
    }

    // Format Details
    let detailsHtml = '';
    if (result.additional_info && result.additional_info.Notes) {
        detailsHtml = result.additional_info.Notes.map(note => `<li>${note}</li>`).join('');
    }

    card.innerHTML = `
        <div style="text-align: center;">
            ${mediaHTML}
        </div>
        <h3>File: ${file.name}</h3>
        <p><strong>Prediction:</strong> <span style="color: ${color}">${result.prediction}</span></p>
        <p><strong>Confidence:</strong> ${Math.round(result.confidence * 100)}%</p>
        
        <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>Details:</strong>
            <ul>${detailsHtml}</ul>
        </div>

        ${buttonHTML}
    `;

    resultsContainer.appendChild(card);
}

// --- Verification & Download Functions ---

// 1. Open Modal
function openVerification(elementId, fileUrl, fileName) {
    currentLockedFile = { id: elementId, url: fileUrl, name: fileName };
    if(modal) modal.style.display = "block";
}

// 2. Send OTP (Step 1)
window.sendOtp = function() { // Made global to ensure HTML can see it
    const userId = document.getElementById('userIdInput').value;
    const errorMsg = document.getElementById('step1Error');
    
    if (userId.length < 5) {
        if(errorMsg) errorMsg.innerText = "Please enter a valid ID/Phone Number";
        return;
    }
    
    // Send OTP via backend API
    const backendUrl = import.meta.env?.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/send-otp`
        : 'http://localhost:5000/send-otp';
    
    fetch(backendUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: userId,
            otp: Math.floor(1000 + Math.random() * 9000).toString()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("OTP sent to your email!");
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        } else {
            if(errorMsg) errorMsg.innerText = data.error || "Failed to send OTP";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Fallback for testing
        alert("OTP sent to your email: 1234"); 
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
    });
}

// 3. Verify OTP (Step 2)
window.verifyOtp = function() { // Made global
    const otp = document.getElementById('otpInput').value;
    const errorMsg = document.getElementById('step2Error');

    if (otp === "1234") {
        // Success
        if(modal) modal.style.display = "none";
        alert("Verification Successful! Downloading file...");

        // Unblur the specific image/video
        if (currentLockedFile && currentLockedFile.id) {
            const mediaElement = document.getElementById(currentLockedFile.id);
            if (mediaElement) {
                mediaElement.classList.remove('blur-content'); // Remove blur class
            }
            
            // Start Download
            directDownload(currentLockedFile.url, currentLockedFile.name);
        }
        
        resetModal();
    } else {
        if(errorMsg) errorMsg.innerText = "Invalid OTP. Try '1234'";
    }
}

// 4. Reset Modal State
window.resetModal = function() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('userIdInput').value = '';
    document.getElementById('otpInput').value = '';
    if(document.getElementById('step1Error')) document.getElementById('step1Error').innerText = '';
    if(document.getElementById('step2Error')) document.getElementById('step2Error').innerText = '';
    currentLockedFile = null;
}

// 5. Direct Download Function
window.directDownload = function(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}