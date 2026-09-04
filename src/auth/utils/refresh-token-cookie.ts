import type { CookieOptions, Response } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
};

export function setRefreshTokenCookie(
  response: Response,
  refreshToken: string,
) {
  response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshTokenCookie(response: Response) {
  response.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
}
