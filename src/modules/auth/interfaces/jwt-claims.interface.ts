// Carried by both access and refresh tokens
export interface IJwtClaims {
  // User id
  sub: number;
  // Session id
  sid: string;
}
