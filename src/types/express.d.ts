/// <reference types="multer" />

import * as express from 'express';
import { User } from '../modules/user/entities/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
