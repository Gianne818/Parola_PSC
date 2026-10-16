import { checkSameOrigin, clearDemoSession } from '@/lib/demo-account';
import { registrationResponse } from '@/lib/registration';
export async function POST(request: Request) {
  return registrationResponse(async () => { checkSameOrigin(request); return clearDemoSession(); });
}
