"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Printer } from "lucide-react"
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

  const handlePrint = () => {
    window.print()
  }

  // Get current date for contract
  const currentDate = new Date()
  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>Hợp đồng gia sư</DialogTitle>
          <DialogDescription>Hợp đồng giữa gia sư và trung tâm TutorHub</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Contract Content */}
            <div className="contract-content space-y-4 print:text-black print:text-sm">
              {/* Header */}
              <div className="text-center space-y-1">
                <p className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-medium">Độc Lập – Tự Do – Hạnh Phúc</p>
                <p className="text-center">—❧❧❧❧—</p>
                <h1 className="text-xl font-bold mt-4">HỢP ĐỒNG THỰC HIỆN</h1>
              </div>

              {/* Party A */}
              <div className="space-y-1">
                <p className="font-bold">BÊN A: TRUNG TÂM GIA SƯ TUTORHUB</p>
                <p>✓ Điện thoại: 0344497012</p>
                <p>✓ Website: https://tutorcenter.vercel.app</p>
                <p>✓ Đại diện giao lớp: TuTor HUB</p>
              </div>

              {/* Party B */}
              <div className="space-y-1">
                <p className="font-bold">BÊN B: (BÊN GIA SƯ THỰC HIỆN)</p>
                <p>
                  ✓ Anh/chị:{" "}
                  <span className="font-medium">
                    {tutor?.profiles?.full_name || tutor?.full_name || "................................"}
                  </span>{" "}
                  Sinh năm: <span className="font-medium">{tutor?.birth_year || "............"}</span> Quê:{" "}
                  <span className="font-medium">{tutor?.hometown || "........................"}</span>
                </p>
                <p>
                  ✓ CMND số: <span className="font-medium">{tutor?.id_number || "........................"}</span> Địa
                  chỉ hiện tại:{" "}
                  <span className="font-medium">
                    {tutor?.address || "........................................................................"}
                  </span>
                </p>
                <p>
                  ✓ Điện thoại:{" "}
                  <span className="font-medium">
                    {tutor?.profiles?.phone_number || tutor?.phone_number || "........................"}
                  </span>{" "}
                  Email:{" "}
                  <span className="font-medium">
                    {tutor?.profiles?.email || tutor?.email || "........................"}
                  </span>
                </p>
                <p className="italic text-sm">
                  Bên B cam kết các thông tin trên là chính xác, nếu sai bên A không chịu trách nhiệm
                </p>
              </div>

              {/* Article 1 */}
              <div className="space-y-2">
                <p className="font-bold">ĐIỀU 1: TRÁCH NHIỆM VÀ NGHĨA VỤ BÊN A – GIA SƯ TIÊN PHONG</p>

                <div className="space-y-1">
                  <p>
                    <strong>1.</strong> Bên A cung cấp thông tin về lớp dạy cho bên B:
                  </p>
                  <p>
                    Mã lớp:{" "}
                    <span className="font-medium">
                      {classInfo?.id?.substring(0, 8) ||
                        classData?.id?.substring(0, 8) ||
                        "................................"}
                    </span>
                  </p>
                  <p>
                    Tên PHHS/HV:{" "}
                    <span className="font-medium">
                      {classInfo?.customer_profiles?.full_name ||
                        classData?.customer_profiles?.full_name ||
                        "................................"}
                    </span>
                    Điện thoại:{" "}
                    <span className="font-medium">
                      {classInfo?.customer_profiles?.phone_number ||
                        classData?.customer_profiles?.phone_number ||
                        "........................"}
                    </span>
                  </p>
                  <p>
                    Địa chỉ học:{" "}
                    <span className="font-medium">
                      {classInfo?.address || classData?.address || "................................"},{" "}
                      {classInfo?.district || classData?.district || "................................"},{" "}
                      {classInfo?.province || classData?.province || "................................"}
                    </span>
                  </p>
                  <p>
                    Lớp: <span className="font-medium">{getLevelText(classInfo?.level || classData?.level || "")}</span>
                    Môn:{" "}
                    <span className="font-medium">
                      {classInfo?.subject || classData?.subject || "................................"}
                    </span>
                  </p>
                  <p>
                    Lương:{" "}
                    <span className="font-medium">
                      {classInfo?.hourly_rate || classData?.hourly_rate || "........................"}
                    </span>
                    /giờ
                  </p>
                  <p>
                    Phí nhận lớp dạy:{" "}
                    <span className="font-medium">
                      {classInfo?.registration_fee || classData?.registration_fee || "........................"}
                    </span>
                  </p>
                  <p>
                    Thỏa thuận thêm (nếu có):{" "}
                    <span className="font-medium">
                      {classInfo?.additional_notes ||
                        classData?.additional_notes ||
                        "........................................................................................"}
                    </span>
                  </p>
                </div>

                <p>
                  <strong>2.</strong> Bên A hoàn phí nhận lớp cho bên B, nếu bên B không nhận được lớp với những lý do
                  chính đáng như: PHHS cho con học tại trung tâm, học tại trường, có gia sư rồi, học cô giáo chủ nhiệm,
                  không còn thời gian. PHHS thay đổi lịch học, mức lương, số lượng học viên, môn học, địa chỉ học dẫn
                  tới gia sư không dạy được hoặc gia đình PHHS gây nguy hiểm, đe dọa đến thân thể, sức khỏe của gia sư.
                </p>

                <p>
                  <strong>3.</strong> Bên A sẽ hoàn phí lại cho bên B sau khi cho giám sát xuống nhà PHHS xác minh, thời
                  gian hoàn phí sau khi xác minh từ 5 tới 7 ngày làm việc (chỉ hoàn phí vào các ngày làm việc sau 13h).
                </p>

                <p>
                  <strong>4.</strong> Mức hoàn phí: Bên A hoàn trả 100% phí cho bên B nếu bên B gặp trục trặc chính đáng
                  như trên trong buổi dạy thử đầu. Hoàn trả 75% phí cho bên B nếu bên B gặp trục trặc chính đáng trên
                  trong vòng tuần đầu tiên. Hoàn 50% trong tuần thứ 2 và hoàn 25% trong tuần thứ 3.
                </p>

                <p>
                  <strong>5.</strong> Bên A không hoàn phí cho bên B khi bên B không làm theo đúng hướng dẫn nhận lớp
                  của bên A như không đem theo giấy giới thiệu, CMND, thẻ SV, thẻ GV hoặc bằng cấp khi tới gặp PHHS;
                  dùng giấy tờ bằng cấp giả, nhờ phụ huynh + học viên lừa gạt trung tâm, nhờ người khác dạy thay. Gia sư
                  bỏ lớp, ứng lương trước, thay đổi lịch học, thay đổi mức lương (mà chưa thỏa thuận với trung tâm). Tác
                  phong không nghiêm túc, đi dạy không đúng giờ, xin nghỉ nhiều, dạy sai kiến thức, làm việc riêng trong
                  lúc dạy (sử dụng điện thoại nhắn tin, lướt web, facebook…..) và 1 số các trường hợp khác.
                </p>
              </div>

              {/* Article 2 */}
              <div className="space-y-2">
                <p className="font-bold">ĐIỀU 2: TRÁCH NHIỆM VÀ NGHĨA VỤ BÊN B – GIA SƯ THỰC HIỆN</p>

                <p>
                  <strong>1.</strong> Bên B nhận lớp phải liên lạc với PHHS luôn hoặc liên lạc sớm trong vòng 3 tiếng
                  (trừ khoảng 21h đến 08h hôm sau) sau khi nhận lớp.
                </p>

                <p>
                  <strong>2.</strong> Bên B chấp nhận dạy thử 1 buổi để phụ huynh, học viên đánh giá và kiểm tra chất
                  lượng.
                </p>

                <p>
                  <strong>3.</strong> Bên B cam kết về kiến thức dạy của mình, xuất trình giấy tờ liên quan khi bên A
                  hoặc PHHS yêu cầu.
                </p>

                <p>
                  <strong>4.</strong> Bên B sẽ nhận tiền học phí trực tiếp từ phụ huynh, học viên sau khi dạy đủ một
                  tháng tính từ thời điểm dạy. Với 1 số trường hợp đặc biệt có thể tính lương theo buổi và được đồng ý
                  của trung tâm. (Có thể linh hoạt chia học phí làm 2 phần để nhận vào giữa tháng và cuối tháng, tuỳ vào
                  sự thương lượng với PHHS).
                </p>

                <p>
                  <strong>5.</strong> Bên B gặp phụ huynh, học viên đúng hẹn với tác phong lịch sự, sư phạm. Bên B phải
                  xuất trình giấy giới thiệu, CMND, thẻ SV, thẻ GV hoặc bằng cấp cho phụ huynh học viên xem. Bên B phải
                  chuẩn bị sẵn sách vở tài liệu dạy, không đi tay không đến nhà PH buổi đầu tiên. Bên B gặp gỡ và xác
                  nhận với PH 1 lần nữa về lương, số buổi, thời gian dạy…
                </p>

                <p>
                  <strong>6.</strong> Hợp đồng chỉ bảo hành lớp 1 tháng nên bên B sau khi liên hệ PHHS phải báo ngay cho
                  bên A (trong vòng 4 tiếng) nếu bên B bị từ chối hoặc lớp tạm hoãn để bên A nắm tình hình lớp và tính
                  gia hạn thời hạn bảo hành. Bên B tự chịu trách nhiệm khi không hoặc thông báo trễ về bên A tình hình
                  của lớp dạy đó. Lưu ý: Nếu gia đình PHHS có việc bận, chưa học ngay được, gia sư cần chờ tối đa 2
                  tuần. Nếu PHHS hẹn quá 2 tuần thì gia sư có thể đổi hoặc trả lớp.
                </p>

                <p>
                  <strong>7.</strong> Bên B cam kết : về kiến thức năng lực dạy; Không đổi người dạy; Không bỏ lớp,
                  không ứng lương trước, không thay đổi lịch học, mức lương, (mà chưa thỏa thuận với trung tâm); Tác
                  phong nghiêm túc, đi dạy đúng giờ, không nghỉ nhiều (2 buổi/tháng trở lên là nhiều); Không liên kết
                  hoặc nhờ PHHS lừa gạt trung tâm: Không làm việc riêng trong lúc dạy (nhắn tin, lướt web, facebook, đọc
                  truyện giải trí…..). Ghi chú thêm: bên B cam kết đúng thông tin cá nhân mà mình cung cấp (trong 1 số
                  trường hợp cần xác minh, bên B phải chứng minh, trung tâm mới xem xét giải quyết hoàn phí)
                </p>

                <p>
                  <strong>8.</strong> Thông tin về PHHS, học viên bên A gửi thì bên B phải bảo mật không được cung cấp
                  cho bên thứ 3.
                </p>

                <p>
                  <strong>9.</strong> Trong thời gian giảng dạy nếu bên B vi phạm đạo đức, trộm cắp, xâm hại tới gia
                  đình PHHS hoặc có hành vi vi phạm pháp luật khác, bên B phải chịu trách nhiệm theo đúng quy định của
                  pháp luật hiện hành.
                </p>
              </div>

              {/* Footer */}
              <div className="space-y-2">
                <p>
                  Bên A và bên B đã đọc kỹ và hiểu rõ các điều khoản và cam kết thực hiện đúng hợp đồng. Lưu ý: hợp đồng
                  bảo hành lớp chỉ 1 tháng từ sau khi nhận thông tin lớp.
                </p>
                <p>* Gia sư giới thiệu lớp cho trung tâm (lớp đang dạy, lớp quen biết,..) Phí hoa hồng 50%</p>
              </div>

              {/* Signature */}
              <div className="flex justify-between mt-8 pt-8">
                <div className="text-center">
                  <p>
                    Tp.HCM, ngày <span className="font-medium">{day}</span> tháng{" "}
                    <span className="font-medium">{month}</span> năm <span className="font-medium">{year}</span>
                  </p>
                  <p className="font-bold mt-8">BÊN A (TRUNG TÂM GIA SƯ TUTORHUB)</p>
                  <div className="mt-16 border-b border-gray-400 w-48 mx-auto"></div>
                </div>
                <div className="text-center">
                  <p>&nbsp;</p>
                  <p className="font-bold mt-8">BÊN B (GIA SƯ THỰC HIỆN)</p>
                  <div className="mt-16 border-b border-gray-400 w-48 mx-auto">
                    <p className="mb-2 font-medium">{tutor?.profiles?.full_name || tutor?.full_name || ""}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-end mt-4 print:hidden">
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                In hợp đồng
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
