"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Hàm helper để kiểm tra quyền admin
async function checkAdminPermission() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("sb-access-token")?.value

    if (!accessToken) {
      return { success: false, error: "Không tìm thấy token xác thực" }
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return { success: false, error: "Session không hợp lệ" }
    }

    const userRole = user.user_metadata?.role
    if (userRole !== "admin") {
      return { success: false, error: "Chỉ admin mới có thể thực hiện hành động này" }
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error: "Lỗi kiểm tra quyền truy cập" }
  }
}

export interface AssignScheduleData {
  staff_id: string
  shift_id: string
  start_date: string
  end_date?: string
}

export async function assignStaffSchedule(data: AssignScheduleData) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    // Kiểm tra xem nhân viên đã có lịch trong ca này chưa
    const { data: existingSchedule, error: checkError } = await supabaseAdmin
      .from("staff_schedules")
      .select("*")
      .eq("staff_id", data.staff_id)
      .eq("shift_id", data.shift_id)
      .eq("status", "active")
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, error: "Lỗi kiểm tra lịch làm việc hiện tại" }
    }

    if (existingSchedule) {
      return { success: false, error: "Nhân viên đã có lịch làm việc trong ca này" }
    }

    // Tạo lịch làm việc mới
    const { error: insertError } = await supabaseAdmin.from("staff_schedules").insert({
      staff_id: data.staff_id,
      shift_id: data.shift_id,
      start_date: data.start_date,
      end_date: data.end_date || null,
      status: "active",
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath("/admin/schedule")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}

export async function removeStaffSchedule(scheduleId: string) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    const { error } = await supabaseAdmin.from("staff_schedules").delete().eq("id", scheduleId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/schedule")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}
