// Component hiển thị danh sách các lớp học của gia sư
// Hiển thị các lớp học mà gia sư đã được chọn dạy
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ContractDialog from "../dialogs/contract-dialog"

// Định nghĩa kiểu dữ liệu cho lớp học
interface ClassItem {
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
  selected_tutor_id: string
  customer_profiles?: {
    full_name: string
    email?: string
    phone_number?: string
  }
}

// Component chính hiển thị danh sách lớp học của gia sư
export default function TutorClassList() {
  // State quản lý dữ liệu và trạng thái
  const [classes, setClasses] = useState<ClassItem[]>([]) // Danh sách các lớp học
  const [isLoading, setIsLoading] = useState(true) // Trạng thái đang tải
  const { toast } = useToast() // Hook hiển thị thông báo
  const supabase = createClientComponentClient() // Khởi tạo Supabase client
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false) // Trạng thái mở/đóng dialog hợp đồng
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null) // ID lớp học được chọn để xem hợp đồng

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

  // Hàm định dạng ngày tháng theo định dạng Việt Nam
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Hàm mở dialog hợp đồng
  const handleOpenContractDialog = (classId: string) => {
    setSelectedClassId(classId)
    setIsContractDialogOpen(true)
  }

  // useEffect tải dữ liệu ban đầu khi component được tải
  useEffect(() => {
    async function fetchClasses() {
      setIsLoading(true)
      try {
        // Lấy thông tin người dùng hiện tại
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          throw new Error("Không tìm thấy thông tin người dùng")
        }

        // Lấy danh sách các lớp học mà gia sư đã được chọn dạy
        const { data, error } = await supabase
          .from("classes")
          .select(`
            *,
            customer_profiles:profiles!customer_id(
              full_name,
              email,
              phone_number
            )
          `)
          .eq("selected_tutor_id", userData.user.id)
          .eq("status", "matched")
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setClasses(data || [])
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

  // Hiển thị trạng thái đang tải
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải danh sách lớp học...</span>
      </div>
    )
  }

  // Hiển thị thông báo nếu không có lớp học nào
  if (classes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Bạn chưa được chọn dạy lớp nào.</p>
      </div>
    )
  }

  // Phần render chính của component
  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Các lớp đã được chọn dạy</h2>
        <p className="text-muted-foreground">Danh sách các lớp học mà bạn đã được chọn làm gia sư.</p>
      </div>

      {/* Danh sách các lớp học */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <Card key={classItem.id}>
            <CardHeader>
              <CardTitle>{classItem.subject}</CardTitle>
              <CardDescription>Mã lớp: {classItem.id.substring(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Thông tin chi tiết về lớp học */}
                <div className="text-sm">
                  <span className="font-medium">Tên lớp:</span> {classItem.name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Cấp độ:</span> {getLevelText(classItem.level)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Địa điểm:</span> {classItem.district}, {classItem.province}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Địa chỉ:</span> {classItem.address}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lịch học:</span> {classItem.schedule}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Ngày tạo:</span> {formatDate(classItem.created_at)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Khách hàng:</span>{" "}
                  {classItem.customer_profiles?.full_name || "Không xác định"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Liên hệ:</span>{" "}
                  {classItem.customer_profiles?.phone_number || "Không xác định"}
                </div>

                {/* Nút xem hợp đồng */}
                <div>
                  <Button onClick={() => handleOpenContractDialog(classItem.id)}>Hợp đồng</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog hiển thị hợp đồng */}
      {selectedClassId && (
        <ContractDialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen} classId={selectedClassId} />
      )}
    </div>
  )
}
