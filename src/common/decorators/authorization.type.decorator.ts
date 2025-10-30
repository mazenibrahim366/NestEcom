import { SetMetadata } from '@nestjs/common';
import { roleEnum, tokenTypeEnum } from '../utils/enums';
export const accessRole = 'role';
export const AccessRole = (type: roleEnum[] = [roleEnum.User]) => {
  return SetMetadata(accessRole, type);
};
