
import nodemailer from "nodemailer"


export const sendEmail = async ({
  to,
  from = process.env.EMAIL_USER ,
  subject = process.env.TEST_SUBJECT ,
  text = process.env.TEST_MESSAGE_EMAIL ,
  cc = [],
  bcc = [],
  html = "",
  attachments = [],

}: {
  to: string,
  from?: string,
  subject?: string,
  text?: string,
  cc?: Array<any>,
  bcc?: Array<any>,
  html?: string,
  attachments?: Array<any>,

}) => {
try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    })

    const mailOptions = {
      from: ` ${process.env.EMAIL_NAME_FORM} <${from}>`,
      to,
      cc,
      bcc,
      subject ,
      text ,
      attachments,
      html
    }

await transporter.sendMail(mailOptions)

    
  } catch (error) {
  return 
  }

}