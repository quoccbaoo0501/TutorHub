"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Tạo Supabase client với service role key cho admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export interface UpdateCustomerData {
  id: string
  full_name: string
  phone_number?: string
  address?: string
  gender: string
}

export async function updateCustomer(data: UpdateCustomerData) {
  try {
    // Cập nhật profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone_number: data.phone_number || null,
        address: data.address || null,
        gender: data.gender,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Cập nhật metadata của user
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      user_metadata: {
        full_name: data.full_name,
        phone_number: data.phone_number || null,
        address: data.address || null,
        gender: data.gender,
      },
    })

    if (metadataError) {
      return { success: false, error: metadataError.message }
    }

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (error: any) {
    console.error("Lỗi khi cập nhật khách hàng:", error)
    return { success: false, error: "Lỗi không mong muốn" }
  }
} 