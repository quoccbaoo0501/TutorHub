"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import AdminSidebar from "@/components/layout/admin-layout"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // State để kiểm soát việc xác thực quyền truy cập
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()

  // Kiểm tra quyền truy cập khi component được tải
  // Chỉ cho phép người dùng có vai trò admin hoặc staff truy cập
  useEffect(() => {
    const checkAuthorization = async () => {
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })

      // Lấy thông tin phiên đăng nhập hiện tại
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // Lấy vai trò từ metadata của người dùng
      const userRole = session.user.user_metadata?.role

      // Chỉ cho phép admin và staff truy cập trang admin
      if (userRole !== "admin" && userRole !== "staff") {
        console.log("Unauthorized access to admin area. Redirecting...")
        router.push("/user/dashboard")
        return
      }

      // Nếu là admin hoặc staff, cho phép truy cập
      setIsAuthorized(true)
    }

    checkAuthorization()
  }, [router])

  // Hiển thị loading khi đang kiểm tra quyền
  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Đang kiểm tra quyền truy cập...</span>
      </div>
    )
  }

  // Chỉ hiển thị nội dung khi đã được phép truy cập
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-[#7de3eb] dark:bg-[#1a2b3c]">{children}</main>
    </div>
  )
}
