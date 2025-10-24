import { model, Types } from 'mongoose';
import EventEmitter from 'node:events'

import { emailTemplate } from './email.template'
import { sendEmail } from './send.email'
import { UserRepository } from 'src/DB/repository'
import { User, UserSchema } from 'src/DB/models/User.model'

const createMentionMessage = (username: string) => {
  return `${username} has mentioned you.`
}
export const userModel = new UserRepository(model(User.name, UserSchema)as any )
export const emailEvent = new EventEmitter()
emailEvent.on('sendConfirmEmail', async ([email, subject, otp ,userId]) => {
  
  const user = await userModel.findOne({filter:{_id:userId} })
  if (user) {
    email = user.email
  }

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
