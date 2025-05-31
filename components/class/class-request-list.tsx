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
      case "matched":
        return (
          <Badge variant="outline" className="bg-blue-100 text-green-800 border-green-200">
            Đã ghép gia sư
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

    if (classItem?.status === "approved" || classItem?.status === "matched") {
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
              certificate_image,
              profiles (
                full_name,
                gender,
                phone_number,
                email,
                address
              )
            )
          `)
          .eq("class_id", classId) // lấy theo lớp
          .eq("status", classItem.status === "matched" ? "selected" : "approved") // chỉ những gia sư đã được duyệt
          .order("created_at", { ascending: false })

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

  // Hàm xử lý chọn gia sư
  const handleSelectTutor = async (tutorId: string, classId: string, applicationId: string) => {
    try {
      setIsLoading(true)

      // Cập nhật bảng classes: set selected_tutor_id và status = 'matched'
      const { error: classError } = await supabase
        .from("classes")
        .update({
          selected_tutor_id: tutorId,
          status: "matched",
        })
        .eq("id", classId)

      if (classError) {
        throw classError
      }

      // Cập nhật bảng tutor_applications: set status = 'selected' cho gia sư được chọn
      const { error: appError } = await supabase
        .from("tutor_applications")
        .update({ status: "selected" })
        .eq("id", applicationId)

      if (appError) {
        throw appError
      }

      // Cập nhật status = 'rejected' cho các gia sư khác trong cùng lớp
      const { error: rejectError } = await supabase
        .from("tutor_applications")
        .update({ status: "rejected" })
        .eq("class_id", classId)
        .neq("id", applicationId)

      if (rejectError) {
        throw rejectError
      }

      toast({
        title: "Thành công",
        description: "Đã chọn gia sư thành công!",
      })

      // Gọi callback để cập nhật danh sách lớp
      if (onClassDeleted) {
        onClassDeleted()
      }

      // Đóng phần mở rộng
      setExpandedClass(null)
    } catch (error: any) {
      console.error("Lỗi khi chọn gia sư:", error)
      toast({
        title: "Lỗi",
        description: "Không thể chọn gia sư. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
            <div className="border-l-4 border-l-blue-500 rounded-md p-4 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm ml-4">
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
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium">{item.tutors?.profiles?.full_name || "Không xác định"}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                  Đã duyệt
                                </Badge>
                                {request.status === "matched" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      /* Logic to show detailed info - could expand inline or open modal */
                                    }}
                                    disabled={isLoading}
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                  >
                                    Xem chi tiết
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSelectTutor(item.tutors.id, request.id, item.id)}
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Chọn gia sư
                                  </Button>
                                )}
                              </div>
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
                              <div>
                                <span className="text-muted-foreground">Kinh nghiệm:</span>{" "}
                                {item.tutors?.experience || "Không xác định"}
                              </div>
                            </div>
                            {item.self_introduction && (
                              <div>
                                <span className="text-muted-foreground">Giới thiệu:</span>
                                <p className="text-sm">{item.self_introduction}</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : request.status === "matched" ? (
                <>
                  <h3 className="font-medium text-lg mb-4 text-green-700">Gia sư đã được chọn</h3>
                  {isLoading ? (
                    <div className="text-center py-4">Đang tải thông tin gia sư...</div>
                  ) : tutors.length === 0 ? (
                    <div className="text-center py-4">Không tìm thấy thông tin gia sư</div>
                  ) : (
                    <div className="space-y-4">
                      {tutors
                        .filter((item) => item.status === "selected")
                        .map((item) => (
                          <Card key={item.id} className="p-6 border-green-200 bg-green-50/50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-green-800">
                                  {item.tutors?.profiles?.full_name || "Không xác định"}
                                </h3>
                                <Badge className="bg-green-600 text-white">Đã chọn</Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="font-medium text-muted-foreground">Học vấn:</span>
                                  <p className="text-sm mt-1">{item.tutors?.education || "Không xác định"}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Môn dạy:</span>
                                  <p className="text-sm mt-1">{item.tutors?.subjects || "Không xác định"}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Giới tính:</span>
                                  <p className="text-sm mt-1">{getGenderText(item.tutors?.profiles?.gender)}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Số điện thoại:</span>
                                  <p className="text-sm mt-1 font-medium text-blue-600">
                                    {item.tutors?.profiles?.phone_number || "Chưa cập nhật"}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Email:</span>
                                  <p className="text-sm mt-1 font-medium text-blue-600">
                                    {item.tutors?.profiles?.email || "Chưa cập nhật"}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Địa chỉ:</span>
                                  <p className="text-sm mt-1">{item.tutors?.profiles?.address || "Chưa cập nhật"}</p>
                                </div>
                              </div>

                              <div>
                                <span className="font-medium text-muted-foreground">Kinh nghiệm:</span>
                                <p className="text-sm mt-1">{item.tutors?.experience || "Không xác định"}</p>
                              </div>

                              {item.self_introduction && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Giới thiệu bản thân:</span>
                                  <p className="text-sm mt-1 p-3 bg-white rounded border">{item.self_introduction}</p>
                                </div>
                              )}

                              {item.tutors?.certificate_image && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Bằng cấp:</span>
                                  <div className="mt-2">
                                    <img
                                      src={
                                        item.tutors.certificate_image?.startsWith("http")
                                          ? item.tutors.certificate_image
                                          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${item.tutors.certificate_image}`
                                      }
                                      alt="Bằng cấp gia sư"
                                      className="max-w-md rounded border shadow-sm"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.svg?height=300&width=400"
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
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
