import AuthPage from '@/components/auth/AuthPage';
import { getAuthMode } from '@/lib/auth-mode';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return <AuthPage mode="register" registrationMode={getAuthMode()} />;
}
