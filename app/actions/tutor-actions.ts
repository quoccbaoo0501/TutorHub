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

export interface UpdateTutorData {
  id: string
  profile_id: string
  full_name: string
  phone_number?: string
  address?: string
  gender: string
  education: string
  experience: string
  subjects: string
}

export async function updateTutor(data: UpdateTutorData) {
  try {
    // Cập nhật profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone_number: data.phone_number || null,
        address: data.address || null,
        gender: data.gender,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.profile_id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // Cập nhật metadata của user
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(data.profile_id, {
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

    // Cập nhật thông tin gia sư
    const { error: tutorError } = await supabaseAdmin
      .from("tutors")
      .update({
        education: data.education,
        experience: data.experience,
        subjects: data.subjects,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)

    if (tutorError) {
      return { success: false, error: tutorError.message }
    }

    revalidatePath("/admin/tutors")
    return { success: true }
  } catch (error: any) {
    console.error("Lỗi khi cập nhật gia sư:", error)
    return { success: false, error: "Lỗi không mong muốn" }
  }
} 