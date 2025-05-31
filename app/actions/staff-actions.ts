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

export interface CreateStaffData {
  full_name: string
  email: string
  phone_number?: string
  address?: string
  gender: string
  password: string
}

export interface UpdateStaffData {
  id: string
  full_name: string
  phone_number?: string
  address?: string
  gender: string
  password?: string
}

// Hàm helper để kiểm tra quyền admin từ cookies
async function checkAdminPermission() {
  try {
    const cookieStore = cookies()
    const accessToken = (await cookieStore).get("sb-access-token")?.value
    const refreshToken = (await cookieStore).get("sb-refresh-token")?.value

    if (!accessToken) {
      return { success: false, error: "Không tìm thấy token xác thực" }
    }

    // Tạo client với anon key để verify session
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Set session từ cookies
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
    console.error("Error checking admin permission:", error)
    return { success: false, error: "Lỗi kiểm tra quyền truy cập" }
  }
}

export async function createStaff(data: CreateStaffData) {
  try {
    // Kiểm tra quyền admin
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    // Tạo user với admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: "staff",
        full_name: data.full_name,
        phone_number: data.phone_number,
        address: data.address,
        gender: data.gender,
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Không thể tạo tài khoản người dùng" }
    }

    // Tạo profile (trigger sẽ tự động tạo từ user_metadata)
    // Nhưng chúng ta vẫn cần đảm bảo dữ liệu được tạo đúng
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      email: data.email,
      full_name: data.full_name,
      phone_number: data.phone_number || null,
      address: data.address || null,
      gender: data.gender,
      role: "staff",
    })

    if (profileError) {
      console.error("Profile error:", profileError)
      // Nếu tạo profile thất bại, xóa user đã tạo
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: profileError.message }
    }

    revalidatePath("/admin/staff")
    return { success: true, data: authData.user }
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return { success: false, error: "Lỗi không mong muốn" }
  }
}

export async function updateStaff(data: UpdateStaffData) {
  try {
    // Kiểm tra quyền admin
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

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
      console.error("Update error:", updateError)
      return { success: false, error: updateError.message }
    }

    // Cập nhật mật khẩu nếu có
    if (data.password) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.password,
      })

      if (passwordError) {
        console.error("Password update error:", passwordError)
        return { success: false, error: "Cập nhật profile thành công nhưng không thể cập nhật mật khẩu" }
      }
    }

    revalidatePath("/admin/staff")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return { success: false, error: "Lỗi không mong muốn" }
  }
}

export async function deleteStaff(staffId: string) {
  try {
    // Kiểm tra quyền admin
    const permissionCheck = await checkAdminPermission()
    if (!permissionCheck.success) {
      return { success: false, error: permissionCheck.error }
    }

    // Xóa user (profile sẽ tự động bị xóa do cascade delete)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(staffId)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath("/admin/staff")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return { success: false, error: "Lỗi không mong muốn" }
  }
}
