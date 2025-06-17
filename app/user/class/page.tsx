"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, BookOpen, Clock, CheckCircle, Users } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ClassRequestDialog } from "@/components/dialogs/class-request-dialog"
import { ClassRequestList } from "@/components/class/class-request-list"
import TutorClassList from "@/components/class/tutor-class-list"
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
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

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

      // Lấy tutor applications trước
      const { data: applications, error: appError } = await supabase
        .from("tutor_applications")
        .select("*")
        .eq("tutor_id", userData.user.id)
        .order("created_at", { ascending: false })

      if (appError) throw appError

      // Lấy thông tin classes riêng biệt
      const classIds = applications?.map((app) => app.class_id) || []
      const { data: classes, error: classError } = await supabase
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
          status,
          created_at,
          customer_profiles:customer_id (
            full_name,
            email,
            phone_number
          )
        `)
        .in("id", classIds)

      if (classError) throw classError

      // Kết hợp dữ liệu
      const data = applications?.map((app) => ({
        ...app,
        classes: classes?.find((cls) => cls.id === app.class_id) || null,
      }))

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

  const getFilteredClassRequests = () => {
    switch (selectedFilter) {
      case "pending":
        return classRequests.filter((c) => c.status === "pending")
      case "approved":
        return classRequests.filter((c) => c.status === "approved")
      case "matched":
        return classRequests.filter((c) => c.status === "matched")
      default:
        return classRequests
    }
  }

  const getTranslateFromSelectedFilter = () => {
    switch (selectedFilter) {
      case "all": // Thêm trường hợp cho "all"
        return "Tất cả"
      case "pending":
        return "Chờ Duyệt"
      case "approved":
        return "Đã Duyệt"
      case "matched":
        return "Đã ghép gia sư"
      case "selected": // Thêm case này cho tutor
        return "Đã được chọn"
      default:
        return "Không xác định"
    }
  }

  const getFilteredTutorApplications = () => {
    switch (selectedFilter) {
      case "pending":
        return tutorApplications.filter((app) => app.status === "pending")
      case "approved":
        return tutorApplications.filter((app) => app.status === "approved") // Xóa || app.status === "accepted"
      case "selected":
        return tutorApplications.filter((app) => app.status === "selected")
      default:
        return tutorApplications
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
      <div className="min-h-screen bg-[#7de3eb] flex flex-col md:flex-row p-6">
        {/* Sidebar thống kê */}
        <div className="w-full md:w-1/4 mb-6 md:mb-0 md:mr-6 flex flex-col gap-4">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "all" ? "border-cyan-500 ring-2 ring-cyan-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Tổng đăng ký</div>
              <div className="text-2xl font-bold text-cyan-700">{tutorApplications.length}</div>
            </div>
            <Users className="h-7 w-7 text-cyan-400 ml-2" />
          </button>
          <button
            onClick={() => setSelectedFilter("pending")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "pending" ? "border-yellow-500 ring-2 ring-yellow-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Chờ duyệt</div>
              <div className="text-2xl font-bold text-yellow-500">{tutorApplications.filter(app => app.status === "pending").length}</div>
            </div>
            <Clock className="h-7 w-7 text-yellow-400 ml-2" />
          </button>
          <button
            onClick={() => setSelectedFilter("approved")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "approved" ? "border-green-500 ring-2 ring-green-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Đã được duyệt</div>
              <div className="text-2xl font-bold text-green-600">{tutorApplications.filter(app => app.status === "approved").length}</div>
            </div>
            <CheckCircle className="h-7 w-7 text-green-400 ml-2" />
          </button>
          <button
            onClick={() => setSelectedFilter("selected")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "selected" ? "border-purple-500 ring-2 ring-purple-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Đã được chọn</div>
              <div className="text-2xl font-bold text-purple-600">{tutorApplications.filter(app => app.status === "selected").length}</div>
            </div>
            <CheckCircle className="h-7 w-7 text-purple-400 ml-2" />
          </button>
        </div>

        {/* Main content */}
        <div className="w-full md:flex-1">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-3xl font-bold text-cyan-800 mb-2">Lớp học đã đăng ký</h1>
            <p className="text-gray-600 mb-4">Theo dõi các lớp học bạn đã đăng ký dạy</p>
            {/* Danh sách lớp */}
            <TutorClassList tutorApplications={getFilteredTutorApplications()} onRefresh={fetchTutorApplications} />
          </div>
        </div>
      </div>
    )
  }

  // Hiển thị giao diện cho customer
  return (
    <div className="min-h-screen bg-[#7de3eb] py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 px-4">
        {/* Sidebar thống kê */}
        <div className="w-full md:w-1/4 md:min-h-screen mb-6 md:mb-0 md:mr-0 flex flex-col gap-4 p-6">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "all" ? "border-cyan-500 ring-2 ring-cyan-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Tổng lớp học</div>
              <div className="text-2xl font-bold text-cyan-700">{classRequests.length}</div>
            </div>
            <BookOpen className="h-7 w-7 text-cyan-400 ml-2" />
          </button>
          <button
            onClick={() => setSelectedFilter("pending")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "pending" ? "border-yellow-500 ring-2 ring-yellow-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Chờ duyệt</div>
              <div className="text-2xl font-bold text-yellow-500">{classRequests.filter(c => c.status === "pending").length}</div>
            </div>
            <Clock className="h-7 w-7 text-yellow-400 ml-2" />
          </button>
          <button
            onClick={() => setSelectedFilter("approved")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "approved" ? "border-green-500 ring-2 ring-green-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Đã duyệt</div>
              <div className="text-2xl font-bold text-green-600">{classRequests.filter(c => c.status === "approved").length}</div>
            </div>
            <CheckCircle className="h-7 w-7 text-green-400 ml-2" />
          </button>
          <button
            onClick={() => setSelectedFilter("matched")}
            className={`bg-white rounded-xl shadow p-4 flex items-start transition border-2 ${
              selectedFilter === "matched" ? "border-purple-500 ring-2 ring-purple-200" : "border-transparent"
            }`}
          >
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-500">Đã ghép gia sư</div>
              <div className="text-2xl font-bold text-purple-600">{classRequests.filter(c => c.status === "matched").length}</div>
            </div>
            <Users className="h-7 w-7 text-purple-400 ml-2" />
          </button>
        </div>

        {/* Main content */}
        <div className="w-full md:flex-1 md:min-h-screen flex flex-col p-6">
          <div className="bg-white rounded-xl shadow p-6 flex-1">
            <h1 className="text-3xl font-bold text-cyan-800 mb-2">Lớp học của tôi</h1>
            <p className="text-gray-600 mb-4">Quản lý và theo dõi các yêu cầu tìm gia sư của bạn</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl font-semibold mb-4"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Tạo Lớp Mới
            </Button>
            {/* Danh sách lớp */}
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
                <p className="text-gray-600 font-medium">Đang tải danh sách lớp học...</p>
              </div>
            ) : getFilteredClassRequests().length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có lớp học nào</h3>
                <p className="text-gray-600 mb-6">
                  Bạn chưa tạo yêu cầu tìm gia sư nào. Hãy bắt đầu bằng cách tạo lớp học mới.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-cyan-600 text-white hover:bg-cyan-700 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Tạo Lớp Đầu Tiên
                </Button>
              </div>
            ) : (
              <>
                <ClassRequestList classRequests={getFilteredClassRequests()} onClassDeleted={fetchClassRequests} />
              </>
            )}
          </div>
          <ClassRequestDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleClassRequestSubmit} />
        </div>
      </div>
    </div>
  )
}
