
import { applyDecorators, UseGuards } from '@nestjs/common';
import { roleEnum, tokenTypeEnum } from '../utils/enums';
import { Token } from './token.type.decorator';
import { AuthenticationGuard } from '../guard/authentication/authentication.guard';
import { AuthorizationGuard } from '../guard/authorization/authorization.guard';
import { AccessRole } from './authorization.type.decorator';

export function Auth(roles: roleEnum[],type: tokenTypeEnum= tokenTypeEnum.access) {
  return applyDecorators(
Token(tokenTypeEnum.access),
AccessRole(roles),
UseGuards(AuthenticationGuard,AuthorizationGuard)
  );
}
