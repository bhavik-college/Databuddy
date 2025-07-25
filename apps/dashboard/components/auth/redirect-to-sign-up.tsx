import { redirect } from 'next/navigation';
import { useSession } from '@/components/layout/session-provider';
import { AuthLoading } from './auth-loading';

interface RedirectToSignUpProps {
  children: React.ReactNode;
}

export function RedirectToSignUp({ children }: RedirectToSignUpProps) {
  const { session } = useSession();

  if (!session) {
    redirect('/signup');
  }

  return <>{children}</>;
}
