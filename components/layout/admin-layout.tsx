"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type React from "react"
import { BarChart3, Users, BookOpen, FileText, DollarSign, Settings, User, LogOut, Home } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ThemeToggle } from "@/components/theme-toggle"

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Quản lí lớp", href: "/admin/classes", icon: BookOpen },
  { name: "Quản lí hợp đồng", href: "/admin/contracts", icon: FileText },
  { name: "Quản lí khách hàng", href: "/admin/customers", icon: Users },
  { name: "Quản lí tài chính", href: "/admin/finance", icon: DollarSign },
  { name: "Quản lí nhân viên", href: "/admin/staff", icon: User },
  { name: "Quản lí gia sư", href: "/admin/tutors", icon: User },
  { name: "Báo cáo", href: "/admin/reports", icon: BarChart3 },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

const AdminSidebar: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="w-64 bg-background border-r border-border text-foreground flex flex-col h-screen">
      <div className="p-4 text-2xl font-bold border-b border-border">
        <span>Admin Panel</span>
      </div>
      <nav className="flex flex-col p-4 space-y-2 flex-grow overflow-y-auto">
        {adminNavItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <div
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </div>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex justify-between items-center px-3">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
        <Link href="/admin/profile">
          <div className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <User className="mr-3 h-5 w-5" />
            Hồ sơ
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-muted"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar
