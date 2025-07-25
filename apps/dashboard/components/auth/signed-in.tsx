import { redirect } from 'next/navigation';
import { useSession } from '@/components/layout/session-provider';

interface SignedInProps {
  children: React.ReactNode;
}

export function SignedIn({ children }: SignedInProps) {
  const { session } = useSession();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}
