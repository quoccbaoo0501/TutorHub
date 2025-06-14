// Server actions cho việc quản lý hợp đồng
// Các hàm này xử lý việc tạo, cập nhật và truy vấn hợp đồng
"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Định nghĩa kiểu dữ liệu cho thông tin hợp đồng
interface ContractData {
  classInfo: {
    id: string
    name: string
    subject: string
    level: string
    province: string
    district: string
    address: string
    schedule: string
  }
  tutorInfo: {
    id: string
    full_name: string
    email: string
    phone_number: string
    gender: string
    education: string
    experience: string
  }
  customerInfo: {
    id: string
    full_name: string
    phone_number: string
  }
}

// Hàm lấy dữ liệu hợp đồng dựa trên ID lớp học
export async function getContractData(classId: string): Promise<ContractData | null> {
  try {
    // Khởi tạo Supabase client
    const supabase = createServerActionClient({ cookies })

    // Lấy thông tin lớp học
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        subject,
        level,
        province,
        district,
        address,
        schedule,
        customer_id,
        selected_tutor_id
      `)
      .eq("id", classId)
      .single()

    if (classError) {
      console.error("Lỗi khi lấy thông tin lớp học:", classError)
      return null
    }

    // Lấy thông tin gia sư
    const { data: tutorData, error: tutorError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone_number,
        gender
      `)
      .eq("id", classData.selected_tutor_id)
      .single()

    if (tutorError) {
      console.error("Lỗi khi lấy thông tin gia sư:", tutorError)
      return null
    }

    // Lấy thông tin bổ sung của gia sư
    const { data: tutorExtraData, error: tutorExtraError } = await supabase
      .from("tutors")
      .select(`
        education,
        experience
      `)
      .eq("id", classData.selected_tutor_id)
      .single()

    if (tutorExtraError) {
      console.error("Lỗi khi lấy thông tin bổ sung của gia sư:", tutorExtraError)
      return null
    }

    // Lấy thông tin khách hàng
    const { data: customerData, error: customerError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        phone_number
      `)
      .eq("id", classData.customer_id)
      .single()

    if (customerError) {
      console.error("Lỗi khi lấy thông tin khách hàng:", customerError)
      return null
    }

    // Tổng hợp và trả về dữ liệu hợp đồng
    return {
      classInfo: classData,
      tutorInfo: {
        ...tutorData,
        education: tutorExtraData.education || "",
        experience: tutorExtraData.experience || "",
      },
      customerInfo: customerData,
    }
  } catch (error) {
    console.error("Lỗi không mong muốn khi lấy dữ liệu hợp đồng:", error)
    return null
  }
}

// Hàm tạo hợp đồng mới
export async function createContract(
  classId: string,
  tutorId: string,
  startDate: string,
  endDate: string,
  fee: number,
) {
  try {
    // Khởi tạo Supabase client
    const supabase = createServerActionClient({ cookies })

    // Lấy thông tin lớp học để xác định customer_id
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("customer_id")
      .eq("id", classId)
      .single()

    if (classError) {
      console.error("Lỗi khi lấy thông tin lớp học:", classError)
      return { success: false, error: "Không thể lấy thông tin lớp học" }
    }

    // Tạo hợp đồng mới
    const { data, error } = await supabase.from("contracts").insert({
      class_id: classId,
      tutor_id: tutorId,
      customer_id: classData.customer_id,
      start_date: startDate,
      end_date: endDate,
      fee: fee,
      status: "active",
    })

    if (error) {
      console.error("Lỗi khi tạo hợp đồng:", error)
      return { success: false, error: "Không thể tạo hợp đồng" }
    }

    // Cập nhật trạng thái lớp học thành "matched"
    const { error: updateError } = await supabase
      .from("classes")
      .update({ status: "matched", selected_tutor_id: tutorId })
      .eq("id", classId)

    if (updateError) {
      console.error("Lỗi khi cập nhật trạng thái lớp học:", updateError)
      return { success: false, error: "Không thể cập nhật trạng thái lớp học" }
    }

    // Làm mới dữ liệu trên các trang liên quan
    revalidatePath("/admin/class")
    revalidatePath("/user/class")

    return { success: true }
  } catch (error) {
    console.error("Lỗi không mong muốn khi tạo hợp đồng:", error)
    return { success: false, error: "Đã xảy ra lỗi không mong muốn" }
  }
}

// Hàm cập nhật trạng thái hợp đồng
export async function updateContractStatus(contractId: string, status: "active" | "completed" | "cancelled") {
  try {
    // Khởi tạo Supabase client
    const supabase = createServerActionClient({ cookies })

    // Cập nhật trạng thái hợp đồng
    const { error } = await supabase.from("contracts").update({ status }).eq("id", contractId)

    if (error) {
      console.error("Lỗi khi cập nhật trạng thái hợp đồng:", error)
      return { success: false, error: "Không thể cập nhật trạng thái hợp đồng" }
    }

    // Làm mới dữ liệu trên các trang liên quan
    revalidatePath("/admin/class")
    revalidatePath("/user/class")

    return { success: true }
  } catch (error) {
    console.error("Lỗi không mong muốn khi cập nhật trạng thái hợp đồng:", error)
    return { success: false, error: "Đã xảy ra lỗi không mong muốn" }
  }
}

// Hàm lấy danh sách hợp đồng của một gia sư
export async function getTutorContracts(tutorId: string) {
  try {
    // Khởi tạo Supabase client
    const supabase = createServerActionClient({ cookies })

    // Lấy danh sách hợp đồng
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        id,
        start_date,
        end_date,
        fee,
        status,
        created_at,
        classes (
          id,
          name,
          subject,
          level
        ),
        customers:profiles!customer_id (
          full_name,
          phone_number
        )
      `)
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Lỗi khi lấy danh sách hợp đồng:", error)
      return { success: false, error: "Không thể lấy danh sách hợp đồng", data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Lỗi không mong muốn khi lấy danh sách hợp đồng:", error)
    return { success: false, error: "Đã xảy ra lỗi không mong muốn", data: null }
  }
}
