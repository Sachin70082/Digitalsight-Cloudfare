export function getCorrectionEmail(title: string, upc: string, createdAt: string, message: string, id: string) {
    const subject = `Action Required: Correction Request for "${title}"`;
    const html = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                                .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                .header { background-color: #000; padding: 20px; text-align: center; }
                                .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
                                .content { padding: 30px; }
                                .alert-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                                .alert-title { font-weight: bold; color: #d39e00; margin-bottom: 5px; display: block; font-size: 14px; text-transform: uppercase; }
                                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                .meta-table td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                                .meta-label { font-weight: bold; color: #666; width: 120px; }
                                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                                .button { display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>DIGITALSIGHT</h1>
                                </div>
                                <div class="content">
                                    <h2 style="margin-top: 0; color: #1a1a1a;">Correction Required</h2>
                                    <p>Hello,</p>
                                    <p>The following release has been flagged by our Quality Assurance team and requires your attention before it can be distributed.</p>
                                    
                                    <table class="meta-table">
                                        <tr>
                                            <td class="meta-label">Release Title</td>
                                            <td><strong>${title}</strong></td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">UPC</td>
                                            <td>${upc || 'Pending'}</td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">Submission Date</td>
                                            <td>${new Date(createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    </table>

                                    <div class="alert-box">
                                        <span class="alert-title">Correction Directive</span>
                                        ${message}
                                    </div>

                                    <p>Please log in to the portal to address these issues and resubmit the release.</p>
                                    
                                    <div style="text-align: center;">
                                        <a href="https://app.digitalsight.in/releases/${id}" class="button" style="color: white; text-decoration: none;">Fix Metadata</a>
                                    </div>
                                </div>
                                <div class="footer">
                                    &copy; ${new Date().getFullYear()} DigitalSight. All rights reserved.<br>
                                    This is an automated message. Please do not reply directly to this email.
                                </div>
                            </div>
                        </body>
                        </html>
                        `;
    const text = `Correction Required for "${title}".\n\nNote: ${message}\n\nPlease login to fix: https://app.digitalsight.in/releases/${id}`;
    return { subject, html, text };
}
