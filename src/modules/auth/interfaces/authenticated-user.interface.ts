/**
 * Who is calling: the only principal type. Set as `req.user` by JwtStrategy
 * once the access token's Session and User are confirmed; read with
 * `@CurrentUser()`.
 */
export interface IAuthenticatedUser {
  userId: number;
  sessionId: string;
}
