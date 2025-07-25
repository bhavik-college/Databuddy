'use client';

import { redirect } from 'next/navigation';
import { useSession } from '@/components/layout/session-provider';

interface SignedOutProps {
  children: React.ReactNode;
}

export function SignedOut({ children }: SignedOutProps) {
  const { session } = useSession();

  if (session) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
