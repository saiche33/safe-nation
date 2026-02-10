# OTP Email Verification System

A beautiful and secure OTP (One-Time Password) email verification system built with React frontend and Python Flask backend.

## Features

✨ **Beautiful UI Design**
- Modern gradient design with smooth animations
- Responsive layout for all devices
- Interactive OTP input fields
- Real-time validation and feedback

🔐 **Secure OTP System**
- 6-digit random OTP generation
- Email validation and verification
- Countdown timer for resend functionality
- Error handling and user feedback

📧 **Professional Email Templates**
- HTML email templates with modern design
- Security warnings and best practices
- Timestamp and expiry information
- Mobile-responsive email layout

## Setup Instructions

### 1. Frontend Setup (Already configured in this project)

The React frontend is already set up and ready to use. Just run:

```bash
npm run dev
```

### 2. Python Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Email Settings:**
   
   Open `server.py` and update these variables:
   ```python
   SENDER_EMAIL = "your_email@gmail.com"      # Your email address
   SENDER_PASSWORD = "your_app_password"       # Your app password
   ```

   **For Gmail users:**
   - Enable 2-Factor Authentication on your Google account
   - Generate an App Password: Google Account → Security → App passwords
   - Use the generated 16-character app password (not your regular password)

3. **Start the Python server:**
   ```bash
   python server.py
   ```

   The server will start on `http://localhost:5000`

### 3. Usage

1. Open the React app in your browser
2. Enter your email address
3. Click "Send OTP"
4. Check your email for the 6-digit verification code
5. Enter the code in the OTP input fields
6. Click "Verify OTP"

## Email Configuration

### Gmail Setup
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Generate a new app password for "Mail"
3. Use this 16-character password in `SENDER_PASSWORD`

### Other Email Providers
Update the SMTP settings in `server.py`:

```python
# For Outlook/Hotmail
SMTP_SERVER = "smtp-mail.outlook.com"
SMTP_PORT = 587

# For Yahoo
SMTP_SERVER = "smtp.mail.yahoo.com"
SMTP_PORT = 587
```

## API Endpoints

### POST `/send-otp`
Send OTP via email

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "email": "user@example.com"
}
```

### GET `/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "service": "OTP Email Service"
}
```

## Security Features

- ✅ Email format validation
- ✅ OTP expiry handling
- ✅ Rate limiting with countdown timer
- ✅ Secure SMTP connection with SSL/TLS
- ✅ Input sanitization and validation
- ✅ Error handling and user feedback

## Customization

### Frontend Styling
- Modify colors in `src/App.tsx`
- Update gradients and animations
- Customize responsive breakpoints

### Email Templates
- Edit the HTML template in `create_otp_email_template()` function
- Add your branding and colors
- Customize the email content and styling

### Backend Configuration
- Update SMTP settings for different email providers
- Modify OTP expiry time
- Add additional validation rules

## Troubleshooting

**Common Issues:**

1. **"Authentication failed" error:**
   - Make sure you're using an App Password, not your regular password
   - Check that 2FA is enabled on your email account

2. **"Connection refused" error:**
   - Ensure the Python server is running on port 5000
   - Check firewall settings

3. **Email not received:**
   - Check spam/junk folder
   - Verify email address is correct
   - Check SMTP server settings

4. **CORS errors:**
   - Make sure Flask-CORS is installed
   - Check that the server allows requests from your frontend URL

## Production Deployment

For production use:

1. **Environment Variables:**
   ```bash
   export SENDER_EMAIL="your_email@gmail.com"
   export SENDER_PASSWORD="your_app_password"
   ```

2. **Security Enhancements:**
   - Use environment variables for sensitive data
   - Implement rate limiting
   - Add request validation and sanitization
   - Use HTTPS for all communications

3. **Scalability:**
   - Consider using email service providers (SendGrid, AWS SES)
   - Implement database storage for OTP tracking
   - Add caching for better performance

## License

This project is open source and available under the MIT License.