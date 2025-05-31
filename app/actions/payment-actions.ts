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

export interface PaymentData {
  class_id: string
  tutor_id: string
  contract_id?: string
  contract_amount: number
  actual_fee?: number
  due_date?: string
  notes?: string
}

export async function createPayment(data: PaymentData) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    // Lấy cài đặt phí môi giới hiện tại
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("payment_settings")
      .select("*")
      .eq("is_active", true)
      .single()

    if (settingsError || !settings) {
      return { success: false, error: "Không tìm thấy cài đặt phí môi giới" }
    }

    // Tính phí môi giới
    const calculatedFee = Math.max((data.contract_amount * settings.fee_percentage) / 100, settings.min_fee || 0)

    const finalCalculatedFee = settings.max_fee ? Math.min(calculatedFee, settings.max_fee) : calculatedFee

    const actualFee = data.actual_fee || finalCalculatedFee

    // Kiểm tra xem đã có phí môi giới cho lớp này chưa
    const { data: existingPayment, error: checkError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("class_id", data.class_id)
      .eq("tutor_id", data.tutor_id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, error: "Lỗi kiểm tra phí môi giới hiện tại" }
    }

    if (existingPayment) {
      return { success: false, error: "Lớp này đã có phí môi giới" }
    }

    // Tạo phí môi giới mới
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      class_id: data.class_id,
      tutor_id: data.tutor_id,
      contract_id: data.contract_id || null,
      fee_percentage: settings.fee_percentage,
      contract_amount: data.contract_amount,
      calculated_fee: finalCalculatedFee,
      actual_fee: actualFee,
      due_date: data.due_date || null,
      notes: data.notes || null,
      status: "pending",
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath("/admin/finance/payments")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}

export async function updatePayment(paymentId: string, data: Partial<PaymentData> & { status?: string }) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    const updateData: any = {}

    if (data.actual_fee !== undefined) updateData.actual_fee = data.actual_fee
    if (data.due_date !== undefined) updateData.due_date = data.due_date
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === "paid") {
        updateData.paid_date = new Date().toISOString()
      } else if (data.status === "pending") {
        updateData.paid_date = null
      }
    }

    const { error } = await supabaseAdmin.from("payments").update(updateData).eq("id", paymentId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/finance/payments")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}

export async function updatePaymentSettings(feePercentage: number, minFee: number, maxFee?: number) {
  try {
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    // Vô hiệu hóa cài đặt cũ
    await supabaseAdmin.from("payment_settings").update({ is_active: false }).eq("is_active", true)

    // Tạo cài đặt mới
    const { error } = await supabaseAdmin.from("payment_settings").insert({
      fee_percentage: feePercentage,
      min_fee: minFee,
      max_fee: maxFee || null,
      is_active: true,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/finance/payments")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Lỗi không mong muốn" }
  }
}
