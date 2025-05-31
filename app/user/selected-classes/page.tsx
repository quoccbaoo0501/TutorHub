"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Users, Phone, Mail, MapPin, BookOpen, Calendar, User } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

// Trang hiển thị các lớp đã được chọn cho tutor
export default function SelectedClassesPage() {
  const [selectedClasses, setSelectedClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Khởi tạo Supabase client
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Hàm lấy thông tin giới tính
  const getGenderText = (gender: string) => {
    switch (gender) {
      case "male":
        return "Nam"
      case "female":
        return "Nữ"
      default:
        return "Khác"
    }
  }

  // Hàm tải danh sách lớp đã được chọn
  const fetchSelectedClasses = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      // Lấy danh sách các lớp mà tutor đã được chọn (status = "selected")
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
            tutor_requirements,
            special_requirements,
            created_at,
            customer_profiles:customer_id (
              full_name,
              email,
              phone_number,
              address,
              gender
            )
          )
        `)
        .eq("tutor_id", userData.user.id)
        .eq("status", "selected")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setSelectedClasses(data || [])
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp đã được chọn:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lớp đã được chọn. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  // Tải dữ liệu khi component được tải
  useEffect(() => {
    fetchSelectedClasses()
  }, [fetchSelectedClasses])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Lớp đã được chọn</h1>
              <p className="text-purple-100 text-lg">Thông tin chi tiết các lớp bạn đã được khách hàng chọn</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{selectedClasses.length} lớp</span>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Đang tải danh sách lớp đã được chọn...</p>
            </div>
          ) : selectedClasses.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chưa có lớp nào được chọn</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Bạn chưa được khách hàng nào chọn để dạy. Hãy tiếp tục đăng ký các lớp học phù hợp.
              </p>
            </div>
          ) : (
            selectedClasses.map((application) => (
              <Card
                key={application.id}
                className="overflow-hidden border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow duration-200"
              >
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {application.classes?.subject || "Không xác định"}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Cấp độ: {application.classes?.level || "Không xác định"}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                      Đã được chọn
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Thông tin khách hàng */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                      <User className="h-5 w-5" />
                      Thông tin khách hàng
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Họ tên:</span>
                        <p className="text-gray-900 dark:text-white">
                          {Array.isArray(application.classes?.customer_profiles)
                            ? application.classes.customer_profiles[0]?.full_name || "Không xác định"
                            : application.classes?.customer_profiles?.full_name || "Không xác định"}
                          {application.classes?.customer_profiles &&
                            (Array.isArray(application.classes.customer_profiles)
                              ? application.classes.customer_profiles[0]?.gender &&
                                ` (${getGenderText(application.classes.customer_profiles[0]?.gender)})`
                              : application.classes.customer_profiles.gender &&
                                ` (${getGenderText(application.classes.customer_profiles.gender)})`)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Số điện thoại:</span>
                        <p className="text-gray-900 dark:text-white flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {Array.isArray(application.classes?.customer_profiles)
                            ? application.classes.customer_profiles[0]?.phone_number || "Không có"
                            : application.classes?.customer_profiles?.phone_number || "Không có"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                        <p className="text-gray-900 dark:text-white flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {Array.isArray(application.classes?.customer_profiles)
                            ? application.classes.customer_profiles[0]?.email || "Không có"
                            : application.classes?.customer_profiles?.email || "Không có"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Địa chỉ:</span>
                        <p className="text-gray-900 dark:text-white flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {Array.isArray(application.classes?.customer_profiles)
                            ? application.classes.customer_profiles[0]?.address || "Không có"
                            : application.classes?.customer_profiles?.address || "Không có"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin lớp học */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-800 dark:text-green-300">
                      <BookOpen className="h-5 w-5" />
                      Thông tin lớp học
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Địa điểm học:</span>
                        <p className="text-gray-900 dark:text-white">
                          {application.classes?.address}, {application.classes?.district},{" "}
                          {application.classes?.province}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Lịch học:</span>
                        <p className="text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {application.classes?.schedule || "Chưa xác định"}
                        </p>
                      </div>
                      {application.classes?.tutor_requirements && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Yêu cầu gia sư:</span>
                          <p className="text-gray-900 dark:text-white">{application.classes.tutor_requirements}</p>
                        </div>
                      )}
                      {application.classes?.special_requirements && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Yêu cầu đặc biệt:</span>
                          <p className="text-gray-900 dark:text-white">{application.classes.special_requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Giới thiệu bản thân */}
                  {application.self_introduction && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-semibold text-lg mb-2 text-yellow-800 dark:text-yellow-300">
                        Giới thiệu bản thân của bạn
                      </h4>
                      <p className="text-gray-900 dark:text-white">{application.self_introduction}</p>
                    </div>
                  )}

                  {/* Thời gian đăng ký */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 border-t pt-4">
                    Đăng ký lúc: {new Date(application.created_at).toLocaleString("vi-VN")}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
