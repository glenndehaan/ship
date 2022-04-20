/**
 * Import vendor modules
 */
const fs = require('fs');
const nodemailer = require('nodemailer');

/**
 * Define global variables
 */
const email_smtp_host = process.env.EMAIL_SMTP_HOST || false;
const email_smtp_port = process.env.EMAIL_SMTP_PORT || 25;
const email_smtp_secure = process.env.EMAIL_SMTP_SECURE || false;
const email_from = process.env.EMAIL_FROM || false;
const email_to = process.env.EMAIL_TO || false;

/**
 * Sends an email to the specified users
 *
 * @param title
 * @param message
 */
module.exports = (title, message) => {
    const transport = nodemailer.createTransport({
        host: email_smtp_host,
        port: parseInt(email_smtp_port),
        secure: email_smtp_secure === 'true'
    });

    let template = fs.readFileSync(`${__dirname}/../template/email.html`, 'utf-8');
    template = template.replace('__CONTENT__', message);
    template = template.replace('__PRE_HEADER__', title);
    template = template.replace('__TITLE__', title);

    transport.sendMail({
        from: email_from,
        to: email_to,
        subject: title,
        html: template
    });
}
