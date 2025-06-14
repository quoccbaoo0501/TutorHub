"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import type React from "react"
import { BarChart3, Users, BookOpen, FileText, DollarSign, Settings, User, LogOut, Home , Calendar } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordDialog } from "@/components/dialogs/change-password-dialog"

// Danh sách các mục điều hướng cho trang quản trị - ADMIN
const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Quản lí nhân viên", href: "/admin/staff", icon: User },
  { name: "Xếp lịch nhân viên", href: "/admin/schedule", icon: Calendar},
  { name: "Quản lí tài chính", href: "/admin/finance", icon: DollarSign },
  { name: "Báo cáo", href: "/admin/reports", icon: BarChart3 },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

// Danh sách các mục điều hướng cho trang quản trị - STAFF
const staffNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Quản lí lớp", href: "/admin/class", icon: BookOpen },
  { name: "Quản lí hợp đồng", href: "/admin/contracts", icon: FileText },
  { name: "Quản lí khách hàng", href: "/admin/customers", icon: Users },
  { name: "Quản lí gia sư", href: "/admin/tutors", icon: User },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

const AdminSidebar: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  // Khởi tạo Supabase client cho phía client
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Hàm đồng bộ metadata của người dùng với dữ liệu từ bảng profiles
  const syncUserMetadata = async (userId: string) => {
    try {
      // Lấy thông tin vai trò từ bảng profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Lỗi khi lấy thông tin profile:", profileError)
        return null
      }

      if (!profileData) {
        console.error("Không tìm thấy profile cho user:", userId)
        return null
      }

      // Cập nhật metadata của người dùng với vai trò từ profiles
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: profileData.role },
      })

      if (updateError) {
        console.error("Lỗi khi cập nhật metadata:", updateError)
        return null
      }

      console.log("Đã đồng bộ metadata với vai trò:", profileData.role)
      return profileData.role
    } catch (error) {
      console.error("Lỗi không mong muốn khi đồng bộ metadata:", error)
      return null
    }
  }

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      // Đồng bộ metadata của người dùng trước khi đăng xuất
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await syncUserMetadata(user.id)
      }

      // Tiến hành đăng xuất
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Lỗi trong quá trình đăng xuất:", error)
      router.push("/login")
    }
  }

  // Kiểm tra phiên đăng nhập hiện tại khi component được tải
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Session error:", error)
          // Don't redirect immediately, let middleware handle it
          return
        }
        if (session?.user) {
          const userRole = session.user.user_metadata?.role
          setUserRole(userRole)
        }
      } catch (error) {
        console.error("Session check error:", error)
      }
    }

    checkSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUserRole(null)
      } else if (session?.user) {
        const userRole = session.user.user_metadata?.role
        setUserRole(userRole)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <div className="w-64 bg-background border-r border-border text-foreground flex flex-col h-screen">
      {/* Tiêu đề thanh bên */}
      <div className="p-4 text-2xl font-bold border-b border-border">
        <span>Admin Panel</span>
      </div>
      {/* Danh sách các mục điều hướng */}
      <nav className="flex flex-col p-4 space-y-2 flex-grow overflow-y-auto">
        {(userRole === "admin" ? adminNavItems : staffNavItems).map((item) => (
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
      {/* Phần dưới của thanh bên */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex justify-between items-center px-3">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => setChangePasswordOpen(true)}
          className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="mr-3 h-5 w-5" />
          Đổi mật khẩu
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-muted"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Đăng xuất
        </button>
      </div>
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>
  )
}

export default AdminSidebar
