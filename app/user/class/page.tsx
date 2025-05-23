"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ClassRequestDialog } from "@/components/dialogs/class-request-dialog"
import { ClassRequestList } from "@/components/class/class-request-list"
import { TutorClassList } from "@/components/class/tutor-class-list"
import type { ClassRequest } from "@/types/class"
import { useToast } from "@/hooks/use-toast"

// Trang quản lý lớp học của người dùng
export default function ClassPage() {
  // State cho dialog tạo lớp và danh sách lớp
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [classRequests, setClassRequests] = useState<ClassRequest[]>([])
  const [tutorApplications, setTutorApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const { toast } = useToast()

  // Khởi tạo Supabase client
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Hàm lấy vai trò người dùng
  const getUserRole = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()

      if (error) {
        throw error
      }

      setUserRole(profileData.role)
      return profileData.role
    } catch (error) {
      console.error("Lỗi khi lấy vai trò người dùng:", error)
      return null
    }
  }, [supabase])

  // Hàm tải danh sách yêu cầu mở lớp cho customer
  const fetchClassRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      // Lấy thông tin người dùng hiện tại
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      // Truy vấn danh sách yêu cầu mở lớp của người dùng
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("customer_id", userData.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setClassRequests(data || [])
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lớp. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  // Hàm tải danh sách lớp đã đăng ký cho tutor
  const fetchTutorApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      // Lấy danh sách các lớp mà tutor đã đăng ký
      const { data, error } = await supabase
        .from("tutor_applications")
        .select(`
          *,
          classes (
            id,
            name,
            subject,
            level,
            province,
            district,
            address,
            schedule,
            status,
            created_at,
            customer_profiles:customer_id (
              full_name,
              email,
              phone_number
            )
          )
        `)
        .eq("tutor_id", userData.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setTutorApplications(data || [])
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp đã đăng ký:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lớp đã đăng ký. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  // Tải dữ liệu khi component được tải
  useEffect(() => {
    const loadData = async () => {
      const role = await getUserRole()
      if (role === "tutor") {
        fetchTutorApplications()
      } else {
        fetchClassRequests()
      }
    }
    loadData()
  }, [getUserRole, fetchClassRequests, fetchTutorApplications])

  // Hàm xử lý khi người dùng gửi yêu cầu mở lớp
  const handleClassRequestSubmit = async (
    newClassRequest: Omit<ClassRequest, "id" | "customer_id" | "created_at" | "status">,
  ) => {
    try {
      // Kiểm tra xem người dùng đã có 5 yêu cầu đang chờ xử lý chưa
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      const { data: pendingRequests, error: countError } = await supabase
        .from("classes")
        .select("id")
        .eq("customer_id", userData.user.id)
        .eq("status", "pending")

      if (countError) {
        throw countError
      }

      if (pendingRequests && pendingRequests.length >= 5) {
        toast({
          title: "Không thể tạo lớp",
          description: "Bạn đã có đủ yêu cầu mở lớp đang chờ xử lý (tối đa 5 lớp).",
          variant: "destructive",
        })
        return false
      }

      // Thêm yêu cầu mở lớp mới
      const { data, error } = await supabase
        .from("classes")
        .insert({
          customer_id: userData.user.id,
          name: newClassRequest.subject,
          subject: newClassRequest.subject,
          description: `Cấp độ: ${newClassRequest.level}, Địa chỉ: ${newClassRequest.address}, ${newClassRequest.district}, ${newClassRequest.province}, Lịch học: ${newClassRequest.schedule}`,
          status: "pending",
          level: newClassRequest.level,
          province: newClassRequest.province,
          district: newClassRequest.district,
          address: newClassRequest.address,
          schedule: newClassRequest.schedule,
          tutor_requirements: newClassRequest.tutor_requirements,
          special_requirements: newClassRequest.special_requirements,
        })
        .select()

      if (error) {
        throw error
      }

      toast({
        title: "Thành công",
        description: "Yêu cầu mở lớp đã được gửi thành công.",
      })

      // Tải lại danh sách lớp
      fetchClassRequests()
      return true
    } catch (error) {
      console.error("Lỗi khi tạo lớp:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo lớp. Vui lòng thử lại sau.",
        variant: "destructive",
      })
      return false
    }
  }

  if (userRole === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    )
  }

  // Hiển thị giao diện cho tutor
  if (userRole === "tutor") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Danh sách lớp học đã đăng ký</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <TutorClassList tutorApplications={tutorApplications} onRefresh={fetchTutorApplications} />
        )}
      </div>
    )
  }

  // Hiển thị giao diện cho customer
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lớp học của tôi</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo Lớp
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ClassRequestList classRequests={classRequests} onClassDeleted={fetchClassRequests} />
      )}

      <ClassRequestDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleClassRequestSubmit} />
    </div>
  )
}
