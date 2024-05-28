export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL as string;
export const DOCKER_SERVICE_URL = process.env
  .NEXT_PUBLIC_DOCKER_SERVICE_URL as string;
export const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL as string;
export const SERVER_TRPC_URL = 'http://134.249.168.21:3000/api/trpc';
export const AUTH_URL = process.env.NEXTAUTH_URL as string;
export const AUTH_JWT_ACCESS_TOKEN_EXPIRATION = process.env
  .NEXTAUTH_JWT_ACCESS_TOKEN_EXPIRATION as string;
