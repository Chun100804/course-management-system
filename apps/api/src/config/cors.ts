import cors from 'cors';

export function createCorsOptions(origin: string): cors.CorsOptions {
  return { origin, credentials: true };
}
