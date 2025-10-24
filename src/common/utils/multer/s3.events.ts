import EventEmitter from 'node:events'
import { User, UserModel } from '../../../DB/models/User.model'
import { UserRepository } from '../../../DB/repository/user.repository'
import { getFile } from './s3.config'
import mongoose from 'mongoose'

export const s3Event = new EventEmitter()
s3Event.on('trackFileUpload', (data) => {
  setTimeout(async () => {
    const userModel = new UserRepository(UserModel as any );;
    try {
      await userModel.updateOne({
        filter: { _id: data.userId },
        data: { $unset: { temProfileImage: 1 } },
      })
    await getFile({ Key: data.key })

      console.log('Done file uploaded')
    } catch (error: any) {
      if (error && error.Code === 'NoSuchKey') {
        await userModel.updateOne({
          filter: { _id: data.userId },
          data: { picture :data.oldKey,$unset: { temProfileImage: 1 } },
        })
        console.log(error)
      }
    }
  }, data.expiresIn || 30000)
})
