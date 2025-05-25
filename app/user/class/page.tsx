"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, BookOpen, Clock, CheckCircle, Users } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header Section for Tutor */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Lớp học đã đăng ký</h1>
                <p className="text-green-100 text-lg">Theo dõi các lớp học bạn đã đăng ký dạy</p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Gia sư</span>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
          </div>

          {/* Stats Cards for Tutor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-green-100 dark:border-green-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng đăng ký</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{tutorApplications.length}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-yellow-100 dark:border-yellow-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {tutorApplications.filter((app) => app.status === "pending").length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-green-100 dark:border-green-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã được duyệt</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tutorApplications.filter((app) => app.status === "approved" || app.status === "accepted").length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content for Tutor */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-green-100 dark:border-green-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-700 dark:to-emerald-600 px-8 py-6 border-b border-green-200 dark:border-green-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lớp học đã đăng ký</h2>
                  <p className="text-gray-600 dark:text-gray-400">Theo dõi trạng thái các lớp bạn đã đăng ký dạy</p>
                </div>
              </div>
            </div>

            <div
              className={`p-8 ${userRole === "tutor" ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"}`}
            >
              {isLoading ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Đang tải danh sách lớp đã đăng ký...</p>
                </div>
              ) : (
                <TutorClassList tutorApplications={tutorApplications} onRefresh={fetchTutorApplications} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Hiển thị giao diện cho customer
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Lớp học của tôi</h1>
              <p className="text-blue-100 text-lg">Quản lý và theo dõi các yêu cầu tìm gia sư của bạn</p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl font-semibold"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Tạo Lớp Mới
            </Button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng lớp học</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{classRequests.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {classRequests.filter((c) => c.status === "pending").length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">
                  {classRequests.filter((c) => c.status === "approved").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã ghép gia sư</p>
                <p className="text-2xl font-bold text-purple-600">
                  {classRequests.filter((c) => c.status === "matched").length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách lớp học</h2>
                <p className="text-gray-600 dark:text-gray-400">Quản lý các yêu cầu tìm gia sư của bạn</p>
              </div>
            </div>
          </div>

          <div
            className={`p-8 ${userRole === "tutor" ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"}`}
          >
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Đang tải danh sách lớp học...</p>
              </div>
            ) : classRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chưa có lớp học nào</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Bạn chưa tạo yêu cầu tìm gia sư nào. Hãy bắt đầu bằng cách tạo lớp học mới.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Tạo Lớp Đầu Tiên
                </Button>
              </div>
            ) : (
              <ClassRequestList classRequests={classRequests} onClassDeleted={fetchClassRequests} />
            )}
          </div>
        </div>

        <ClassRequestDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleClassRequestSubmit} />
      </div>
    </div>
  )
}
