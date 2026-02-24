export function getWelcomeEmail(name: string, passwordToSave: string) {
    const subject = "Welcome to Digitalsight";
    const text = `Hello ${name},\n\nYour account has been created.\nYour temporary password is: ${passwordToSave}\n\nPlease log in at https://digitalsight.in/login and change your password.`;
    const html = `<h3>Welcome to Digitalsight</h3><p>Hello ${name},</p><p>Your account has been created.</p><p>Temporary Password: <b>${passwordToSave}</b></p><p>Please log in at <a href="https://digitalsight.in/login">https://digitalsight.in/login</a> and change your password.</p>`;
    return { subject, html, text };
}
