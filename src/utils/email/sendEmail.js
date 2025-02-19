import nodemailer from "nodemailer"

const sendEmail = async ({ to, subject, html }) => {
  //sender
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //receiver
  const info = await transporter.sendMail({
    from:`Social Application <${process.env.EMAIL}>`,
    to,
    subject,
    html,
  });
  //
  return info.rejected.length=== 0 ? true : false
};


export const subjects ={
    resetPassword: 'Reset Password',
    verifyEmail: 'Verify Email',   
    updateEmail: 'Update Email',
    enable2SV: 'Enable 2-Step-Verification'
  }

export default sendEmail