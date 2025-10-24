import { IUserDocument } from 'src/DB/models/User.model'
import { IDecoded } from '../security/token.security'

declare global {
  namespace Express {
    interface Request {
      decoded?: IDecoded
      user?: IUserDocument
    }
  }
}
