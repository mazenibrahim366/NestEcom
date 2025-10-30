import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthenticationGuard } from '../guard/authentication/authentication.guard';
import { AuthorizationGuard } from '../guard/authorization/authorization.guard';
import { roleEnum, tokenTypeEnum } from '../utils/enums';
import { AccessRole } from './authorization.type.decorator';
import { Token } from './token.type.decorator';

export function Auth(
  roles: roleEnum[],
  type: tokenTypeEnum = tokenTypeEnum.access,
) {
  return applyDecorators(
    Token(tokenTypeEnum.access),
    AccessRole(roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard),
  );
}
