// success handler

import { IResponse } from '../interfaces/respons.interface';

export const successResponse = <T = any>({
  message = 'Done',
  status = 200,
  data,
}: IResponse <T> = {} ):IResponse <T> => {
  return { message, status, data };
};
