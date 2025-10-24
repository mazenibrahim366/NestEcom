import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { delay, Observable, of } from 'rxjs';

@Injectable()
export class UserService {
  getHello(header):Observable<any> {
    return of([{message: 'Done'}]).pipe(delay(10000));
  }
}
