// Component hiển thị hợp đồng giữa gia sư và trung tâm
// Dialog này hiển thị nội dung hợp đồng và cho phép in hợp đồng
"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Sửa lại interface props để phù hợp với cách gọi từ trang admin/class
export default function ContractDialog({
  isOpen,
  onClose,
  tutorData,
  classData,
  contractData,
}: {
  isOpen: boolean
  onClose: () => void
  tutorData: any
  classData: any
  contractData: any
}) {
  // Sử dụng isOpen thay vì open
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Hàm xử lý in hợp đồng
  const handlePrint = () => {
    window.print()
  }

  // Hàm định dạng ngày tháng theo định dạng Việt Nam
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader>
          <DialogTitle>Hợp đồng giảng dạy</DialogTitle>
          <DialogDescription>Hợp đồng giữa gia sư và trung tâm TutorHub</DialogDescription>
        </DialogHeader>

        {/* Hiển thị trạng thái đang tải */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải dữ liệu hợp đồng...</span>
          </div>
        ) : (
          <>
            {/* Nội dung hợp đồng */}
            <div className="contract-content space-y-6 print:text-black">
              {/* Tiêu đề hợp đồng */}
              <div className="text-center space-y-2">
                <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p>Độc Lập – Tự Do – Hạnh Phúc</p>
                <p>—❧❧❧❧—</p>
                <h1 className="text-xl font-bold mt-4">HỢP ĐỒNG THỰC HIỆN</h1>
              </div>

              {/* Thông tin bên A - TutorHub */}
              <div className="space-y-2">
                <p className="font-bold">BÊN A: TUTORHUB CENTER</p>
                <p>✓ Điện thoại: 0344497012 ; Hotline : 0344497012 – 0344497012</p>
                <p>✓ Website: https://tutorcenter.vercel.app ;</p>
                <p>✓ Đại diện giao lớp: ……………………………………………………………………………………………………………</p>
              </div>

              {/* Thông tin bên B - Gia sư */}
              <div className="space-y-2">
                <p className="font-bold">BÊN B: (BÊN GIA SƯ THỰC HIỆN)</p>
                <p>
                  ✓ Anh/chị: {tutorData?.full_name || ".............................."} Sinh năm: ......................
                  Quê: ......................
                </p>
                <p>
                  ✓ CMND số: .......................... Địa chỉ hiện tại:
                  ..........................................................................
                </p>
                <p>
                  ✓ SV / GV Trường: {tutorData?.education || ".............................."}
                  Khoa/Môn: {tutorData?.subjects || ".............................."}
                </p>
                <p>
                  ✓ Điện thoại: {tutorData?.phone_number || "...................."}
                  hoặc............................ Email: {tutorData?.email || ".............................."}
                </p>
                <p className="font-italic">
                  Bên B cam kết các thông tin trên là chính xác, nếu sai bên A không chịu trách nhiệm
                </p>
              </div>

              {/* Điều 1: Trách nhiệm và nghĩa vụ bên A */}
              <div className="space-y-2">
                <p className="font-bold">ĐIỀU 1: TRÁCH NHIỆM VÀ NGHĨA VỤ BÊN A – GIA SƯ TIÊN PHONG</p>
                <p>Bên A cung cấp thông tin về lớp dạy cho bên B:</p>
                <p>Mã lớp: {classData?.id || ".............................."};</p>
                <p>
                  Tên PHHS/HV: {classData?.customer_name || ".............................."}
                  Điện thoại: {classData?.customer_profiles?.phone_number || ".............................."}
                  hoặc..............................
                </p>
                <p>
                  Địa chỉ học: {classData?.address || ".............................."},
                  {classData?.district || ".............................."},
                  {classData?.province || ".............................."}
                </p>
                <p>
                  Lớp: {getLevelText(classData?.level || "")} Môn:{" "}
                  {classData?.subject || ".............................."} Số học viên: .......... Số buổi/tuần:
                  ..........
                </p>
                <p>
                  Lương ......................../........................ Phí nhận lớp dạy: ........................
                </p>
                <p>Thời hạn trả ........................</p>
                <p>Thỏa thuận thêm (nếu có): ........................</p>
              </div>

              {/* Nội dung điều khoản 1 */}
              <div className="space-y-2 text-sm">
                <p>
                  Bên A hoàn phí nhận lớp cho bên B, nếu bên B không nhận được lớp với những lý do chính đáng như: PHHS
                  cho con học tại trung tâm, học tại trường, có gia sư rồi, học cô giáo chủ nhiệm, không còn thời gian.
                  PHHS thay đổi lịch học, mức lương, số lượng học viên, môn học, địa chỉ học dẫn tới gia sư không dạy
                  được hoặc gia đình PHHS gây nguy hiểm, đe dọa đến thân thể, sức khỏe của gia sư.
                </p>
                <p>
                  Bên A sẽ hoàn phí lại cho bên B sau khi cho giám sát xuống nhà PHHS xác minh, thời gian hoàn phí sau
                  khi xác minh từ 5 tới 7 ngày làm việc (chỉ hoàn phí vào các ngày làm việc sau 13h).
                </p>
                <p>
                  Mức hoàn phí: Bên A hoàn trả 100% phí cho bên B nếu bên B gặp trục trặc chính đáng như trên trong buổi
                  dạy thử đầu. Hoàn trả 75% phí cho bên B nếu bên B gặp trục trặc chính đáng trên trong vòng tuần đầu
                  tiên. Hoàn 50% trong tuần thứ 2 và hoàn 25% trong tuần thứ 3.
                </p>
                <p>
                  Bên A không hoàn phí cho bên B khi bên B không làm theo đúng hướng dẫn nhận lớp của bên A như không
                  đem theo giấy giới thiệu, CMND, thẻ SV, thẻ GV hoặc bằng cấp khi tới gặp PHHS; dùng giấy tờ bằng cấp
                  giả, nhờ phụ huynh + học viên lừa gạt trung tâm, nhờ người khác dạy thay. Gia sư bỏ lớp, ứng lương
                  trước, thay đổi lịch học, thay đổi mức lương (mà chưa thỏa thuận với trung tâm). Tác phong không
                  nghiêm túc, đi dạy không đúng giờ, xin nghỉ nhiều, dạy sai kiến thức, làm việc riêng trong lúc dạy (sử
                  dụng điện thoại nhắn tin, lướt web, facebook…..) và 1 số các trường hợp khác.
                </p>
              </div>

              {/* Điều 2: Trách nhiệm và nghĩa vụ bên B */}
              <div className="space-y-2">
                <p className="font-bold">ĐIỀU 2: TRÁCH NHIỆM VÀ NGHĨA VỤ BÊN B – GIA SƯ THỰC HIỆN</p>
              </div>

              {/* Nội dung điều khoản 2 */}
              <div className="space-y-2 text-sm">
                <p>
                  Bên B nhận lớp phải liên lạc với PHHS luôn hoặc liên lạc sớm trong vòng 3 tiếng (trừ khoảng 21h đến
                  08h hôm sau) sau khi nhận lớp.
                </p>
                <p>Bên B chấp nhận dạy thử 1 buổi để phụ huynh, học viên đánh giá và kiểm tra chất lượng.</p>
                <p>
                  Bên B cam kết về kiến thức dạy của mình, xuất trình giấy tờ liên quan khi bên A hoặc PHHS yêu cầu.
                </p>
                <p>
                  Bên B sẽ nhận tiền học phí trực tiếp từ phụ huynh, học viên sau khi dạy đủ một tháng tính từ thời điểm
                  dạy. Với 1 số trường hợp đặc biệt có thể tính lương theo buổi và được đồng ý của trung tâm. (Có thể
                  linh hoạt chia học phí làm 2 phần để nhận vào giữa tháng và cuối tháng, tuỳ vào sự thương lượng với
                  PHHS).
                </p>
                <p>
                  Bên B gặp phụ huynh, học viên đúng hẹn với tác phong lịch sự, sư phạm. Bên B phải xuất trình giấy giới
                  thiệu, CMND, thẻ SV, thẻ GV hoặc bằng cấp cho phụ huynh học viên xem. Bên B phải chuẩn bị sẵn sách vở
                  tài liệu dạy, không đi tay không đến nhà PH buổi đầu tiên. Bên B gặp gỡ và xác nhận với PH 1 lần nữa
                  về lương, số buổi, thời gian dạy…
                </p>
                <p>
                  Hợp đồng chỉ bảo hành lớp 1 tháng nên bên B sau khi liên hệ PHHS phải báo ngay cho bên A (trong vòng 4
                  tiếng) nếu bên B bị từ chối hoặc lớp tạm hoãn để bên A nắm tình hình lớp và tính gia hạn thời hạn bảo
                  hành. Bên B tự chịu trách nhiệm khi không hoặc thông báo trễ về bên A tình hình của lớp dạy đó. Lưu ý:
                  Nếu gia đình PHHS có việc bận, chưa học ngay được, gia sư cần chờ tối đa 2 tuần. Nếu PHHS hẹn quá 2
                  tuần thì gia sư có thể đổi hoặc trả lớp.
                </p>
                <p>
                  Bên B cam kết : về kiến thức năng lực dạy; Không đổi người dạy; Không bỏ lớp, không ứng lương trước,
                  không thay đổi lịch học, mức lương, (mà chưa thỏa thuận với trung tâm); Tác phong nghiêm túc, đi dạy
                  đúng giờ, không nghỉ nhiều (2 buổi/tháng trở lên là nhiều); Không liên kết hoặc nhờ PHHS lừa gạt trung
                  tâm: Không làm việc riêng trong lúc dạy (nhắn tin, lướt web, facebook, đọc truyện giải trí…..). Ghi
                  chú thêm: bên B cam kết đúng thông tin cá nhân mà mình cung cấp (trong 1 số trường hợp cần xác minh,
                  bên B phải chứng minh, trung tâm mới xem xét giải quyết hoàn phí)
                </p>
                <p>Thông tin về PHHS, học viên bên A gửi thì bên B phải bảo mật không được cung cấp cho bên thứ 3.</p>
                <p>
                  Trong thời gian giảng dạy nếu bên B vi phạm đạo đức, trộm cắp, xâm hại tới gia đình PHHS hoặc có hành
                  vi vi phạm pháp luật khác, bên B phải chịu trách nhiệm theo đúng quy định của pháp luật hiện hành. Bên
                  A và bên B đã đọc kỹ và hiểu rõ các điều khoản và cam kết thực hiện đúng hợp đồng. Lưu ý: hơp đồng bảo
                  hành lớp chỉ 1 tháng từ sau khi nhận thông tin lớp.
                </p>
                <p>Gia sư giới thiệu lớp cho trung tâm (lớp đang dạy, lớp quen biết,..) Phí hoa hồng 50%</p>
              </div>

              {/* Phần ký tên */}
              <div className="flex justify-between mt-8">
                <div className="text-center">
                  <p>
                    Tp.HCM, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                  <p className="font-bold mt-4">BÊN A (TUTORHUB)</p>
                  <p className="mt-16">........................</p>
                </div>
                <div className="text-center">
                  <p>&nbsp;</p>
                  <p className="font-bold mt-4">BÊN B (GIA SƯ THỰC HIỆN)</p>
                  <p className="mt-16">{tutorData?.full_name || "........................"}</p>
                </div>
              </div>
            </div>

            {/* Nút in hợp đồng */}
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
