import { Sidebar } from '@/components/layout/Sidebar';
import { MotionMain } from '@/components/layout/MotionMain';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <MotionMain>{children}</MotionMain>
    </div>
  );
}
