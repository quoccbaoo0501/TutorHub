"use client"

// Import các thư viện và component cần thiết
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, User } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { ClassRequest } from "@/types/class"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

// Định nghĩa kiểu dữ liệu mở rộng cho ClassRequest với profiles
// Bao gồm thông tin của người tạo lớp học (customer)
interface ClassRequestWithProfiles extends ClassRequest {
  customer_profiles?:
    | {
        full_name: string
        email?: string
        phone_number?: string
      }
    | {
        full_name: string
        email?: string
        phone_number?: string
      }[]
}

// Định nghĩa kiểu dữ liệu cho thông tin profile của gia sư
interface TutorProfile {
  id: string
  education: string
  experience: string
  subjects: string
  profiles: {
    full_name: string
    email: string
    phone_number: string
    gender?: string | null
  } | null
}

// Hàm chuyển đổi mã giới tính thành văn bản hiển thị tiếng Việt
const getGenderText = (gender: string | undefined | null) => {
  if (!gender) return "Không xác định"

  switch (gender) {
    case "male":
      return "Nam"
    case "female":
      return "Nữ"
    case "other":
      return "Khác"
    default:
      return "Không xác định"
  }
}

// Component Dashboard chính, hiển thị nội dung khác nhau dựa trên vai trò người dùng
export default function UserDashboard() {
  // Các state quản lý dữ liệu và trạng thái của component
  const [approvedClasses, setApprovedClasses] = useState<ClassRequestWithProfiles[]>([]) // Danh sách các lớp đã được duyệt
  const [approvedTutors, setApprovedTutors] = useState<TutorProfile[]>([]) // Danh sách các gia sư đã được duyệt
  const [isLoading, setIsLoading] = useState(true) // Trạng thái đang tải dữ liệu
  const [userRole, setUserRole] = useState<string | null>(null) // Vai trò của người dùng hiện tại
  const { toast } = useToast() // Hook hiển thị thông báo
  const supabase = createClientComponentClient() // Khởi tạo Supabase client
  const [isDialogOpen, setIsDialogOpen] = useState(false) // Trạng thái mở/đóng dialog đăng ký dạy
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null) // ID lớp học được chọn để đăng ký
  const [selfIntroduction, setSelfIntroduction] = useState("") // Nội dung giới thiệu bản thân khi đăng ký dạy
  const [registeredClasses, setRegisteredClasses] = useState<string[]>([]) // Danh sách các lớp đã đăng ký
  const [isCertificateApproved, setIsCertificateApproved] = useState<boolean | null>(null) // Trạng thái chứng chỉ của tutor
  const router = useRouter() // Hook điều hướng
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false) // Trạng thái mở/đóng dialog thông báo hồ sơ chưa được duyệt

  // Hàm định dạng ngày tháng theo định dạng Việt Nam
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Hàm chuyển đổi mã cấp độ thành văn bản hiển thị tiếng Việt
  const getLevelText = (level: string) => {
    switch (level) {
      case "primary":
        return "Tiểu học"
      case "secondary":
        return "THCS"
      case "high":
        return "THPT"
      case "university":
        return "Đại học"
      case "other":
        return "Khác"
      default:
        return level
    }
  }

  // Hàm mở dialog đăng ký dạy lớp
  const handleOpenRegistrationDialog = (classId: string) => {
    setSelectedClassId(classId)
    setSelfIntroduction("")
    setIsDialogOpen(true)
  }

  // Hàm xử lý việc đăng ký dạy lớp
  const handleRegisterToTeach = async () => {
    if (!selectedClassId) return

    try {
      // Lấy thông tin người dùng hiện tại
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      // Kiểm tra xem tutor đã đăng ký lớp này chưa
      const { data: existingApplication, error: checkError } = await supabase
        .from("tutor_applications")
        .select("id")
        .eq("tutor_id", userData.user.id)
        .eq("class_id", selectedClassId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      // Nếu đã đăng ký rồi, hiển thị thông báo và không thực hiện tiếp
      if (existingApplication) {
        toast({
          title: "Thông báo",
          description: "Bạn đã đăng ký lớp này rồi.",
          variant: "destructive",
        })
        setIsDialogOpen(false)
        return
      }

      // Tạo đăng ký mới với thông tin giới thiệu bản thân
      const { error } = await supabase.from("tutor_applications").insert({
        tutor_id: userData.user.id,
        class_id: selectedClassId,
        status: "pending",
        self_introduction:
          selfIntroduction || "Tôi rất quan tâm đến lớp học này và mong muốn được đóng góp kiến thức của mình.",
      })

      if (error) {
        throw error
      }

      // Cập nhật danh sách các lớp đã đăng ký
      setRegisteredClasses((prev) => [...prev, selectedClassId])

      // Hiển thị thông báo thành công
      toast({
        title: "Thành công",
        description: "Đăng ký dạy lớp thành công! Vui lòng chờ admin duyệt.",
      })

      // Đóng dialog
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Lỗi khi đăng ký dạy:", error)
      toast({
        title: "Lỗi",
        description: "Không thể đăng ký dạy lớp. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Hàm xử lý việc hủy đăng ký dạy lớp
  const handleCancelRegistration = async (classId: string) => {
    try {
      // Lấy thông tin người dùng hiện tại
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      // Xóa đăng ký
      const { error } = await supabase
        .from("tutor_applications")
        .delete()
        .eq("tutor_id", userData.user.id)
        .eq("class_id", classId)

      if (error) {
        throw error
      }

      // Cập nhật danh sách các lớp đã đăng ký
      setRegisteredClasses((prev) => prev.filter((id) => id !== classId))

      // Hiển thị thông báo thành công
      toast({
        title: "Thành công",
        description: "Đã hủy đăng ký lớp học thành công.",
      })
    } catch (error) {
      console.error("Lỗi khi hủy đăng ký:", error)
      toast({
        title: "Lỗi",
        description: "Không thể hủy đăng ký. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // useEffect tải dữ liệu ban đầu khi component được tải
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Lấy vai trò người dùng
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          throw new Error("Không tìm thấy thông tin người dùng")
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setUserRole(profileData.role)

        // Tải dữ liệu dựa trên vai trò người dùng
        if (profileData.role === "tutor") {
          // Lấy tất cả các lớp đã được duyệt từ database cho tutor
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
              status,
              created_at,
              updated_at,
              customer_id,
              customer_profiles:profiles!customer_id(
                full_name,
                email,
                phone_number
              )
            `)
            .eq("status", "approved")
            .order("created_at", { ascending: false })

          if (classError) {
            throw classError
          }

          setApprovedClasses(classData || [])
        } else {
          // Lấy danh sách gia sư đã được duyệt cho customer
          const { data: tutorData, error: tutorError } = await supabase
          .from("tutors")
          .select(`
            id,
            education,
            experience,
            subjects,
            certificate_approve,
            profiles (
              full_name,
              email,
              phone_number,
              gender
            )
          `) // Đã sửa phần join profiles
          .eq("certificate_approve", true)
          .order("created_at", { ascending: false })

          if (tutorError) {
            throw tutorError
          }

          // Xử lý dữ liệu gia sư để đảm bảo cấu trúc nhất quán
          const processedTutorData = (tutorData || []).map((tutor) => ({
            id: tutor.id,
            education: tutor.education,
            experience: tutor.experience,
            subjects: tutor.subjects,
            profiles: Array.isArray(tutor.profiles) ? (tutor.profiles[0] || null) : (tutor.profiles || null),
          }))

          setApprovedTutors(processedTutorData)
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, toast])

  // useEffect tải danh sách các lớp mà tutor đã đăng ký
  useEffect(() => {
    async function fetchRegisteredClasses() {
      if (userRole !== "tutor") return

      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { data, error } = await supabase
          .from("tutor_applications")
          .select("class_id")
          .eq("tutor_id", userData.user.id)

        if (error) throw error

        setRegisteredClasses(data.map((item) => item.class_id))
      } catch (error) {
        console.error("Error fetching registered classes:", error)
      }
    }

    fetchRegisteredClasses()
  }, [supabase, userRole])

  // useEffect kiểm tra trạng thái chứng chỉ của tutor
  useEffect(() => {
    async function checkCertificateStatus() {
      if (userRole !== "tutor") return

      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { data, error } = await supabase
          .from("tutors")
          .select("certificate_approve")
          .eq("id", userData.user.id)
          .single()

        if (error) throw error

        setIsCertificateApproved(data?.certificate_approve || false)
      } catch (error) {
        console.error("Error checking certificate status:", error)
        setIsCertificateApproved(false)
      }
    }

    checkCertificateStatus()
  }, [supabase, userRole])

  // Hiển thị trạng thái đang tải khi chưa có thông tin vai trò
  if (userRole === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    )
  }

  // Phần render chính của component
  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Chào mừng bạn đến với TutorHub!</p>
      </div>

      {userRole === "tutor" ? (
        // Hiển thị nội dung cho tutor
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Danh sách các lớp đã được duyệt</h2>

          {/* Hiển thị trạng thái đang tải hoặc danh sách lớp học */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : approvedClasses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Chưa có lớp nào được duyệt.</p>
            </div>
          ) : (
            // Hiển thị danh sách các lớp học đã được duyệt
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedClasses.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">{classItem.subject}</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Thông tin chi tiết về lớp học */}
                      <div className="text-sm">
                        <span className="font-medium">Cấp độ:</span> {getLevelText(classItem.level)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Địa điểm:</span> {classItem.district}, {classItem.province}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Lịch học:</span> {classItem.schedule}
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Ngày tạo:</span> {formatDate(classItem.created_at)}
                      </div>
                      {/* Nút đăng ký hoặc hủy đăng ký dạy lớp */}
                      <Button
                        variant={registeredClasses.includes(classItem.id) ? "destructive" : "default"}
                        size="sm"
                        className="mt-2 w-full"
                        disabled={isCertificateApproved === null} // Disable button khi chưa load xong trạng thái
                        onClick={() => {
                          if (registeredClasses.includes(classItem.id)) {
                            // Nếu đã đăng ký, cho phép hủy đăng ký
                            handleCancelRegistration(classItem.id)
                          } else {
                            // Kiểm tra trạng thái chứng chỉ trước khi cho phép đăng ký
                            if (isCertificateApproved === null) {
                              // Nếu chưa load xong trạng thái, không làm gì
                              return
                            } else if (isCertificateApproved === false) {
                              // Nếu chứng chỉ chưa được duyệt, hiển thị dialog thông báo
                              setIsProfileDialogOpen(true)
                            } else {
                              // Nếu chứng chỉ đã được duyệt, mở dialog đăng ký
                              handleOpenRegistrationDialog(classItem.id)
                            }
                          }
                        }}
                      >
                        {isCertificateApproved === null
                          ? "Đang tải..."
                          : registeredClasses.includes(classItem.id)
                            ? "Hủy đăng ký"
                            : "Đăng ký dạy"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Hiển thị nội dung cho customer
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Danh sách các gia sư</h2>

          {/* Hiển thị trạng thái đang tải hoặc danh sách gia sư */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : approvedTutors.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Chưa có gia sư nào được duyệt.</p>
            </div>
          ) : (
            // Hiển thị danh sách các gia sư đã được duyệt
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedTutors.map((tutor) => (
                <Card key={tutor.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                      {tutor.profiles?.full_name || "Không xác định"}
                    </CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Thông tin chi tiết về gia sư */}
                      <div className="text-sm">
                        <span className="font-medium">Học vấn:</span> {tutor.education}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Môn dạy:</span> {tutor.subjects}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Giới tính:</span>{" "}
                        {tutor.profiles ? getGenderText(tutor.profiles.gender) : "Không xác định"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Kinh nghiệm:</span> {tutor.experience}
                      </div>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        Xem chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Dialog cho việc nhập thông tin giới thiệu khi đăng ký dạy lớp */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Đăng ký dạy lớp</DialogTitle>
            <DialogDescription>Hãy giới thiệu về bản thân và lý do bạn muốn dạy lớp này</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="self-introduction">Giới thiệu bản thân</Label>
              <Textarea
                id="self-introduction"
                placeholder="Tôi rất quan tâm đến lớp học này và mong muốn được đóng góp kiến thức của mình..."
                value={selfIntroduction}
                onChange={(e) => setSelfIntroduction(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRegisterToTeach}>Đăng ký</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog hiển thị khi tutor chưa được duyệt hồ sơ và cố gắng đăng ký dạy lớp */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hồ sơ chưa được duyệt</DialogTitle>
            <DialogDescription>
              Hồ sơ của bạn chưa được duyệt. Vui lòng cập nhật và tải lên chứng chỉ để có thể đăng ký dạy lớp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
              Đóng
            </Button>
            <Button
              onClick={() => {
                setIsProfileDialogOpen(false)
                router.push("/user/profile")
              }}
            >
              Cập nhật hồ sơ ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
