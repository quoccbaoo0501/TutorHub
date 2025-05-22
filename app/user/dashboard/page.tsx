"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { ClassRequest } from "@/types/class"
import { useToast } from "@/hooks/use-toast"

export default function UserDashboard() {
  const [approvedClasses, setApprovedClasses] = useState<ClassRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Hàm định dạng ngày tháng theo định dạng Việt Nam
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

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

  useEffect(() => {
    async function fetchApprovedClasses() {
      setIsLoading(true)
      try {
        // Lấy tất cả các lớp đã được duyệt từ database
        const { data, error } = await supabase
          .from("classes")
          .select(`
            *,
            profiles:customer_id (
              full_name
            )
          `)
          .eq("status", "approved")
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setApprovedClasses(data || [])
      } catch (error) {
        console.error("Lỗi khi tải danh sách lớp đã duyệt:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách lớp đã duyệt. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchApprovedClasses()
  }, [supabase, toast])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Chào mừng bạn đến với TutorHub!</p>
      </div>

      {/* Phần 1: Danh sách các lớp đã được duyệt */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Danh sách các lớp đã được duyệt</h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : approvedClasses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Chưa có lớp nào được duyệt.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedClasses.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">{classItem.subject}</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
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
                      <span className="font-medium">Người đăng:</span>{" "}
                      {classItem.profiles?.full_name || "Không xác định"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Ngày tạo:</span> {formatDate(classItem.created_at)}
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

      {/* Phần 2: Danh sách các gia sư */}
      <div className="space-y-4 mt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Danh sách các gia sư</h2>

        <div className="text-center py-10">
          <p className="text-muted-foreground">Chức năng đang được phát triển.</p>
        </div>
      </div>
    </div>
  )
}
