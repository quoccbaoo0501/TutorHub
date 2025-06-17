"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, Calendar, Users, User, Book, Clock, FileText, MapPin, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ContractDialog from "@/components/dialogs/contract-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Định nghĩa kiểu dữ liệu cho lớp học
interface Class {
  id: string
  name: string
  subject: string
  level: string
  province: string
  district: string
  address: string
  schedule: string
  status: string
  created_at: string
  updated_at: string
  customer_id: string
  tutor_requirements?: string
  special_requirements?: string
  selected_tutor_id?: string
  customer_name?: string
  tutor_name?: string
  enrolled?: number
  capacity?: number
  customer_profiles?: {
    full_name: string
    email?: string
    phone_number?: string
    gender?: string
  }
  tutor_profiles?: {
    id: string
    profiles: {
      full_name: string
      email?: string
      phone_number?: string
      gender?: string
    }
  }
}

interface TutorApplication {
  id: string
  tutor_id: string
  class_id: string
  status: string
  self_introduction?: string
  created_at: string
  tutors: {
    id: string
    education: string
    experience: string
    subjects: string
    profiles: {
      full_name: string
      email: string
      phone_number: string
      gender?: string
    }
  }
}

export default function AdminClassPage() {
  // State cho dữ liệu và UI
  const [classes, setClasses] = useState<Class[]>([])
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Class
    direction: "ascending" | "descending"
  }>({ key: "created_at", direction: "descending" })

  // State cho dialog chi tiết
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tutorApplications, setTutorApplications] = useState<TutorApplication[]>([])
  const [isLoadingTutors, setIsLoadingTutors] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [contractData, setContractData] = useState<{
    tutorProfile: any
    classData: any
    contract: any
  } | null>(null)

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Danh sách các trạng thái lớp học
  const statuses = ["all", "pending", "approved", "matched", "rejected", "completed"]

  // Danh sách các cấp độ lớp học
  const levels = ["all", "primary", "secondary", "high", "university", "other"]

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Hàm chuyển đổi mã cấp độ thành văn bản hiển thị
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

  // Hàm chuyển đổi mã trạng thái thành văn bản hiển thị
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ duyệt"
      case "approved":
        return "Đã duyệt"
      case "matched":
        return "Đã ghép gia sư"
      case "rejected":
        return "Từ chối"
      case "completed":
        return "Hoàn thành"
      default:
        return status
    }
  }

  // Hàm chuyển đổi mã giới tính thành văn bản hiển thị
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

  // Hàm định dạng ngày tháng theo định dạng Việt Nam
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Hàm xử lý sắp xếp
  const handleSort = (key: keyof Class) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Sửa hàm handleViewContract để đảm bảo dữ liệu được truyền đúng cách
  const handleViewContract = async (classItem: Class) => {
    if (!classItem.selected_tutor_id) {
      toast({
        title: "Lỗi",
        description: "Lớp học này chưa được ghép với gia sư nào.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Fetch tutor profile data
      const { data: tutorData, error: tutorError } = await supabase
        .from("tutors")
        .select(`
        id,
        education,
        experience,
        subjects,
        profiles (
          full_name,
          email,
          phone_number,
          gender
        )
      `)
        .eq("id", classItem.selected_tutor_id)
        .single()

      if (tutorError) {
        throw tutorError
      }

      // Fetch contract data if exists
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("class_id", classItem.id)
        .eq("tutor_id", classItem.selected_tutor_id)
        .single()

      // It's okay if contract doesn't exist yet
      if (contractError && contractError.code !== "PGRST116") {
        throw contractError
      }

      // Combine tutor profile data with tutor data
      const combinedTutorData = {
        ...tutorData.profiles,
        education: tutorData.education,
        experience: tutorData.experience,
        subjects: tutorData.subjects,
      }

      setContractData({
        tutorProfile: combinedTutorData,
        classData: classItem,
        contract: contractData || null,
      })

      setIsContractDialogOpen(true)
    } catch (error) {
      console.error("Error fetching contract data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin hợp đồng. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm mở dialog chi tiết
  const handleOpenDetails = async (classItem: Class) => {
    try {
      setSelectedClass(classItem)
      setIsDialogOpen(true)

      // Tải danh sách gia sư đã đăng ký nếu lớp đã được duyệt
      if (classItem.status === "approved" || classItem.status === "matched") {
        setIsLoadingTutors(true)
        try {
          // Check session before making request
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()
          if (sessionError || !session) {
            throw new Error("Session expired")
          }

          const { data: applicationsData, error: applicationsError } = await supabase
            .from("tutor_applications")
            .select(`
              *,
              tutors (
                id,
                education,
                experience,
                subjects,
                profiles (*)
              )
            `)
            .eq("class_id", classItem.id)
            .order("created_at", { ascending: false })

          if (applicationsError) throw applicationsError

          setTutorApplications(applicationsData || [])
        } catch (error) {
          console.error("Lỗi khi tải danh sách gia sư:", error)
          toast({
            title: "Lỗi",
            description: "Không thể tải danh sách gia sư. Vui lòng thử lại sau.",
            variant: "destructive",
          })
        } finally {
          setIsLoadingTutors(false)
        }
      }
    } catch (error) {
      console.error("Error opening details:", error)
      toast({
        title: "Lỗi",
        description: "Không thể mở chi tiết lớp học.",
        variant: "destructive",
      })
    }
  }

  // Tải dữ liệu lớp học từ Supabase
  useEffect(() => {
    async function fetchClasses() {
      setIsLoading(true)
      try {
        // Check authentication first
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError) {
          console.error("Session error:", sessionError)
          window.location.href = "/login"
          return
        }
        if (!session) {
          window.location.href = "/login"
          return
        }

        // Lấy danh sách lớp học từ Supabase
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select(`
        *,
        customer_profiles:profiles!customer_id(full_name, gender),
        tutor_profiles:tutors!selected_tutor_id(
          id,
          profiles(full_name, gender)
        )
      `)
          .order("created_at", { ascending: false })

        if (classesError) {
          throw classesError
        }

        // Xử lý dữ liệu để phù hợp với giao diện
        const processedData = (classesData || []).map((cls) => ({
          ...cls,
          customer_name: cls.customer_profiles?.full_name || "Không xác định",
          tutor_name: cls.tutor_profiles?.profiles?.full_name || "Chưa có",
        }))

        setClasses(processedData)
        setFilteredClasses(processedData)
      } catch (error) {
        console.error("Lỗi khi tải danh sách lớp học:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách lớp học. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [supabase, toast])

  // Add this after the existing useEffect for fetchClasses
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Auth error:", error)
          // Redirect to login if session is invalid
          window.location.href = "/login"
          return
        }
        if (!session) {
          window.location.href = "/login"
          return
        }
      } catch (error) {
        console.error("Session check error:", error)
        window.location.href = "/login"
      }
    }

    checkAuth()
  }, [supabase])

  // Lấy role của user hiện tại
  useEffect(() => {
    const getUserRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        const userRole = session.user.user_metadata?.role
        setUserRole(userRole)
      }
    }
    getUserRole()
  }, [supabase])

  // Lọc và sắp xếp dữ liệu khi các điều kiện thay đổi
  useEffect(() => {
    // Lọc dữ liệu theo từ khóa tìm kiếm và trạng thái
    const result = classes.filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.tutor_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = selectedStatus === "all" || cls.status === selectedStatus
      const matchesLevel = selectedLevel === "all" || cls.level === selectedLevel

      return matchesSearch && matchesStatus && matchesLevel
    })

    // Sắp xếp dữ liệu
    result.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === undefined || bValue === undefined) return 0

      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortConfig.direction === "ascending") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        if (sortConfig.direction === "ascending") {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      }

      return 0
    })

    setFilteredClasses(result)
  }, [classes, searchTerm, selectedStatus, selectedLevel, sortConfig])

  // Hàm xử lý duyệt lớp học
  const handleApproveClass = async (classId: string) => {
    try {
      const { error } = await supabase.from("classes").update({ status: "approved" }).eq("id", classId)

      if (error) throw error

      // Cập nhật state
      setClasses((prevClasses) => prevClasses.map((cls) => (cls.id === classId ? { ...cls, status: "approved" } : cls)))

      // Cập nhật selectedClass nếu đang mở dialog
      if (selectedClass && selectedClass.id === classId) {
        setSelectedClass({ ...selectedClass, status: "approved" })
      }

      toast({
        title: "Thành công",
        description: "Đã duyệt lớp học thành công.",
      })
    } catch (error) {
      console.error("Lỗi khi duyệt lớp học:", error)
      toast({
        title: "Lỗi",
        description: "Không thể duyệt lớp học. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Hàm xử lý từ chối lớp học
  const handleRejectClass = async (classId: string) => {
    try {
      const { error } = await supabase.from("classes").update({ status: "rejected" }).eq("id", classId)

      if (error) throw error

      // Cập nhật state
      setClasses((prevClasses) => prevClasses.map((cls) => (cls.id === classId ? { ...cls, status: "rejected" } : cls)))

      // Cập nhật selectedClass nếu đang mở dialog
      if (selectedClass && selectedClass.id === classId) {
        setSelectedClass({ ...selectedClass, status: "rejected" })
      }

      toast({
        title: "Thành công",
        description: "Đã từ chối lớp học thành công.",
      })
    } catch (error) {
      console.error("Lỗi khi từ chối lớp học:", error)
      toast({
        title: "Lỗi",
        description: "Không thể từ chối lớp học. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Hàm xử lý duyệt đơn đăng ký của gia sư
  const handleApproveTutor = async (applicationId: string, tutorId: string) => {
    if (!selectedClass) return

    setIsProcessing(true)
    try {
      // Cập nhật trạng thái đơn đăng ký thành approved
      const { error: applicationError } = await supabase
        .from("tutor_applications")
        .update({ status: "approved" })
        .eq("id", applicationId)

      if (applicationError) throw applicationError

      // Cập nhật danh sách đơn đăng ký
      setTutorApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: "approved" } : app)),
      )

      toast({
        title: "Thành công",
        description: "Đã duyệt gia sư thành công.",
      })
    } catch (error) {
      console.error("Lỗi khi duyệt gia sư:", error)
      toast({
        title: "Lỗi",
        description: "Không thể duyệt gia sư. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm xử lý từ chối đơn đăng ký của gia sư
  const handleRejectTutor = async (applicationId: string) => {
    setIsProcessing(true)
    try {
      const { error } = await supabase.from("tutor_applications").update({ status: "rejected" }).eq("id", applicationId)

      if (error) throw error

      // Cập nhật danh sách đơn đăng ký
      setTutorApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: "rejected" } : app)),
      )

      toast({
        title: "Thành công",
        description: "Đã từ chối gia sư thành công.",
      })
    } catch (error) {
      console.error("Lỗi khi từ chối gia sư:", error)
      toast({
        title: "Lỗi",
        description: "Không thể từ chối gia sư. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm xử lý xóa lớp học
  const handleDeleteClass = async (classId: string) => {
    try {
      setIsProcessing(true)

      // Xóa các bản ghi liên quan trước
      await supabase.from("tutor_applications").delete().eq("class_id", classId)
      await supabase.from("contracts").delete().eq("class_id", classId)

      // Xóa lớp học
      const { error } = await supabase.from("classes").delete().eq("id", classId)

      if (error) throw error

      // Cập nhật state
      setClasses((prevClasses) => prevClasses.filter((cls) => cls.id !== classId))

      toast({
        title: "Thành công",
        description: "Đã xóa lớp học thành công.",
      })

      setDeleteConfirmOpen(false)
      setClassToDelete(null)
    } catch (error) {
      console.error("Lỗi khi xóa lớp học:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa lớp học. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm lấy màu badge dựa trên trạng thái
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "outline"
      case "approved":
        return "secondary"
      case "matched":
        return "default"
      case "rejected":
        return "destructive"
      case "completed":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý lớp học</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên lớp, môn học, khách hàng..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "Tất cả trạng thái" : getStatusText(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Cấp độ" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level} value={level}>
                {level === "all" ? "Tất cả cấp độ" : getLevelText(level)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop view - Table */}
          <div className="hidden md:block overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("name")}>
                      Tên lớp
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("customer_name")}>
                      Khách hàng
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("level")}>
                      Cấp độ
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("status")}>
                      Trạng thái
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("created_at")}>
                      Ngày tạo
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{cls.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cls.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{getLevelText(cls.level)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={getStatusBadgeVariant(cls.status)}>{getStatusText(cls.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(cls.created_at).split(",")[0]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDetails(cls)}>
                          Chi tiết
                        </Button>
                        {cls.status === "pending" && (
                          <>
                            <Button size="sm" variant="default" onClick={() => handleApproveClass(cls.id)}>
                              Duyệt
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectClass(cls.id)}>
                              Từ chối
                            </Button>
                          </>
                        )}
                        {cls.status === "matched" && (
                          <Button size="sm" variant="secondary" onClick={() => handleViewContract(cls)}>
                            Xem hợp đồng
                          </Button>
                        )}
                        {userRole === "admin" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setClassToDelete(cls.id)
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - List */}
          <div className="md:hidden space-y-4">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{cls.name}</h3>
                  <Badge variant={getStatusBadgeVariant(cls.status)}>{getStatusText(cls.status)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Khách hàng: {cls.customer_name}</div>
                <div className="text-sm text-muted-foreground">Cấp độ: {getLevelText(cls.level)}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{cls.schedule}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    Địa điểm: {cls.district}, {cls.province}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Ngày tạo: {formatDate(cls.created_at).split(",")[0]}
                </div>
                <div className="flex flex-col space-y-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenDetails(cls)}>
                    Chi tiết
                  </Button>
                  {cls.status === "pending" && (
                    <>
                      <Button size="sm" variant="default" className="w-full" onClick={() => handleApproveClass(cls.id)}>
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleRejectClass(cls.id)}
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                  {cls.status === "matched" && (
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => handleViewContract(cls)}>
                      Xem hợp đồng
                    </Button>
                  )}
                  {userRole === "admin" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        setClassToDelete(cls.id)
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa lớp học
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredClasses.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Không tìm thấy lớp học nào phù hợp với tiêu chí tìm kiếm.
            </div>
          )}
        </>
      )}

      {/* Dialog chi tiết lớp học */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết lớp học</DialogTitle>
            <DialogDescription>Thông tin chi tiết về lớp học và danh sách gia sư đăng ký</DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Thông tin lớp học</TabsTrigger>
                <TabsTrigger
                  value="tutors"
                  disabled={selectedClass.status !== "approved" && selectedClass.status !== "matched"}
                >
                  Gia sư đăng ký ({tutorApplications.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Thông tin lớp học
                        <Badge variant={getStatusBadgeVariant(selectedClass.status)}>
                          {getStatusText(selectedClass.status)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Book className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{selectedClass.name}</p>
                          <p className="text-sm text-muted-foreground">Môn học: {selectedClass.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Lịch học</p>
                          <p className="text-sm text-muted-foreground">{selectedClass.schedule}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Địa điểm</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedClass.address}, {selectedClass.district}, {selectedClass.province}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Cấp độ</p>
                          <p className="text-sm text-muted-foreground">{getLevelText(selectedClass.level)}</p>
                        </div>
                      </div>
                      {selectedClass.tutor_requirements && (
                        <div className="flex items-start gap-2">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Yêu cầu gia sư</p>
                            <p className="text-sm text-muted-foreground">{selectedClass.tutor_requirements}</p>
                          </div>
                        </div>
                      )}
                      {selectedClass.special_requirements && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Yêu cầu đặc biệt</p>
                            <p className="text-sm text-muted-foreground">{selectedClass.special_requirements}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Thời gian tạo</p>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedClass.created_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Thông tin khách hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {selectedClass.customer_profiles?.full_name || "Không xác định"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Giới tính: {getGenderText(selectedClass.customer_profiles?.gender)}
                          </p>
                        </div>
                      </div>
                      {selectedClass.customer_profiles?.email && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{selectedClass.customer_profiles.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedClass.customer_profiles?.phone_number && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Số điện thoại</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedClass.customer_profiles.phone_number}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {selectedClass.status === "matched" && selectedClass.tutor_profiles && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Thông tin gia sư được chọn</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {selectedClass.tutor_profiles.profiles?.full_name || "Không xác định"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Giới tính: {getGenderText(selectedClass.tutor_profiles.profiles?.gender)}
                            </p>
                          </div>
                        </div>
                        {selectedClass.tutor_profiles.profiles?.email && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedClass.tutor_profiles.profiles.email}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedClass.tutor_profiles.profiles?.phone_number && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Số điện thoại</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedClass.tutor_profiles.profiles.phone_number}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedClass.status === "pending" && (
                  <div className="flex justify-end space-x-4">
                    <Button variant="destructive" onClick={() => handleRejectClass(selectedClass.id)}>
                      Từ chối
                    </Button>
                    <Button onClick={() => handleApproveClass(selectedClass.id)}>Duyệt lớp học</Button>
                  </div>
                )}

                {selectedClass?.status === "matched" && (
                  <div className="flex justify-end space-x-4 mt-4">
                    <Button onClick={() => handleViewContract(selectedClass)}>Xem hợp đồng</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tutors" className="space-y-4 mt-4">
                {isLoadingTutors ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : tutorApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chưa có gia sư nào đăng ký lớp học này.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto">
                    {tutorApplications.map((application) => (
                      <Card key={application.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{application.tutors.profiles.full_name}</CardTitle>
                            <Badge
                              variant={
                                application.status === "pending"
                                  ? "outline"
                                  : application.status === "approved"
                                    ? "secondary"
                                    : application.status === "selected"
                                      ? "default"
                                      : "destructive"
                              }
                            >
                              {application.status === "pending"
                                ? "Chờ duyệt"
                                : application.status === "approved"
                                  ? "Đã duyệt"
                                  : application.status === "selected"
                                    ? "Đã chọn"
                                    : "Từ chối"}
                            </Badge>
                          </div>
                          <CardDescription>
                            Giới tính: {getGenderText(application.tutors.profiles.gender)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm font-medium">Học vấn</p>
                              <p className="text-sm text-muted-foreground">{application.tutors.education}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Môn dạy</p>
                              <p className="text-sm text-muted-foreground">{application.tutors.subjects}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Kinh nghiệm</p>
                              <p className="text-sm text-muted-foreground">{application.tutors.experience}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Liên hệ</p>
                              <p className="text-sm text-muted-foreground">
                                {application.tutors.profiles.email} | {application.tutors.profiles.phone_number}
                              </p>
                            </div>
                          </div>

                          {application.self_introduction && (
                            <div>
                              <p className="text-sm font-medium">Giới thiệu</p>
                              <p className="text-sm text-muted-foreground">{application.self_introduction}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium">Ngày đăng ký</p>
                            <p className="text-sm text-muted-foreground">{formatDate(application.created_at)}</p>
                          </div>

                          {selectedClass.status === "approved" && application.status === "pending" && (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectTutor(application.id)}
                                disabled={isProcessing}
                              >
                                Từ chối
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApproveTutor(application.id, application.tutor_id)}
                                disabled={isProcessing}
                              >
                                Duyệt gia sư
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      {isContractDialogOpen && contractData && (
        <ContractDialog
          isOpen={isContractDialogOpen}
          onClose={() => setIsContractDialogOpen(false)}
          tutorData={contractData.tutorProfile}
          classData={contractData.classData}
          contractData={contractData.contract}
        />
      )}
      {/* Alert Dialog xác nhận xóa */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lớp học này không? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu
              liên quan bao gồm đơn đăng ký của gia sư và hợp đồng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => classToDelete && handleDeleteClass(classToDelete)}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
