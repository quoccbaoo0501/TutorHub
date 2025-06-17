import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Đếm tổng số lớp học
    const { count: totalClasses } = await supabase.from("classes").select("*", { count: "exact", head: true })
    // Đếm tổng số khách hàng
    const { count: totalCustomers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer")
    // Đếm tổng số gia sư
    const { count: totalTutors } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tutor")
    // Đếm tổng số lớp học chờ duyệt
    const { count: pendingClasses } = await supabase.from("classes").select("*", { count: "exact", head: true }).eq("status", "pending")
    // Đếm tổng số nhân viên thực tế
    const { count: totalStaff } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "staff")
    // Doanh thu tháng (ví dụ: tổng hợp từ bảng payments, tuỳ cấu trúc DB)
    // const { data: payments } = await supabase.from("payments").select("amount").gte("created_at", "2024-06-01")
    // const monthlyRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    // Tạm thời hardcode doanh thu
    const monthlyRevenue = 25600000

    return NextResponse.json({
      totalClasses: totalClasses || 0,
      totalCustomers: totalCustomers || 0,
      totalTutors: totalTutors || 0,
      pendingClasses: pendingClasses || 0,
      totalStaff: totalStaff || 0,
      monthlyRevenue,
    })
  } catch (error) {
    console.error("Lỗi thống kê admin:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
} 