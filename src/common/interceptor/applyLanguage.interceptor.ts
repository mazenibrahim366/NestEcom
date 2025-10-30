import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { log } from 'console';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PreferredLanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    context.switchToHttp().getRequest().header['accept-language'] =
      context.switchToHttp().getRequest().user.preferredLanguage ||
      context.switchToHttp().getRequest().header['accept-language'];
    log(context.switchToHttp().getRequest().header['accept-language']);
    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          log(context.switchToHttp().getRequest().header['accept-language']),
        ),
      );
  }
}
