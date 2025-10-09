import EventEmitter from 'node:events'

import { emailTemplate } from './email.template'
import { sendEmail } from './send.email'
const createMentionMessage = (username: string) => {
  return `${username} has mentioned you.`
}
export const emailEvent = new EventEmitter()
emailEvent.on('sendConfirmEmail', async ([email, subject, otp]) => {
  await sendEmail({
    to: email,
    subject: subject,
    html: (await emailTemplate(otp)) || otp,
  })
})

emailEvent.on(
  'sendListEmails',
  async ([emails, subject, username]: [string[], string, string]) => {
    await Promise.all(
      emails.map(async (email) =>
        sendEmail({
          to: email,
          subject,
          text: createMentionMessage(username),
        })
      )
    )
  }
)
