import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    let req: any;

    switch (ctx.getType()) {
      case 'http':
        req = ctx.switchToHttp().getRequest();

        break;
      default:
        break;
    }
    return req.user;
  },
);
