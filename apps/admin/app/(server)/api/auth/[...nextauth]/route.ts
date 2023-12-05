import { handlers } from "@admin/app/(utils)/authOptions";
import type { NextRequest } from "next/server";

const { GET: AuthGET, POST } = handlers;
export { POST };

export async function GET(request: NextRequest) {
  // Do something with request
  const response = await AuthGET(request);
  // Do something with response
  return response;
}
