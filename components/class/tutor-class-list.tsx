"use client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TutorClassListProps {
  tutorApplications: any[]
  onRefresh?: () => void
}

// Component hiển thị danh sách các lớp mà tutor đã đăng ký
export function TutorClassList({ tutorApplications, onRefresh }: TutorClassListProps) {
  console.log("TutorClassList - tutorApplications:", tutorApplications)
  console.log("TutorClassList - first application:", tutorApplications[0])

  console.log("Dữ liệu tutorApplications:", tutorApplications)

  // Hàm tạo badge hiển thị trạng thái đăng ký
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
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Đã được duyệt
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Đã được duyệt
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Bị từ chối
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

  // Hiển thị thông báo nếu không có đăng ký nào
  if (tutorApplications.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Bạn chưa đăng ký lớp học nào. Hãy vào Dashboard để xem các lớp có sẵn.</p>
      </div>
    )
  }

  // Hiển thị danh sách các lớp đã đăng ký
  return (
    <div className="space-y-4">
      {tutorApplications.map((application) => {
        // Add safety checks
        if (!application || !application.classes) {
          return null
        }

        return (
          <Card key={application.id} className="w-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{application.classes?.subject || "Không xác định"}</CardTitle>
                  <CardDescription>
                    {getLevelText(application.classes?.level || "")} • {application.classes?.province || ""}
                    {application.classes?.district ? `, ${application.classes.district}` : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">{getStatusBadge(application.status)}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Khách hàng</h4>
                  <p>
                    {application.classes?.customer_profiles?.full_name || "Không xác định"}
                    {application.classes?.customer_profiles?.gender &&
                      ` (${getGenderText(application.classes.customer_profiles.gender)})`}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Địa chỉ</h4>
                  <p>{application.classes?.address || "Không xác định"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Lịch học</h4>
                  <p>{application.classes?.schedule || "Không xác định"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Ngày đăng ký</h4>
                  <p>{formatDate(application.created_at)}</p>
                </div>
                {application.self_introduction && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Lời giới thiệu của bạn</h4>
                    <p>{application.self_introduction}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
