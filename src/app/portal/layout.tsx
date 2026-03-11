import { Sidebar } from '@/components/layout/Sidebar';
import { MotionMain } from '@/components/layout/MotionMain';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <MotionMain>{children}</MotionMain>
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>
    </div>
  );
}
