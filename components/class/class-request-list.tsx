"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import type { ClassRequest } from "@/types/class"

interface ClassRequestListProps {
  classRequests: ClassRequest[]
  onClassDeleted?: () => void
}

// Component hiển thị danh sách các yêu cầu mở lớp
export function ClassRequestList({ classRequests, onClassDeleted }: ClassRequestListProps) {
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [tutors, setTutors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Hàm tạo badge hiển thị trạng thái yêu cầu
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Chờ duyệt
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Đã duyệt
          </Badge>
        )
      case "selected":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Đã ghép gia sư
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Từ chối
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
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

  // Add a helper function to display gender text
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

  // Hàm xóa yêu cầu lớp học
  const handleDeleteClass = async (classId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Ngăn sự kiện click lan truyền đến card
    try {
      setIsLoading(true)
      const { error } = await supabase.from("classes").delete().eq("id", classId)

      if (error) {
        throw error
      }

      toast({
        title: "Xóa thành công",
        description: "Yêu cầu lớp học đã được xóa",
      })

      // Gọi callback để cập nhật danh sách lớp
      if (onClassDeleted) {
        onClassDeleted()
      }
    } catch (error: any) {
      console.error("Lỗi khi xóa lớp:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa lớp học. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm xử lý khi click vào card
  const handleCardClick = async (classId: string) => {
    // Nếu đang mở rộng, thu gọn lại
    if (expandedClass === classId) {
      setExpandedClass(null)
      return
    }

    // Nếu chưa mở rộng, mở rộng và tải danh sách gia sư nếu lớp đã được duyệt
    setExpandedClass(classId)
    const classItem = classRequests.find((c) => c.id === classId)

    if (classItem?.status === "approved") {
      try {
        setIsLoading(true)
        // Lấy danh sách gia sư đã đăng ký và được duyệt cho lớp này
        const { data, error } = await supabase
          .from("tutor_applications")
          .select(`
            id,
            status,
            self_introduction,
            created_at,
            tutors (
              id,
              education,
              experience,
              subjects,
              profiles (
                full_name,
                gender
              )
            )
          `)
          .eq("class_id", classId)        // lấy theo lớp
          .eq("status", "accepted")       // chỉ những gia sư đã duyệt (nếu muốn)
          .order("created_at", { ascending: false });


        if (error) {
          throw error
        }

        setTutors(data || [])
      } catch (error: any) {
        console.error("Lỗi khi lấy danh sách gia sư:", error)
        toast({
          title: "Lỗi",
          description: "Không thể lấy danh sách gia sư. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Hiển thị thông báo nếu không có yêu cầu nào
  if (classRequests.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Bạn chưa có yêu cầu mở lớp nào. Hãy tạo lớp mới để bắt đầu.</p>
      </div>
    )
  }

  // Hiển thị danh sách các yêu cầu mở lớp
  return (
    <div className="space-y-4">
      {classRequests.map((request) => (
        <div key={request.id} className="space-y-2">
          <Card
            className="w-full cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleCardClick(request.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{request.subject}</CardTitle>
                  <CardDescription>
                    {getLevelText(request.level)} • {request.province}, {request.district}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(request.status)}
                  {request.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                      onClick={(e) => handleDeleteClass(request.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Xóa yêu cầu</span>
                    </Button>
                  )}
                  {expandedClass === request.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Địa chỉ</h4>
                  <p>{request.address}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Lịch học</h4>
                  <p>{request.schedule}</p>
                </div>
                {request.tutor_requirements && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Yêu cầu gia sư</h4>
                    <p>{request.tutor_requirements}</p>
                  </div>
                )}
                {request.special_requirements && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Yêu cầu đặc biệt</h4>
                    <p>{request.special_requirements}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Ngày tạo</h4>
                  <p>{formatDate(request.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phần mở rộng hiển thị danh sách gia sư */}
          {expandedClass === request.id && (
            <div className="border rounded-md p-4 bg-background shadow-sm">
              {request.status === "approved" ? (
                <>
                  <h3 className="font-medium text-lg mb-4">Danh sách gia sư đã đăng ký</h3>
                  {isLoading ? (
                    <div className="text-center py-4">Đang tải danh sách gia sư...</div>
                  ) : tutors.length === 0 ? (
                    <div className="text-center py-4">Chưa có gia sư nào đăng ký hoặc được duyệt</div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {tutors.map((item) => (
                        <Card key={item.id} className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{item.tutors?.profiles?.full_name || "Không xác định"}</h3>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Đã duyệt
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Học vấn:</span>{" "}
                                {item.tutors?.education || "Không xác định"}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Môn dạy:</span>{" "}
                                {item.tutors?.subjects || "Không xác định"}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Giới tính:</span>{" "}
                                {getGenderText(item.tutors?.profiles?.gender)}
                              </div>
                            </div>
                            {item.self_introduction && (
                              <div>
                                <span className="text-muted-foreground">Giới thiệu:</span>
                                <p className="text-sm">{item.self_introduction}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Kinh nghiệm:</span>
                              <p className="text-sm">{item.tutors?.experience || "Không xác định"}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Lớp chưa được duyệt</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
