import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tokenName } from 'src/common/decorators';
import { tokenTypeEnum } from 'src/common/utils/enums';
import { IDecoded, TokenService } from 'src/common/utils/security/token.security';
import { IUserDocument } from 'src/DB/models/User.model';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly tokenService:TokenService , private readonly reflector : Reflector){}
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
  


const tokenType:tokenTypeEnum = this.reflector.getAllAndOverride<tokenTypeEnum>(tokenName,[context.getHandler()]) || tokenTypeEnum.access;



    let authorization : string = '';
    let req : any 
    let next : any 
    switch (context.getType()) {
      case "http":
      const httpCtx = context.switchToHttp();
      req = httpCtx.getRequest();
      next = httpCtx.getNext();
    authorization = req.headers.authorization;
        break;
      default:
        break;
    }

    if (!authorization) {
      return next(new Error('Authorization header missing'))
    }
    const result = await this.tokenService.decodedToken({ authorization, tokenType })
    if (!result) {
      return next(new Error('Invalid token'))
    }
    const { user, decoded } = result as { user: IUserDocument; decoded: IDecoded }
    req.decoded = decoded
    req.user = user
    return true
  }
}
