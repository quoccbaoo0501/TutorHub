"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Remove: import ContractDialog from "../dialogs/contract-dialog"

// Định nghĩa kiểu dữ liệu cho lớp học
import { useState } from "react"
import { Button } from "@/components/ui/button"
import ContractDialog from "../dialogs/contract-dialog"
import PaymentFeeDialog from "../dialogs/payment-fee-dialog"

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

// Update the component signature to accept props:
interface TutorClassListProps {
  tutorApplications: any[]
  onRefresh: () => Promise<void>
}

export default function TutorClassList({ tutorApplications, onRefresh }: TutorClassListProps) {
  // Remove all the existing state and useEffect since data is now passed as props
  // Remove: const [classes, setClasses] = useState<ClassItem[]>([])
  // Remove: const [isLoading, setIsLoading] = useState(true)
  // Remove: const entire useEffect block
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [isPaymentFeeDialogOpen, setIsPaymentFeeDialogOpen] = useState(false)
  const [selectedClassForFee, setSelectedClassForFee] = useState<string | null>(null)

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

  // Hàm mở dialog phí môi giới
  const handleOpenPaymentFeeDialog = (classId: string) => {
    setSelectedClassForFee(classId)
    setIsPaymentFeeDialogOpen(true)
  }

  // useEffect tải dữ liệu ban đầu khi component được tải
  // if (isLoading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //       <span className="ml-2">Đang tải danh sách lớp học...</span>
  //     </div>
  //   )
  // }

  // Hiển thị thông báo nếu không có lớp học nào
  // Replace the classes.length === 0 check with:
  if (tutorApplications.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Bạn chưa được chọn dạy lớp nào.</p>
      </div>
    )
  }

  // Replace the classes.map with tutorApplications.map and update the mapping logic:
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Các lớp đã đăng ký</h2>
        <p className="text-muted-foreground">Danh sách các lớp học mà bạn đã đăng ký dạy.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tutorApplications.map((application) => (
          <Card key={application.id}>
            <CardHeader>
              <CardTitle>{application.classes?.subject || "Không xác định"}</CardTitle>
              <CardDescription>Trạng thái: {application.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {application.classes && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium">Tên lớp:</span> {application.classes.name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Cấp độ:</span> {getLevelText(application.classes.level)}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Địa điểm:</span> {application.classes.district},{" "}
                      {application.classes.province}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Địa chỉ chi tiết:</span> {application.classes.address}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Lịch học:</span> {application.classes.schedule}
                    </div>

                    {/* Enhanced customer information */}
                    <div className="border-t pt-2 mt-3">
                      <div className="text-sm font-medium text-blue-600 mb-2">Thông tin liên hệ khách hàng:</div>
                      <div className="text-sm">
                        <span className="font-medium">Tên:</span>{" "}
                        {application.classes.customer_profiles?.full_name || "Không xác định"}
                      </div>
                      {application.classes.customer_profiles?.phone_number && (
                        <div className="text-sm">
                          <span className="font-medium">Số điện thoại:</span>{" "}
                          <a
                            href={`tel:${application.classes.customer_profiles.phone_number}`}
                            className="text-blue-600 hover:underline"
                          >
                            {application.classes.customer_profiles.phone_number}
                          </a>
                        </div>
                      )}
                      {application.classes.customer_profiles?.email && (
                        <div className="text-sm">
                          <span className="font-medium">Email:</span>{" "}
                          <a
                            href={`mailto:${application.classes.customer_profiles.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {application.classes.customer_profiles.email}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Contract button */}
                    <div className="pt-3">
                      <Button
                        onClick={() => handleOpenContractDialog(application.classes.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Xem hợp đồng
                      </Button>
                    </div>
                    {/* Payment Fee button */}
                    <div className="pt-2">
                      <Button
                        onClick={() => handleOpenPaymentFeeDialog(application.classes.id)}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        Xem phí môi giới
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Contract Dialog */}
      {selectedClassId && (
        <ContractDialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen} classId={selectedClassId} />
      )}
      {/* Payment Fee Dialog */}
      {selectedClassForFee && (
        <PaymentFeeDialog
          open={isPaymentFeeDialogOpen}
          onOpenChange={setIsPaymentFeeDialogOpen}
          classId={selectedClassForFee}
        />
      )}
    </div>
  )
}
