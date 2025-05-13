'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { BarChart3, Users, BookOpen, FileText, DollarSign, Calendar, Settings, User, LogOut, Home } from "lucide-react"

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Quản lí lớp', href: '/admin/classes', icon: BookOpen },
  { name: 'Quản lí hợp đồng', href: '/admin/contracts', icon: FileText },
  { name: 'Quản lí khách hàng', href: '/admin/customers', icon: Users },
  { name: 'Quản lí tài chính', href: '/admin/finance', icon: DollarSign },
  { name: 'Quản lí nhân viên', href: '/admin/staff', icon: User },
  { name: 'Quản lí gia sư', href: '/admin/tutors', icon: User },
  { name: 'Báo cáo', href: '/admin/reports', icon: BarChart3 },
  { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        Admin Panel
      </div>
      <nav className="flex flex-col p-4 space-y-2">
        {adminNavItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <div
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${pathname === item.href ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar; 