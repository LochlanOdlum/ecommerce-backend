// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendResetPasswordEmail = async (email, name, resetURL) => {
  const msg = {
    to: email,
    from: 'no-reply@skylightphotography.co.uk',
    subject: 'Reset your password',
    html: `
      <p> Dear ${name}, </p>
      <p>Someone has requested a password reset for your Skylight Photography account linked to this email address. Follow the link below to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>If you did not request this password reset, disregard this email and no action will be taken.</p>
      <p> Skylight Photography <br/> https://skylightphotography.co.uk </p>
   `,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Failed to send email');
    console.error(error);
    throw error;
  }
};

// sendResetPasswordEmail(
//   'lodlum5@gmail.com',
//   'Lochlan',
//   'https://skylightphotography.co.uk/resetPassword?key=aaaafifjf7fhhgld7a62jkf9'
// );
