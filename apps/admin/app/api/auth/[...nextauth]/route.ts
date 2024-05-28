import { handlers } from '@admin/app/(utils)/next-auth/auth';
import type { NextRequest } from 'next/server';

const { GET: AuthGET, POST } = handlers;
export { POST };

export async function GET(request: NextRequest) {
  // Do something with request
  const response = await AuthGET(request);
  // Do something with response
  return response;
}
