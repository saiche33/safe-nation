from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "YOUR_EMAIL"  # Replace with your email
SENDER_PASSWORD = "YOUR_PASSWORD"  # Replace with your app password

def create_otp_email_template(otp_code, recipient_email):
    """Create a beautiful HTML email template for OTP"""
    html_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f8fafc;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }}
            .header {{
                background: rgba(255,255,255,0.1);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }}
            .shield-icon {{
                width: 60px;
                height: 60px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }}
            .content {{
                background: white;
                padding: 50px 30px;
                text-align: center;
            }}
            .otp-code {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 36px;
                font-weight: bold;
                padding: 20px 40px;
                border-radius: 15px;
                margin: 30px 0;
                letter-spacing: 8px;
                display: inline-block;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            }}
            .warning {{
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                font-size: 14px;
            }}
            .footer {{
                background: #f8fafc;
                padding: 30px;
                text-align: center;
                color: #64748b;
                font-size: 14px;
            }}
            .timestamp {{
                color: #94a3b8;
                font-size: 12px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="shield-icon">🛡️</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Email Verification</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Your security is our priority</p>
            </div>
            
            <div class="content">
                <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 24px;">Verification Code</h2>
                <p style="color: #64748b; margin: 0 0 10px;">Hello,</p>
                <p style="color: #64748b; margin: 0 0 30px;">
                    We received a request to verify your email address. Use the code below to complete your verification:
                </p>
                
                <div class="otp-code">{otp_code}</div>
                
                <p style="color: #64748b; margin: 30px 0 10px;">
                    Enter this code in the verification form to continue.
                </p>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong><br>
                    This code will expire in 10 minutes. Never share this code with anyone. 
                    If you didn't request this verification, please ignore this email.
                </div>
                
                <p style="color: #64748b; margin: 20px 0 0; font-size: 14px;">
                    If you're having trouble, please contact our support team.
                </p>
                
                <div class="timestamp">
                    Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
                </div>
            </div>
            
            <div class="footer">
                <p style="margin: 0;">
                    This is an automated message. Please do not reply to this email.
                </p>
                <p style="margin: 10px 0 0; font-size: 12px;">
                    © 2026 OTP Verification System. All rights reserved. Praneeth G.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return html_template

def send_email_otp(recipient_email, otp_code):
    """Send OTP via email using SMTP"""
    try:
        # Create message container
        message = MIMEMultipart("alternative")
        message["Subject"] = f"Your Verification Code: {otp_code}"
        message["From"] = SENDER_EMAIL
        message["To"] = recipient_email

        # Create HTML content
        html_content = create_otp_email_template(otp_code, recipient_email)
        
        # Create plain text version
        text_content = f"""
        Email Verification
        
        Your verification code is: {otp_code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this verification, please ignore this email.
        
        Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
        """

        # Attach parts
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        
        message.attach(part1)
        message.attach(part2)

        # Create secure connection and send email
        context = ssl.create_default_context()
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
            
        return True, "Email sent successfully"
        
    except smtplib.SMTPAuthenticationError:
        return False, "Email authentication failed. Please check your email credentials."
    except smtplib.SMTPRecipientsRefused:
        return False, "Invalid recipient email address."
    except smtplib.SMTPServerDisconnected:
        return False, "Connection to email server failed."
    except Exception as e:
        return False, f"Failed to send email: {str(e)}"

@app.route('/send-otp', methods=['POST'])
def send_otp():
    """API endpoint to send OTP via email"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return jsonify({"error": "Email and OTP are required"}), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Send OTP email
        success, message = send_email_otp(email, otp)
        
        if success:
            return jsonify({
                "success": True,
                "message": "OTP sent successfully",
                "email": email
            }), 200
        else:
            return jsonify({"error": message}), 500
            
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "OTP Email Service"
    }), 200

if __name__ == '__main__':
    print("🚀 Starting OTP Email Server...")
    print("📧 Make sure to update SENDER_EMAIL and SENDER_PASSWORD in the code")
    print("🔑 For Gmail, use an App Password instead of your regular password")
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Server will run on http://0.0.0.0:{port}")
    print("📋 Available endpoints:")
    print("   POST /send-otp - Send OTP via email")
    print("   GET  /health  - Health check")
    print("=" * 60)
    
    app.run(debug=False, host='0.0.0.0', port=port)