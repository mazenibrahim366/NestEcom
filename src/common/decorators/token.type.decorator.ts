import { SetMetadata } from '@nestjs/common';
import { tokenTypeEnum } from '../utils/enums';
export const tokenName = 'tokenType';
export const Token = (type: tokenTypeEnum = tokenTypeEnum.access) => {
  return SetMetadata(tokenName, type);
};
