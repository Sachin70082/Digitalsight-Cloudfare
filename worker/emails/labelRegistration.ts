export function getLabelRegistrationEmail(adminName: string, labelName: string, adminEmail: string, passwordToSave: string) {
    const subject = "Label Registration - Digitalsight";
    const text = `Hello ${adminName},\n\nYour label "${labelName}" has been registered on Digitalsight.\nYour admin account has been created.\n\nEmail: ${adminEmail}\nPassword: ${passwordToSave}\n\nPlease log in at https://digitalsight.in/login and complete your profile.`;
    const html = `<h3>Label Registration - Digitalsight</h3><p>Hello ${adminName},</p><p>Your label "<b>${labelName}</b>" has been registered on Digitalsight.</p><p>Admin Account Created:</p><ul><li>Email: ${adminEmail}</li><li>Password: ${passwordToSave}</li></ul><p>Please log in at <a href="https://digitalsight.in/login">https://digitalsight.in/login</a> and complete your profile.</p>`;
    return { subject, html, text };
}
