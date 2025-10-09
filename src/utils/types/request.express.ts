import { IUser } from '../../DB/models/models.dto'
import { IDecoded } from '../security/token.security'

declare global {
  namespace Express {
    interface Request {
      decoded?: IDecoded
      user?: IUser
    }
  }
}
