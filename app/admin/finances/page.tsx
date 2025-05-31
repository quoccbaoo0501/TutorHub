"use client"

import { useState, useEffect } from "react"
import { User, Plus, CheckCircle, X, Edit, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createOrUpdateSalary, paySalary, cancelSalaryPayment, type SalaryData } from "@/app/actions/salary-actions"
import { useRouter } from "next/navigation"

interface Staff {
  id: string
  full_name: string
  email: string
}

interface StaffSalary {
  id: string
  staff_id: string
  base_salary: number
  bonus: number
  deduction: number
  total_salary: number
  month: number
  year: number
  status: string
  paid_date?: string
  notes?: string
  staff: Staff
}

export default function AdminFinancePage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [salaries, setSalaries] = useState<StaffSalary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false)
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedSalary, setSelectedSalary] = useState<StaffSalary | null>(null)
  const [salaryForm, setSalaryForm] = useState({
    staff_id: "",
    base_salary: "",
    bonus: "",
    deduction: "",
    notes: "",
  })

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Hàm lưu session vào cookies
  const saveSessionToCookies = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=strict`
      if (session.refresh_token) {
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; secure; samesite=strict`
      }
    }
  }

  // Hàm format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  // Hàm format ngày
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Hàm lấy tên tháng
  const getMonthName = (month: number) => {
    const months = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ]
    return months[month - 1]
  }

  // Tải dữ liệu
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        window.location.href = "/login"
        return
      }

      const userRole = session.user.user_metadata?.role
      if (userRole !== "admin") {
        toast({
          title: "Không có quyền truy cập",
          description: "Chỉ admin mới có thể truy cập trang này.",
          variant: "destructive",
        })
        return
      }

      // Lấy danh sách nhân viên
      const { data: staffData, error: staffError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "staff")
        .order("full_name")

      if (staffError) throw staffError

      // Lấy danh sách lương theo tháng/năm được chọn
      const { data: salariesData, error: salariesError } = await supabase
        .from("staff_salaries")
        .select(
          `
          *,
          staff:profiles!staff_salaries_staff_id_fkey(id, full_name, email)
        `,
        )
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .order("created_at", { ascending: false })

      if (salariesError) throw salariesError

      setStaffList(staffData || [])
      setSalaries(salariesData || [])
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear])

  // Hàm mở dialog tạo/sửa lương
  const handleOpenSalaryDialog = (salary?: StaffSalary) => {
    if (salary) {
      setSalaryForm({
        staff_id: salary.staff_id,
        base_salary: salary.base_salary.toString(),
        bonus: salary.bonus.toString(),
        deduction: salary.deduction.toString(),
        notes: salary.notes || "",
      })
    } else {
      setSalaryForm({
        staff_id: "",
        base_salary: "",
        bonus: "",
        deduction: "",
        notes: "",
      })
    }
    setIsSalaryDialogOpen(true)
  }

  // Hàm lưu thông tin lương
  const handleSaveSalary = async () => {
    if (!salaryForm.staff_id || !salaryForm.base_salary) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      await saveSessionToCookies()

      const salaryData: SalaryData = {
        staff_id: salaryForm.staff_id,
        base_salary: Number.parseFloat(salaryForm.base_salary),
        bonus: salaryForm.bonus ? Number.parseFloat(salaryForm.bonus) : 0,
        deduction: salaryForm.deduction ? Number.parseFloat(salaryForm.deduction) : 0,
        month: selectedMonth,
        year: selectedYear,
        notes: salaryForm.notes,
      }

      const result = await createOrUpdateSalary(salaryData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Lưu thông tin lương thành công.",
      })

      setIsSalaryDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu thông tin lương.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm mở dialog trả lương
  const handleOpenPayDialog = (salary: StaffSalary) => {
    setSelectedSalary(salary)
    setIsPayDialogOpen(true)
  }

  // Hàm trả lương
  const handlePaySalary = async () => {
    if (!selectedSalary) return

    setIsProcessing(true)
    try {
      await saveSessionToCookies()
      const result = await paySalary(selectedSalary.id)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Trả lương thành công.",
      })

      setIsPayDialogOpen(false)
      setSelectedSalary(null)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể trả lương.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm hủy trả lương
  const handleCancelPayment = async (salaryId: string) => {
    try {
      await saveSessionToCookies()
      const result = await cancelSalaryPayment(salaryId)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Hủy trả lương thành công.",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hủy trả lương.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý tài chính - Trả lương nhân viên</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/finance/payments")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Phí môi giới
          </Button>
          <Button onClick={() => handleOpenSalaryDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm thông tin lương
          </Button>
        </div>
      </div>

      {/* Bộ lọc tháng/năm */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label>Tháng:</Label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>Năm:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Danh sách lương nhân viên */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salaries.map((salary) => (
          <Card key={salary.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {salary.staff.full_name}
                </div>
                <Badge variant={salary.status === "paid" ? "default" : "secondary"}>
                  {salary.status === "paid" ? "Đã trả" : "Chưa trả"}
                </Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">{salary.staff.email}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Lương cơ bản:</span>
                  <span className="font-medium">{formatCurrency(salary.base_salary)}</span>
                </div>
                {salary.bonus > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Thưởng:</span>
                    <span className="font-medium">+{formatCurrency(salary.bonus)}</span>
                  </div>
                )}
                {salary.deduction > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Khấu trừ:</span>
                    <span className="font-medium">-{formatCurrency(salary.deduction)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="font-bold text-lg">{formatCurrency(salary.total_salary)}</span>
                </div>
              </div>

              {salary.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Ghi chú:</strong> {salary.notes}
                </div>
              )}

              {salary.paid_date && (
                <div className="text-sm text-muted-foreground">
                  <strong>Ngày trả:</strong> {formatDate(salary.paid_date)}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenSalaryDialog(salary)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
                {salary.status === "pending" ? (
                  <Button size="sm" onClick={() => handleOpenPayDialog(salary)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Trả lương
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => handleCancelPayment(salary.id)}>
                    <X className="h-4 w-4 mr-1" />
                    Hủy trả lương
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {salaries.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          Chưa có thông tin lương cho tháng {getMonthName(selectedMonth)} năm {selectedYear}.
        </div>
      )}

      {/* Dialog thêm/sửa thông tin lương */}
      <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin lương nhân viên</DialogTitle>
            <DialogDescription>
              Nhập thông tin lương cho tháng {getMonthName(selectedMonth)} năm {selectedYear}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Nhân viên <span className="text-red-500">*</span>
              </Label>
              <Select
                value={salaryForm.staff_id}
                onValueChange={(value) => setSalaryForm({ ...salaryForm, staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Lương cơ bản <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={salaryForm.base_salary}
                onChange={(e) => setSalaryForm({ ...salaryForm, base_salary: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Thưởng</Label>
              <Input
                type="number"
                value={salaryForm.bonus}
                onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Khấu trừ</Label>
              <Input
                type="number"
                value={salaryForm.deduction}
                onChange={(e) => setSalaryForm({ ...salaryForm, deduction: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={salaryForm.notes}
                onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalaryDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handleSaveSalary} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận trả lương */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận trả lương</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn trả lương cho nhân viên này không?</DialogDescription>
          </DialogHeader>

          {selectedSalary && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <strong>Nhân viên:</strong> {selectedSalary.staff.full_name}
                </div>
                <div>
                  <strong>Tháng:</strong> {getMonthName(selectedSalary.month)} {selectedSalary.year}
                </div>
                <div>
                  <strong>Tổng lương:</strong> {formatCurrency(selectedSalary.total_salary)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handlePaySalary} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận trả lương"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
