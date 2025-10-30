import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { accessRole } from 'src/common/decorators/authorization.type.decorator';
import { roleEnum } from 'src/common/utils/enums';
('authorization');
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const accessRoles: roleEnum[] =
      this.reflector.getAllAndOverride<roleEnum[]>(accessRole, [
        context.getHandler(),
      ]) || [];

    let role: roleEnum = roleEnum.User;
    let req: any;
    let next: any;
    switch (context.getType()) {
      case 'http':
        role = context.switchToHttp().getRequest().user.role;
        break;
      default:
        break;
    }
    if (!accessRoles.includes(role)) {
      throw new ForbiddenException('Not authorized account');
    }

    return accessRoles.includes(role);
  }
}
