// Global variables
let currentStep = 'email';
let userEmail = '';
let generatedOtp = '';
let countdown = 0;
let countdownInterval = null;

// DOM elements
const emailStep = document.getElementById('emailStep');
const otpStep = document.getElementById('otpStep');
const successStep = document.getElementById('successStep');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const headerSubtitle = document.getElementById('headerSubtitle');
const emailInput = document.getElementById('emailInput');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const sendBtnText = document.getElementById('sendBtnText');
const emailDisplay = document.getElementById('emailDisplay');
const otpInputs = document.querySelectorAll('.otp-input');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendBtn = document.getElementById('resendBtn');
const resendText = document.getElementById('resendText');
const resetBtn = document.getElementById('resetBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showStep('email');
});

// Setup all event listeners
function setupEventListeners() {
    // Email input enter key
    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendOTP();
        }
    });

    // Send OTP button
    sendOtpBtn.addEventListener('click', sendOTP);

    // OTP inputs
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            handleOtpInput(index, e.target.value);
        });

        input.addEventListener('keydown', function(e) {
            handleOtpKeydown(index, e);
        });

        input.addEventListener('paste', function(e) {
            handleOtpPaste(e);
        });
    });

    // Verify OTP button
    verifyOtpBtn.addEventListener('click', verifyOTP);

    // Resend button
    resendBtn.addEventListener('click', function() {
        if (countdown === 0) {
            sendOTP();
        }
    });

    // Reset button
    resetBtn.addEventListener('click', resetForm);
}

// Utility functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showLoading(show = true) {
    if (show) {
        loadingSpinner.style.display = 'block';
        sendOtpBtn.disabled = true;
        sendBtnText.textContent = 'Sending OTP...';
    } else {
        loadingSpinner.style.display = 'none';
        sendOtpBtn.disabled = false;
        sendBtnText.textContent = 'Send OTP';
    }
}

function showStep(step) {
    // Hide all steps
    emailStep.style.display = 'none';
    otpStep.style.display = 'none';
    successStep.style.display = 'none';
    
    // Show current step
    switch(step) {
        case 'email':
            emailStep.style.display = 'block';
            headerSubtitle.textContent = 'Enter your email to receive OTP';
            currentStep = 'email';
            break;
        case 'otp':
            otpStep.style.display = 'block';
            headerSubtitle.textContent = 'Enter the 6-digit code sent to your email';
            currentStep = 'otp';
            break;
        case 'success':
            successStep.style.display = 'block';
            headerSubtitle.textContent = 'Email verified successfully!';
            currentStep = 'success';
            break;
    }
    
    hideError();
}

function startCountdown() {
    countdown = 60;
    updateResendButton();
    
    countdownInterval = setInterval(() => {
        countdown--;
        updateResendButton();
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }, 1000);
}

function updateResendButton() {
    if (countdown > 0) {
        resendBtn.disabled = true;
        resendText.textContent = `Resend in ${countdown}s`;
    } else {
        resendBtn.disabled = false;
        resendText.textContent = 'Resend OTP';
    }
}

// Main functions
async function sendOTP() {
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    userEmail = email;
    generatedOtp = generateOTP();
    
    showLoading(true);
    hideError();

    try {
        const response = await fetch('http://localhost:5000/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                otp: generatedOtp,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            emailDisplay.textContent = userEmail;
            showStep('otp');
            startCountdown();
            
            // Focus first OTP input
            setTimeout(() => {
                otpInputs[0].focus();
            }, 100);
        } else {
            showError(result.error || 'Failed to send OTP');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showError('Failed to connect to server. Make sure the Python server is running on port 5000.');
    } finally {
        showLoading(false);
    }
}

function handleOtpInput(index, value) {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
        otpInputs[index].value = '';
        return;
    }

    // Update visual state
    if (value) {
        otpInputs[index].classList.add('filled');
        // Move to next input
        if (index < 5) {
            otpInputs[index + 1].focus();
        }
    } else {
        otpInputs[index].classList.remove('filled');
    }

    // Auto-verify when all fields are filled
    const allFilled = Array.from(otpInputs).every(input => input.value !== '');
    if (allFilled) {
        setTimeout(verifyOTP, 100);
    }
}

function handleOtpKeydown(index, e) {
    if (e.key === 'Backspace' && !otpInputs[index].value && index > 0) {
        otpInputs[index - 1].focus();
        otpInputs[index - 1].value = '';
        otpInputs[index - 1].classList.remove('filled');
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
        otpInputs[index - 1].focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
        otpInputs[index + 1].focus();
    }
}

function handleOtpPaste(e) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    digits.split('').forEach((digit, index) => {
        if (index < 6) {
            otpInputs[index].value = digit;
            otpInputs[index].classList.add('filled');
        }
    });
    
    // Focus the next empty input or verify if all filled
    const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
    otpInputs[nextEmptyIndex].focus();
    
    if (digits.length === 6) {
        setTimeout(verifyOTP, 100);
    }
}

function verifyOTP() {
    const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (enteredOtp.length !== 6) {
        showError('Please enter complete OTP');
        return;
    }

    if (enteredOtp === generatedOtp) {
        showStep('success');
        hideError();
        
        // Clear countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    } else {
        showError('Invalid OTP. Please try again.');
        clearOtpInputs();
        otpInputs[0].focus();
    }
}

function clearOtpInputs() {
    otpInputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled');
    });
}

function resetForm() {
    // Clear all data
    userEmail = '';
    generatedOtp = '';
    countdown = 0;
    
    // Clear inputs
    emailInput.value = '';
    clearOtpInputs();
    
    // Clear countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // Reset UI
    showStep('email');
    emailInput.focus();
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to go back or reset
    if (e.key === 'Escape') {
        if (currentStep === 'otp') {
            showStep('email');
        } else if (currentStep === 'success') {
            resetForm();
        }
    }
    
    // Enter to proceed
    if (e.key === 'Enter') {
        if (currentStep === 'otp') {
            verifyOTP();
        } else if (currentStep === 'success') {
            resetForm();
        }
    }
});

// Auto-focus email input on page load
window.addEventListener('load', function() {
    emailInput.focus();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', function(e) {
    if (currentStep !== 'email') {
        resetForm();
    }
});

// Prevent form submission on Enter (if wrapped in a form)
document.addEventListener('submit', function(e) {
    e.preventDefault();
});

// Console logging for debugging
console.log('OTP Verification System Loaded');
console.log('Make sure Python server is running on http://localhost:5000');

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        generateOTP,
        sendOTP,
        verifyOTP,
        resetForm
    };
}