'use client'
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../theme-toggle';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const router = useRouter();

  const handleRefresh = () => {
    // Sử dụng router.refresh() để reload page hiện tại 
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar cho client UI*/}
      <header className="bg-gray-800 text-white shadow-md">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <button 
              onClick={handleRefresh}
              className="text-xl font-bold hover:text-gray-300 transition-colors"
            >
              TutorHub
            </button>
          </div>
          <div className="flex space-x-4"> 
            <Link href="/dashboard" className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer">Dashboard</Link>
            <Link href="/class" className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer">Classes</Link>
            <Link href="/contract" className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer">Contracts</Link>
            <Link href="/payment" className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer">Payment</Link>
            <Link href="/profile" className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer">Profile</Link>
            <ThemeToggle />
            <Link href="/profile" className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer text:bg-sky-700">Log out</Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-center text-sm py-4 mt-auto">
        © {new Date().getFullYear()} SE104
      </footer>
    </div>
  );
};

export default ClientLayout;
