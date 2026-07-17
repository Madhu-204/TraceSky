import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "TraceSky AI")


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Send a password reset email."""
    subject = "Password Reset - TraceSky AI"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#070A13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070A13;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background-color:#0E1322;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:40px 32px 32px;text-align:center;">
                  <div style="display:inline-block;background:#2563eb;padding:10px;border-radius:12px;margin-bottom:24px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                  <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;">Password Reset</h1>
                  <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
                    You requested a password reset for your TraceSky AI account. Click the button below to set a new password. This link expires in 15 minutes.
                  </p>
                  <a href="{reset_url}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 15px rgba(59,130,246,0.3);">
                    Reset Password
                  </a>
                  <p style="color:#6b7280;font-size:12px;line-height:1.5;margin:24px 0 0;">
                    If you didn't request this reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 32px;text-align:center;">
                  <p style="color:#4b5563;font-size:11px;margin:0;">&copy; 2026 TraceSky Labs Inc. All nodes active.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_body)
