"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, User, Calendar, MapPin, Phone, Mail } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface ContractDialogProps {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  classId?: string
  tutorData?: any
  classData?: any
  contractData?: any
}

export default function ContractDialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  classId,
  tutorData,
  classData,
  contractData,
}: ContractDialogProps) {
  const [contract, setContract] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tutor, setTutor] = useState<any>(tutorData)
  const [classInfo, setClassInfo] = useState<any>(classData)

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const isDialogOpen = open ?? isOpen ?? false
  const handleOpenChange =
    onOpenChange ??
    ((open: boolean) => {
      if (!open && onClose) onClose()
    })

  useEffect(() => {
    if (isDialogOpen && classId && !tutorData) {
      fetchContractData()
    } else if (contractData) {
      setContract(contractData)
    }
  }, [isDialogOpen, classId, contractData])

  const fetchContractData = async () => {
    if (!classId) return

    setIsLoading(true)
    try {
      // Fetch class data
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`
          *,
          customer_profiles:profiles!customer_id(
            full_name,
            email,
            phone_number
          )
        `)
        .eq("id", classId)
        .single()

      if (classError) throw classError
      setClassInfo(classData)

      // Fetch tutor data if selected_tutor_id exists
      if (classData.selected_tutor_id) {
        const { data: tutorData, error: tutorError } = await supabase
          .from("tutors")
          .select(`
            *,
            profiles(
              full_name,
              email,
              phone_number,
              gender
            )
          `)
          .eq("id", classData.selected_tutor_id)
          .single()

        if (tutorError) throw tutorError
        setTutor(tutorData)

        // Fetch contract data
        const { data: contractData, error: contractError } = await supabase
          .from("contracts")
          .select("*")
          .eq("class_id", classId)
          .eq("tutor_id", classData.selected_tutor_id)
          .single()

        if (contractError && contractError.code !== "PGRST116") {
          throw contractError
        }

        setContract(contractData)
      }
    } catch (error) {
      console.error("Error fetching contract data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin hợp đồng",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

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
      default:
        return level
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hợp đồng gia sư</DialogTitle>
          <DialogDescription>Thông tin chi tiết về hợp đồng giữa gia sư và khách hàng</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contract Status */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Trạng thái hợp đồng</h3>
              <Badge variant={contract ? "default" : "secondary"}>
                {contract ? "Đã tạo hợp đồng" : "Chưa có hợp đồng"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Thông tin lớp học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{classInfo?.name || classData?.name}</p>
                    <p className="text-sm text-muted-foreground">Môn: {classInfo?.subject || classData?.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cấp độ</p>
                    <p className="text-sm text-muted-foreground">
                      {getLevelText(classInfo?.level || classData?.level)}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Địa điểm</p>
                      <p className="text-sm text-muted-foreground">
                        {classInfo?.address || classData?.address}, {classInfo?.district || classData?.district},{" "}
                        {classInfo?.province || classData?.province}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Lịch học</p>
                      <p className="text-sm text-muted-foreground">{classInfo?.schedule || classData?.schedule}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tutor Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin gia sư
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">
                      {tutor?.profiles?.full_name || tutor?.full_name || tutorData?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">Học vấn: {tutor?.education || tutorData?.education}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {tutor?.profiles?.email || tutor?.email || tutorData?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Số điện thoại</p>
                      <p className="text-sm text-muted-foreground">
                        {tutor?.profiles?.phone_number || tutor?.phone_number || tutorData?.phone_number}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kinh nghiệm</p>
                    <p className="text-sm text-muted-foreground">{tutor?.experience || tutorData?.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Môn dạy</p>
                    <p className="text-sm text-muted-foreground">{tutor?.subjects || tutorData?.subjects}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contract Details */}
            {contract && (
              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết hợp đồng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Ngày bắt đầu</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.start_date ? formatDate(contract.start_date) : "Chưa xác định"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ngày kết thúc</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.end_date ? formatDate(contract.end_date) : "Chưa xác định"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Học phí</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.hourly_rate ? `${contract.hourly_rate.toLocaleString()} VNĐ/giờ` : "Chưa xác định"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Trạng thái</p>
                      <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                        {contract.status === "active" ? "Đang hoạt động" : contract.status}
                      </Badge>
                    </div>
                  </div>
                  {contract.terms && (
                    <div>
                      <p className="text-sm font-medium">Điều khoản</p>
                      <p className="text-sm text-muted-foreground">{contract.terms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            {(classInfo?.customer_profiles || classData?.customer_profiles) && (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin khách hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">
                      {classInfo?.customer_profiles?.full_name || classData?.customer_profiles?.full_name}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {classInfo?.customer_profiles?.email || classData?.customer_profiles?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Số điện thoại</p>
                      <p className="text-sm text-muted-foreground">
                        {classInfo?.customer_profiles?.phone_number || classData?.customer_profiles?.phone_number}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Đóng
              </Button>
              {contract && <Button onClick={() => window.print()}>In hợp đồng</Button>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
