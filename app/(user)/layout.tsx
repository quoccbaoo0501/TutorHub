import '../globals.css';
import ClientLayout from '@/components/layout/client-layout';

export const metadata = {
  title: 'User Dashboard | TutorHub',
  description: 'User layout for TutorHub',
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  )
}
