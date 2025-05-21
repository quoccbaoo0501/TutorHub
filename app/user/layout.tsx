"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import ClientLayout from "@/components/layout/client-layout"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // State để kiểm soát việc xác thực quyền truy cập
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()

  // Kiểm tra quyền truy cập khi component được tải
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

      // Nếu là admin hoặc staff, chuyển hướng đến trang admin
      if (userRole === "admin" || userRole === "staff") {
        console.log("Admin/staff accessing user area. Redirecting...")
        router.push("/admin/dashboard")
        return
      }

      // Nếu là người dùng thông thường, cho phép truy cập
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
  return <ClientLayout>{children}</ClientLayout>
}
