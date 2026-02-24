export function getResetPasswordEmail(newPassword: string) {
    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; }
                    .wrapper { background-color: #f7fafc; padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
                    .header { background-color: #000000; padding: 30px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; font-weight: 700; }
                    .body { padding: 40px; }
                    .alert-title { font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 20px; }
                    .password-box { background-color: #edf2f7; border: 2px dashed #cbd5e0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                    .password-text { font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px; }
                    .button-container { text-align: center; margin-top: 30px; }
                    .button { background-color: #3182ce; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; }
                    .footer { padding: 25px; text-align: center; font-size: 13px; color: #718096; background-color: #f8fafc; }
                    .warning { font-size: 12px; color: #a0aec0; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <h1>DIGITALSIGHT</h1>
                        </div>
                        <div class="body">
                            <div class="alert-title">Credential Recovery Protocol</div>
                            <p>Hello,</p>
                            <p>We received a request to access your DigitalSight vault. A temporary access key has been generated for your account.</p>
                            
                            <div class="password-box">
                                <div style="font-size: 12px; color: #718096; margin-bottom: 8px; text-transform: uppercase;">Temporary Key</div>
                                <div class="password-text">${newPassword}</div>
                            </div>

                            <p>Please use this key to log in. You will be required to change this password immediately after access is restored.</p>
                            
                            <div class="button-container">
                                <a href="https://app.digitalsight.in/login" class="button">Log In to Vault</a>
                            </div>

                            <div class="warning">
                                If you did not request this reset, please ignore this email or contact security support if you have concerns about your account.
                            </div>
                        </div>
                        <div class="footer">
                            &copy; 2026 DigitalSight <br>
                            Managed via Cloudflare Shielded Infrastructure
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `;
    const text = `Hello,\n\nYour new temporary vault key is: ${newPassword}\n\nLogin here: https://digitalsight.in/login`;
    return { html, text };
}
