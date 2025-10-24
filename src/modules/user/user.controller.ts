import { Controller, Get, Headers, UseInterceptors } from '@nestjs/common';
import type { IUserDocument } from 'src/DB/models/User.model';
import { Auth, User } from 'src/common/decorators';
import { PreferredLanguageInterceptor } from 'src/common/interceptor';
import { roleEnum } from 'src/common/utils/enums';
import { UserService } from './user.service';


@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}
// @SetMetadata("tokenType", tokenTypeEnum.access)
@UseInterceptors(PreferredLanguageInterceptor)
@Auth([roleEnum.User,roleEnum.Admin])
  @Get("")
  getHello(@Headers() header:any ,@User() user:IUserDocument) {
    return this.userService.getHello(header);
  }
}
