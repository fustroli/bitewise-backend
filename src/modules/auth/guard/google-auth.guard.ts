import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  // A refused callback (bad/missing `state`, user cancelled at Google) lets the route run
  // with `req.user === false` so it can redirect to the frontend; errors still throw
  handleRequest<TUser>(err: unknown, user: TUser | false): TUser | false {
    if (err) throw err;
    return user || false;
  }
}
