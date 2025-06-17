"use client"

import { useState, useEffect } from "react"
import { DollarSign, Plus, CheckCircle, X, Settings, Eye, BookOpen, Users } from "lucide-react"
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
import { createPayment, updatePayment, updatePaymentSettings, type PaymentData } from "@/app/actions/payment-actions"

interface Class {
  id: string
  name: string
  subject: string
  status: string
  selected_tutor_id?: string
}

interface Tutor {
  id: string
  profiles: {
    full_name: string
    email: string
  }
}

interface Contract {
  id: string
  fee: number // Sử dụng fee thay vì total_amount
  start_date: string
  end_date: string
  class_id?: string
  tutor_id?: string
}

interface Payment {
  id: string
  class_id: string
  tutor_id: string
  contract_id?: string
  fee_percentage: number
  contract_amount: number
  calculated_fee: number
  actual_fee: number
  status: string
  due_date?: string
  paid_date?: string
  payment_method?: string
  notes?: string
  created_at: string
  class: Class
  tutor: Tutor
  contract?: Contract
}

interface PaymentSettings {
  id: string
  fee_percentage: number
  min_fee: number
  max_fee?: number
}

interface Stats {
  totalClasses: number
  totalCustomers: number
  totalTutors: number
  totalStaff: number
  newClassesToday: number
  newCustomersToday: number
  newTutorsToday: number
  newStaffToday: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [availableClasses, setAvailableClasses] = useState<Class[]>([])

  const [paymentForm, setPaymentForm] = useState({
    class_id: "",
    tutor_id: "",
    contract_id: "",
    contract_amount: "",
    actual_fee: "",
    due_date: "",
    notes: "",
  })

  const [settingsForm, setSettingsForm] = useState({
    fee_percentage: "",
    min_fee: "",
    max_fee: "",
  })

  const { toast } = useToast()
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
    })
  }

  // Hàm lấy màu badge theo status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>
      case "pending":
        return <Badge variant="secondary">Chờ thanh toán</Badge>
      case "overdue":
        return <Badge variant="destructive">Quá hạn</Badge>
      case "waived":
        return <Badge className="bg-blue-100 text-blue-800">Miễn phí</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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

      // Lấy danh sách phí môi giới
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          *,
          class:classes!payments_class_id_fkey(id, name, subject, status),
          tutor:tutors!payments_tutor_id_fkey(id, profiles!tutors_id_fkey(full_name, email)),
          contract:contracts!payments_contract_id_fkey(id, fee, start_date, end_date)
        `,
        )
        .order("created_at", { ascending: false })

      if (paymentsError) throw paymentsError

      // Lấy danh sách lớp đã có gia sư
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, name, subject, status, selected_tutor_id")
        .not("selected_tutor_id", "is", null)
        .eq("status", "matched")

      console.log("Classes data:", classesData) // Debug log

      if (classesError) throw classesError

      // Lấy danh sách gia sư
      const { data: tutorsData, error: tutorsError } = await supabase
        .from("tutors")
        .select("id, profiles!tutors_id_fkey(full_name, email)")

      if (tutorsError) throw tutorsError

      // Lấy danh sách hợp đồng
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("id, class_id, tutor_id, fee, start_date, end_date")
        .eq("status", "active")

      if (contractsError) throw contractsError

      // Lấy cài đặt phí môi giới
      const { data: settingsData, error: settingsError } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("is_active", true)
        .single()

      if (settingsError && settingsError.code !== "PGRST116") throw settingsError

      setPayments(paymentsData || [])
      setClasses(classesData || [])

      // Lọc ra những lớp chưa có phí môi giới
      const classesWithPayments = paymentsData?.map((p) => p.class_id) || []
      const availableClassesData = classesData?.filter((cls) => !classesWithPayments.includes(cls.id)) || []
      setAvailableClasses(availableClassesData)

      // Fix tutors data structure
      const formattedTutors =
        tutorsData?.map((tutor) => ({
          id: tutor.id,
          profiles: tutor.profiles as unknown as { full_name: string; email: string },
        })) || []

      setTutors(formattedTutors)
      setContracts(contractsData || [])
      setSettings(settingsData || null)

      if (settingsData) {
        setSettingsForm({
          fee_percentage: settingsData.fee_percentage.toString(),
          min_fee: settingsData.min_fee.toString(),
          max_fee: settingsData.max_fee?.toString() || "",
        })
      }

      // Lấy thống kê
      const { data: statsData, error: statsError } = await supabase
        .from("admin_stats")
        .select("*")
        .single()

      if (statsError) throw statsError

      setStats(statsData || null)
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
  }, [])

  // Lọc dữ liệu
  const filteredPayments = payments.filter((payment) => {
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesSearch =
      payment.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.tutor.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.class.subject.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Hàm mở dialog tạo phí môi giới
  const handleOpenPaymentDialog = () => {
    setPaymentForm({
      class_id: "",
      tutor_id: "",
      contract_id: "",
      contract_amount: "",
      actual_fee: "",
      due_date: "",
      notes: "",
    })
    setIsPaymentDialogOpen(true)
  }

  // Hàm lưu phí môi giới
  const handleSavePayment = async () => {
    if (!paymentForm.class_id || !paymentForm.tutor_id || !paymentForm.contract_amount) {
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

      const paymentData: PaymentData = {
        class_id: paymentForm.class_id,
        tutor_id: paymentForm.tutor_id,
        contract_id: paymentForm.contract_id || undefined,
        contract_amount: Number.parseFloat(paymentForm.contract_amount),
        actual_fee: paymentForm.actual_fee ? Number.parseFloat(paymentForm.actual_fee) : undefined,
        due_date: paymentForm.due_date || undefined,
        notes: paymentForm.notes || undefined,
      }

      const result = await createPayment(paymentData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Tạo phí môi giới thành công.",
      })

      setIsPaymentDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo phí môi giới.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm cập nhật trạng thái thanh toán
  const handleUpdatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      await saveSessionToCookies()
      const result = await updatePayment(paymentId, { status })

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: `Cập nhật trạng thái thành công.`,
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái.",
        variant: "destructive",
      })
    }
  }

  // Hàm lưu cài đặt
  const handleSaveSettings = async () => {
    if (!settingsForm.fee_percentage || !settingsForm.min_fee) {
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

      const result = await updatePaymentSettings(
        Number.parseFloat(settingsForm.fee_percentage),
        Number.parseFloat(settingsForm.min_fee),
        settingsForm.max_fee ? Number.parseFloat(settingsForm.max_fee) : undefined,
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Cập nhật cài đặt thành công.",
      })

      setIsSettingsDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật cài đặt.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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
        <h1 className="text-3xl font-bold">Quản lý phí môi giới</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Cài đặt
          </Button>
          <Button onClick={handleOpenPaymentDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo phí môi giới
          </Button>
        </div>
      </div>

      {/* Hiển thị cài đặt hiện tại */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt phí môi giới hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Phí môi giới (%)</Label>
                <div className="text-2xl font-bold text-primary">{settings.fee_percentage}%</div>
              </div>
              <div>
                <Label>Phí tối thiểu</Label>
                <div className="text-lg font-semibold">{formatCurrency(settings.min_fee)}</div>
              </div>
              <div>
                <Label>Phí tối đa</Label>
                <div className="text-lg font-semibold">
                  {settings.max_fee ? formatCurrency(settings.max_fee) : "Không giới hạn"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bộ lọc */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Tìm kiếm theo tên lớp, gia sư, môn học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ thanh toán</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="overdue">Quá hạn</SelectItem>
            <SelectItem value="waived">Miễn phí</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Danh sách phí môi giới */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPayments.map((payment) => (
          <Card key={payment.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {payment.class.name}
                </div>
                {getStatusBadge(payment.status)}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <div>Gia sư: {payment.tutor.profiles.full_name}</div>
                <div>Môn: {payment.class.subject}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Giá trị hợp đồng:</span>
                  <span className="font-medium">{formatCurrency(payment.contract_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí tính toán ({payment.fee_percentage}%):</span>
                  <span className="font-medium">{formatCurrency(payment.calculated_fee)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Phí thực tế:</span>
                  <span className="font-bold text-lg">{formatCurrency(payment.actual_fee)}</span>
                </div>
              </div>

              {payment.due_date && (
                <div className="text-sm text-muted-foreground">
                  <strong>Hạn thanh toán:</strong> {formatDate(payment.due_date)}
                </div>
              )}

              {payment.paid_date && (
                <div className="text-sm text-muted-foreground">
                  <strong>Ngày thanh toán:</strong> {formatDate(payment.paid_date)}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPayment(payment)
                    setIsDetailDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Chi tiết
                </Button>
                {payment.status === "pending" ? (
                  <Button size="sm" onClick={() => handleUpdatePaymentStatus(payment.id, "paid")}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Đã thanh toán
                  </Button>
                ) : payment.status === "paid" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdatePaymentStatus(payment.id, "pending")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Hủy thanh toán
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          {payments.length === 0 ? "Chưa có phí môi giới nào." : "Không tìm thấy kết quả phù hợp."}
        </div>
      )}

      {/* Dialog tạo phí môi giới */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo phí môi giới</DialogTitle>
            <DialogDescription>Tạo phí môi giới cho lớp đã có gia sư</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Lớp học <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paymentForm.class_id}
                onValueChange={(value) => {
                  setPaymentForm({ ...paymentForm, class_id: value })
                  // Tự động chọn gia sư của lớp
                  const selectedClass = availableClasses.find((c) => c.id === value)
                  if (selectedClass && selectedClass.selected_tutor_id) {
                    // Tìm hợp đồng tương ứng
                    const relatedContract = contracts.find(
                      (c) => c.class_id === value && c.tutor_id === selectedClass.selected_tutor_id,
                    )
                    setPaymentForm((prev) => ({
                      ...prev,
                      class_id: value,
                      tutor_id: selectedClass.selected_tutor_id || "",
                      contract_id: relatedContract?.id || "",
                      contract_amount: relatedContract?.fee?.toString() || "",
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp học" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Không có lớp nào có thể tạo phí môi giới
                    </div>
                  )}
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Giá trị hợp đồng <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={paymentForm.contract_amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, contract_amount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Phí thực tế (để trống để tính tự động)</Label>
              <Input
                type="number"
                value={paymentForm.actual_fee}
                onChange={(e) => setPaymentForm({ ...paymentForm, actual_fee: e.target.value })}
                placeholder="Tính tự động theo cài đặt"
              />
            </div>

            <div className="space-y-2">
              <Label>Hạn thanh toán</Label>
              <Input
                type="date"
                value={paymentForm.due_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handleSavePayment} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog cài đặt */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cài đặt phí môi giới</DialogTitle>
            <DialogDescription>Cập nhật cài đặt tính phí môi giới</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Phí môi giới (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                value={settingsForm.fee_percentage}
                onChange={(e) => setSettingsForm({ ...settingsForm, fee_percentage: e.target.value })}
                placeholder="10.00"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Phí tối thiểu (VND) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={settingsForm.min_fee}
                onChange={(e) => setSettingsForm({ ...settingsForm, min_fee: e.target.value })}
                placeholder="100000"
              />
            </div>

            <div className="space-y-2">
              <Label>Phí tối đa (VND)</Label>
              <Input
                type="number"
                value={settingsForm.max_fee}
                onChange={(e) => setSettingsForm({ ...settingsForm, max_fee: e.target.value })}
                placeholder="Để trống nếu không giới hạn"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handleSaveSettings} disabled={isProcessing}>
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

      {/* Dialog chi tiết */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết phí môi giới</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lớp học</Label>
                  <div className="font-medium">{selectedPayment.class.name}</div>
                </div>
                <div>
                  <Label>Môn học</Label>
                  <div className="font-medium">{selectedPayment.class.subject}</div>
                </div>
                <div>
                  <Label>Gia sư</Label>
                  <div className="font-medium">{selectedPayment.tutor.profiles.full_name}</div>
                </div>
                <div>
                  <Label>Email gia sư</Label>
                  <div className="font-medium">{selectedPayment.tutor.profiles.email}</div>
                </div>
                <div>
                  <Label>Giá trị hợp đồng</Label>
                  <div className="font-medium">{formatCurrency(selectedPayment.contract_amount)}</div>
                </div>
                <div>
                  <Label>Phí môi giới (%)</Label>
                  <div className="font-medium">{selectedPayment.fee_percentage}%</div>
                </div>
                <div>
                  <Label>Phí tính toán</Label>
                  <div className="font-medium">{formatCurrency(selectedPayment.calculated_fee)}</div>
                </div>
                <div>
                  <Label>Phí thực tế</Label>
                  <div className="font-medium text-lg">{formatCurrency(selectedPayment.actual_fee)}</div>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label>Ngày tạo</Label>
                  <div className="font-medium">{formatDate(selectedPayment.created_at)}</div>
                </div>
                {selectedPayment.due_date && (
                  <div>
                    <Label>Hạn thanh toán</Label>
                    <div className="font-medium">{formatDate(selectedPayment.due_date)}</div>
                  </div>
                )}
                {selectedPayment.paid_date && (
                  <div>
                    <Label>Ngày thanh toán</Label>
                    <div className="font-medium">{formatDate(selectedPayment.paid_date)}</div>
                  </div>
                )}
              </div>

              {selectedPayment.notes && (
                <div>
                  <Label>Ghi chú</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">{selectedPayment.notes}</div>
                </div>
              )}

              {selectedPayment.contract && (
                <div>
                  <Label>Thông tin hợp đồng</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md space-y-1">
                    <div>Giá trị: {formatCurrency(selectedPayment.contract.fee)}</div>
                    <div>
                      Thời gian: {formatDate(selectedPayment.contract.start_date)} -{" "}
                      {formatDate(selectedPayment.contract.end_date)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Thống kê */}
      {stats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng số lớp học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">+{stats.newClassesToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tổng số khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">+{stats.newCustomersToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tổng số gia sư</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTutors}</div>
              <p className="text-xs text-muted-foreground">+{stats.newTutorsToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tổng số nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">+{stats.newStaffToday}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
