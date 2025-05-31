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
    const accessToken = (await cookieStore).get("sb-access-token")?.value

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

export interface SalaryData {
  staff_id: string
  base_salary: number
  bonus?: number
  deduction?: number
  month: number
  year: number
  notes?: string
}

export async function createOrUpdateSalary(data: SalaryData) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    const { error } = await supabaseAdmin.from("staff_salaries").upsert(
      {
        staff_id: data.staff_id,
        base_salary: data.base_salary,
        bonus: data.bonus || 0,
        deduction: data.deduction || 0,
        month: data.month,
        year: data.year,
        notes: data.notes,
        status: "pending",
      },
      {
        onConflict: "staff_id,month,year",
      },
    )

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/finance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}

export async function paySalary(salaryId: string) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    const { error } = await supabaseAdmin
      .from("staff_salaries")
      .update({
        status: "paid",
        paid_date: new Date().toISOString(),
      })
      .eq("id", salaryId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/finance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}

export async function cancelSalaryPayment(salaryId: string) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    const { error } = await supabaseAdmin
      .from("staff_salaries")
      .update({
        status: "pending",
        paid_date: null,
      })
      .eq("id", salaryId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/finance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}
