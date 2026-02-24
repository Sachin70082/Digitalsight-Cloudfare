export function getPublicationEmail(releaseTitle: string, upc: string, releaseDate: string, labelName: string, id: string) {
    const subject = `🚀 Published: "${releaseTitle}" is now live!`;
    const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; }
                            .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900; text-transform: uppercase; }
                            .content { padding: 40px; }
                            .success-badge { background-color: #e8f5e9; color: #2e7d32; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; margin-bottom: 20px; }
                            .release-title { font-size: 24px; font-weight: 900; color: #1a1a1a; margin: 0 0 10px 0; line-height: 1.2; }
                            .meta-container { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; }
                            .meta-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                            .meta-row:last-child { border-bottom: none; }
                            .meta-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; }
                            .meta-value { font-size: 14px; color: #1a1a1a; font-weight: bold; }
                            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                            .button { display: inline-block; background-color: #000; color: #fff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>DIGITALSIGHT</h1>
                            </div>
                            <div class="content">
                                <div class="success-badge">✓ Published & Live</div>
                                <h2 class="release-title">${releaseTitle}</h2>
                                <p>Congratulations! Your release has been successfully processed and delivered to global digital stores.</p>
                                
                                <div class="meta-container">
                                    <div class="meta-row">
                                        <span class="meta-label">UPC Code</span>
                                        <span class="meta-value">${upc}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Release Date</span>
                                        <span class="meta-value">${releaseDate}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Label</span>
                                        <span class="meta-value">${labelName}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Status</span>
                                        <span class="meta-value" style="color: #2e7d32;">Published</span>
                                    </div>
                                </div>

                                <p>Your music is now on its way to Spotify, Apple Music, Amazon, and 150+ other platforms. It typically takes 24-48 hours for the release to appear across all stores.</p>
                                
                                <div style="text-align: center;">
                                    <a href="https://app.digitalsight.in/releases/${id}" class="button">View Release Details</a>
                                </div>
                            </div>
                            <div class="footer">
                                &copy; ${new Date().getFullYear()} DigitalSight. Global Music Distribution.<br>
                                Managed via Cloudflare Shielded Infrastructure.
                            </div>
                        </div>
                    </body>
                    </html>
                    `;
    const text = `Congratulations! Your release "${releaseTitle}" has been published.\nUPC: ${upc}\nRelease Date: ${releaseDate}\nLabel: ${labelName}\n\nView details: https://app.digitalsight.in/releases/${id}`;
    return { subject, html, text };
}
