import AuthPage from '@/components/auth/AuthPage';
import { getAuthMode } from '@/lib/auth-mode';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <AuthPage mode="login" registrationMode={getAuthMode()} />;
}
