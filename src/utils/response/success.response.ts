// success handler
import { Response } from "express";

interface ISuccessResponse {
  res: Response;
  message?: string;
  status?: number;
  data?: {};
}

export const successResponse = ({
  res,
  message = "Done",
  status = 200,
  data = {},
}: ISuccessResponse) => {
  return res.status(status).json({ message, data });
}
