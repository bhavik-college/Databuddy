import { redirect } from 'next/navigation';
import { useSession } from '@/components/layout/session-provider';

interface RedirectToSignInProps {
  children: React.ReactNode;
}

export function RedirectToSignIn({ children }: RedirectToSignInProps) {
  const { session } = useSession();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}
