/// <reference types="multer" />

import * as express from 'express';
import { IAuthenticatedUser } from '../modules/auth/interfaces/index.js';

declare global {
  namespace Express {
    // passport types `req.user` as Express.User; make that the principal
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-object-type
    interface User extends IAuthenticatedUser {}
  }
}
