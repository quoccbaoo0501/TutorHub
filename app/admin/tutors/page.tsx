"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, Calendar, User, Phone, MapPin, FileText, Eye, Check, X, Trash2, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Định nghĩa kiểu dữ liệu cho gia sư
interface Tutor {
  id: string
  education: string
  experience: string
  subjects: string
  certificate_image?: string
  certificate_approve: boolean
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    email: string
    phone_number?: string
    address?: string
    gender?: string
    id: string
  }
}

// Định nghĩa kiểu dữ liệu cho form chỉnh sửa gia sư
interface TutorFormData {
  full_name: string
  phone_number: string
  address: string
  gender: string
  education: string
  experience: string
  subjects: string
}

export default function AdminTutorsPage() {
  // State cho dữ liệu và UI
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Tutor | "full_name" | "phone_number"
    direction: "ascending" | "descending"
  }>({ key: "created_at", direction: "descending" })

  // State cho dialog chi tiết
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [certificateImageUrl, setCertificateImageUrl] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [tutorToDelete, setTutorToDelete] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // State cho dialog form chỉnh sửa
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null)
  const [formData, setFormData] = useState<TutorFormData>({
    full_name: "",
    phone_number: "",
    address: "",
    gender: "male",
    education: "",
    experience: "",
    subjects: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Danh sách các trạng thái
  const statuses = ["all", "approved", "pending"]

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
  const handleSort = (key: keyof Tutor | "full_name" | "phone_number") => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Hàm lấy URL hình ảnh chứng chỉ
  const getCertificateImageUrl = async (imagePath: string) => {
    try {
      const { data } = await supabase.storage.from("certificates").createSignedUrl(imagePath, 3600) // 1 hour expiry
      return data?.signedUrl || null
    } catch (error) {
      console.error("Error getting certificate image URL:", error)
      return null
    }
  }

  // Hàm mở dialog chi tiết
  const handleOpenDetails = async (tutor: Tutor) => {
    setSelectedTutor(tutor)
    setIsDialogOpen(true)
    setCertificateImageUrl(null)

    // Tải hình ảnh chứng chỉ nếu có
    if (tutor.certificate_image) {
      const imageUrl = await getCertificateImageUrl(tutor.certificate_image)
      setCertificateImageUrl(imageUrl)
    }
  }

  // Hàm mở dialog form chỉnh sửa
  const handleOpenEditForm = (tutor: Tutor) => {
    setEditingTutor(tutor)
    setFormData({
      full_name: tutor.profiles.full_name,
      phone_number: tutor.profiles.phone_number || "",
      address: tutor.profiles.address || "",
      gender: tutor.profiles.gender || "male",
      education: tutor.education || "",
      experience: tutor.experience || "",
      subjects: tutor.subjects || "",
    })
    setFormErrors({})
    setIsFormDialogOpen(true)
  }

  // Tải dữ liệu gia sư từ Supabase
  useEffect(() => {
    async function fetchTutors() {
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

        // Add debugging to see what's happening
        console.log("Fetching tutors with session:", session?.user?.id)

        // First, let's check if we can see any tutors at all
        const { data: tutorCount, error: countError } = await supabase.from("tutors").select("id", { count: "exact" })

        console.log("Total tutors in database:", tutorCount?.length, "Error:", countError)

        // Check current user role
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        console.log("Current user role:", currentUserProfile?.role)

        const { data: tutorsData, error: tutorsError } = await supabase
          .from("tutors")
          .select(`
            id,
            education,
            experience,
            subjects,
            certificate_image,
            certificate_approve,
            created_at,
            updated_at,
            profiles!inner (
              id,
              full_name,
              email,
              phone_number,
              address,
              gender
            )
          `)
          .order("created_at", { ascending: false })

        console.log("Tutors query result:", tutorsData, "Error:", tutorsError)

        if (tutorsError) {
          throw tutorsError
        }

        // Xử lý dữ liệu để đảm bảo profiles là object, không phải array
        const processedTutors = (tutorsData || []).map((tutor) => ({
          ...tutor,
          profiles: Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles,
        }))

        setTutors(processedTutors)
        setFilteredTutors(processedTutors)
      } catch (error) {
        console.error("Lỗi khi tải danh sách gia sư:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách gia sư. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTutors()
  }, [supabase, toast])

  // Lọc và sắp xếp dữ liệu khi các điều kiện thay đổi
  useEffect(() => {
    // Lọc dữ liệu theo từ khóa tìm kiếm và trạng thái
    const result = tutors.filter((tutor) => {
      const matchesSearch =
        tutor.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.profiles.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.profiles.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.subjects?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "approved" && tutor.certificate_approve) ||
        (selectedStatus === "pending" && !tutor.certificate_approve)

      return matchesSearch && matchesStatus
    })

    // Sắp xếp dữ liệu
    result.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortConfig.key === "full_name") {
        aValue = a.profiles.full_name
        bValue = b.profiles.full_name
      } else if (sortConfig.key === "phone_number") {
        aValue = a.profiles.phone_number
        bValue = b.profiles.phone_number
      } else {
        aValue = a[sortConfig.key as keyof Tutor]
        bValue = b[sortConfig.key as keyof Tutor]
      }

      if (aValue === undefined || bValue === undefined) return 0

      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortConfig.direction === "ascending") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        if (sortConfig.direction === "ascending") {
          return aValue === bValue ? 0 : aValue ? 1 : -1
        } else {
          return aValue === bValue ? 0 : aValue ? -1 : 1
        }
      }

      return 0
    })

    setFilteredTutors(result)
  }, [tutors, searchTerm, selectedStatus, sortConfig])

  // Hàm xử lý duyệt gia sư
  const handleApproveTutor = async (tutorId: string) => {
    try {
      setIsProcessing(true)
      const { error } = await supabase.from("tutors").update({ certificate_approve: true }).eq("id", tutorId)

      if (error) throw error

      // Cập nhật state
      setTutors((prevTutors) =>
        prevTutors.map((tutor) => (tutor.id === tutorId ? { ...tutor, certificate_approve: true } : tutor)),
      )

      // Cập nhật selectedTutor nếu đang mở dialog
      if (selectedTutor && selectedTutor.id === tutorId) {
        setSelectedTutor({ ...selectedTutor, certificate_approve: true })
      }

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

  // Hàm xử lý từ chối gia sư
  const handleRejectTutor = async (tutorId: string) => {
    try {
      setIsProcessing(true)
      const { error } = await supabase.from("tutors").update({ certificate_approve: false }).eq("id", tutorId)

      if (error) throw error

      // Cập nhật state
      setTutors((prevTutors) =>
        prevTutors.map((tutor) => (tutor.id === tutorId ? { ...tutor, certificate_approve: false } : tutor)),
      )

      // Cập nhật selectedTutor nếu đang mở dialog
      if (selectedTutor && selectedTutor.id === tutorId) {
        setSelectedTutor({ ...selectedTutor, certificate_approve: false })
      }

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

  // Hàm xử lý xóa gia sư
  const handleDeleteTutor = async (tutorId: string) => {
    try {
      setIsProcessing(true)

      // Lấy profile ID của gia sư
      const { data: tutorData } = await supabase.from("tutors").select("profiles(id)").eq("id", tutorId).single()

      if (!tutorData?.profiles) {
        throw new Error("Không tìm thấy thông tin gia sư")
      }

      // Xử lý trường hợp profiles có thể là array hoặc object
      const profiles = Array.isArray(tutorData.profiles) ? tutorData.profiles[0] : tutorData.profiles
      const profileId = profiles?.id

      if (!profileId) {
        throw new Error("Không tìm thấy ID profile của gia sư")
      }

      // Xóa các bản ghi liên quan
      await supabase.from("tutor_applications").delete().eq("tutor_id", tutorId)
      await supabase.from("contracts").delete().eq("tutor_id", tutorId)

      // Cập nhật các lớp học đã chọn gia sư này
      await supabase
        .from("classes")
        .update({ selected_tutor_id: null, status: "approved" })
        .eq("selected_tutor_id", tutorId)

      // Xóa bản ghi trong bảng tutors
      await supabase.from("tutors").delete().eq("id", tutorId)

      // Xóa profile của gia sư
      const { error } = await supabase.from("profiles").delete().eq("id", profileId)

      if (error) throw error

      // Cập nhật state
      setTutors((prevTutors) => prevTutors.filter((tutor) => tutor.id !== tutorId))

      toast({
        title: "Thành công",
        description: "Đã xóa gia sư và tất cả dữ liệu liên quan thành công.",
      })

      setDeleteConfirmOpen(false)
      setTutorToDelete(null)
    } catch (error) {
      console.error("Lỗi khi xóa gia sư:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa gia sư. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm lấy màu badge dựa trên trạng thái
  const getStatusBadgeVariant = (approved: boolean) => {
    return approved ? "default" : "secondary"
  }

  const getStatusText = (approved: boolean) => {
    return approved ? "Đã duyệt" : "Chờ duyệt"
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Auth error:", error)
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

  // Hàm validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      errors.full_name = "Họ tên không được để trống"
    }

    if (!formData.education.trim()) {
      errors.education = "Học vấn không được để trống"
    }

    if (!formData.experience.trim()) {
      errors.experience = "Kinh nghiệm không được để trống"
    }

    if (!formData.subjects.trim()) {
      errors.subjects = "Môn dạy không được để trống"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Hàm xử lý submit form
  const handleSubmitForm = async () => {
    if (!validateForm() || !editingTutor) return

    setIsProcessing(true)
    try {
      // Cập nhật thông tin profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
          gender: formData.gender,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTutor.profiles.id)

      if (profileError) throw profileError

      // Cập nhật thông tin gia sư
      const { error: tutorError } = await supabase
        .from("tutors")
        .update({
          education: formData.education,
          experience: formData.experience,
          subjects: formData.subjects,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTutor.id)

      if (tutorError) throw tutorError

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin gia sư thành công.",
      })

      setIsFormDialogOpen(false)
      fetchTutors()
    } catch (error) {
      console.error("Lỗi khi cập nhật gia sư:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin gia sư. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý gia sư</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, email, SĐT, môn dạy..."
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
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
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
                    <button className="flex items-center gap-1" onClick={() => handleSort("full_name")}>
                      Tên gia sư
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("phone_number")}>
                      SĐT
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Địa chỉ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("created_at")}>
                      Ngày tạo
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("certificate_approve")}>
                      Trạng thái
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTutors.map((tutor) => (
                  <tr key={tutor.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{tutor.profiles.full_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {tutor.profiles.phone_number || "Chưa cập nhật"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {tutor.profiles.address || "Chưa cập nhật"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(tutor.created_at).split(",")[0]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={getStatusBadgeVariant(tutor.certificate_approve)}>
                        {getStatusText(tutor.certificate_approve)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDetails(tutor)}>
                          Chi tiết
                        </Button>
                        {(userRole === "admin" || userRole === "staff") && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenEditForm(tutor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {!tutor.certificate_approve ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveTutor(tutor.id)}
                            disabled={isProcessing}
                          >
                            Duyệt
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectTutor(tutor.id)}
                            disabled={isProcessing}
                          >
                            Từ chối
                          </Button>
                        )}
                        {userRole === "admin" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setTutorToDelete(tutor.id)
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
            {filteredTutors.map((tutor) => (
              <div key={tutor.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{tutor.profiles.full_name}</h3>
                  <Badge variant={getStatusBadgeVariant(tutor.certificate_approve)}>
                    {getStatusText(tutor.certificate_approve)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  SĐT: {tutor.profiles.phone_number || "Chưa cập nhật"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Địa chỉ: {tutor.profiles.address || "Chưa cập nhật"}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày tạo: {formatDate(tutor.created_at).split(",")[0]}</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenDetails(tutor)}>
                    Chi tiết
                  </Button>
                  {(userRole === "admin" || userRole === "staff") && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenEditForm(tutor)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Sửa
                    </Button>
                  )}
                  {!tutor.certificate_approve ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full"
                      onClick={() => handleApproveTutor(tutor.id)}
                      disabled={isProcessing}
                    >
                      Duyệt
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleRejectTutor(tutor.id)}
                      disabled={isProcessing}
                    >
                      Từ chối
                    </Button>
                  )}
                  {userRole === "admin" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        setTutorToDelete(tutor.id)
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa gia sư
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredTutors.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Không tìm thấy gia sư nào phù hợp với tiêu chí tìm kiếm.
            </div>
          )}
        </>
      )}

      {/* Dialog chi tiết gia sư */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết gia sư</DialogTitle>
            <DialogDescription>Thông tin chi tiết về gia sư và chứng chỉ</DialogDescription>
          </DialogHeader>

          {selectedTutor && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Thông tin cá nhân
                      <Badge variant={getStatusBadgeVariant(selectedTutor.certificate_approve)}>
                        {getStatusText(selectedTutor.certificate_approve)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedTutor.profiles.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Giới tính: {getGenderText(selectedTutor.profiles.gender)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{selectedTutor.profiles.email}</p>
                      </div>
                    </div>
                    {selectedTutor.profiles.phone_number && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Số điện thoại</p>
                          <p className="text-sm text-muted-foreground">{selectedTutor.profiles.phone_number}</p>
                        </div>
                      </div>
                    )}
                    {selectedTutor.profiles.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Địa chỉ</p>
                          <p className="text-sm text-muted-foreground">{selectedTutor.profiles.address}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Ngày đăng ký</p>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedTutor.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin chuyên môn</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Học vấn</p>
                      <p className="text-sm">{selectedTutor.education || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Kinh nghiệm</p>
                      <p className="text-sm">{selectedTutor.experience || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Môn dạy</p>
                      <p className="text-sm">{selectedTutor.subjects || "Chưa cập nhật"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Certificate section */}
              {selectedTutor.certificate_image && (
                <Card>
                  <CardHeader>
                    <CardTitle>Chứng chỉ bằng cấp</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {certificateImageUrl ? (
                      <div className="space-y-4">
                        <img
                          src={certificateImageUrl || "/placeholder.svg"}
                          alt="Chứng chỉ gia sư"
                          className="max-w-full h-auto rounded-lg border"
                          style={{ maxHeight: "500px" }}
                        />
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm text-muted-foreground">Chứng chỉ đã được tải lên</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 border rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Đang tải hình ảnh...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex justify-end space-x-4">
                {!selectedTutor.certificate_approve ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectTutor(selectedTutor.id)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Từ chối
                    </Button>
                    <Button onClick={() => handleApproveTutor(selectedTutor.id)} disabled={isProcessing}>
                      <Check className="h-4 w-4 mr-2" />
                      Duyệt gia sư
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectTutor(selectedTutor.id)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy duyệt
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Alert Dialog xác nhận xóa */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa gia sư</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa gia sư này không? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên
              quan bao gồm đơn đăng ký và hợp đồng. Các lớp học đã ghép với gia sư này sẽ được chuyển về trạng thái "Đã
              duyệt".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tutorToDelete && handleDeleteTutor(tutorToDelete)}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog form chỉnh sửa gia sư */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin gia sư</DialogTitle>
            <DialogDescription>Cập nhật thông tin gia sư</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nguyễn Văn A"
                disabled={isProcessing}
              />
              {formErrors.full_name && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.full_name}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Số điện thoại</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="0123456789"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Đường ABC, Quận XYZ"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">
                Học vấn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                disabled={isProcessing}
              />
              {formErrors.education && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.education}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">
                Kinh nghiệm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="Ví dụ: 2 năm kinh nghiệm dạy Toán"
                disabled={isProcessing}
              />
              {formErrors.experience && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.experience}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects">
                Môn dạy <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subjects"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                placeholder="Ví dụ: Toán, Lý, Hóa"
                disabled={isProcessing}
              />
              {formErrors.subjects && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.subjects}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handleSubmitForm} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
