import { auth } from '@databuddy/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="h-screen overflow-hidden text-foreground">
      <Sidebar />
      <div className="relative h-screen pt-16 md:pl-72">
        <div className="h-[calc(100vh-4rem)] overflow-y-scroll">{children}</div>
      </div>
    </div>
  );
}
