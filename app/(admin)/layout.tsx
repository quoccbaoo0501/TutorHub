import React from 'react';
import AdminSidebar from '@/components/layout/admin-layout';

export const metadata = {
  title: 'Admin Panel | TutorHub',
  description: 'Admin layout for TutorHub',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
     

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
