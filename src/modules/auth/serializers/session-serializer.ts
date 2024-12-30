import { Inject } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../../user/entities';
import { UserService } from '../../user/service';

export class SessionSerializer extends PassportSerializer {
  constructor(@Inject(UserService) private readonly userService: UserService) {
    super();
  }

  serializeUser(user: User, done: CallableFunction) {
    console.log('serializeUser');

    done(null, user);
  }
  async deserializeUser(user: User, done: CallableFunction) {
    const userEntity = await this.userService.findById(user.id);
    console.log('deserialize userEntity', userEntity);

    return userEntity ? done(null, userEntity) : done(null, null);
  }
}
