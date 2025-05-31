"use client"

import { useState, useEffect } from "react"
import { Clock, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { assignStaffSchedule, removeStaffSchedule, type AssignScheduleData } from "@/app/actions/schedule-actions"

interface Staff {
  id: string
  full_name: string
  email: string
}

interface WorkShift {
  id: string
  name: string
  start_time: string
  end_time: string
  days_of_week: number[]
}

interface StaffSchedule {
  id: string
  staff_id: string
  shift_id: string
  start_date: string
  end_date?: string
  status: string
  staff: Staff
  shift: WorkShift
}

export default function AdminSchedulePage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([])
  const [schedules, setSchedules] = useState<StaffSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState("")
  const [selectedShift, setSelectedShift] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pendingAssignment, setPendingAssignment] = useState<AssignScheduleData | null>(null)

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

  // Hàm lấy tên ngày trong tuần
  const getDayName = (dayNumber: number) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    return days[dayNumber]
  }

  // Hàm format thời gian
  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  // Hàm format ngày
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN")
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

      // Lấy danh sách ca làm việc
      const { data: shiftsData, error: shiftsError } = await supabase.from("work_shifts").select("*").order("name")

      if (shiftsError) throw shiftsError

      // Lấy danh sách lịch làm việc hiện tại
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("staff_schedules")
        .select(
          `
          *,
          staff:profiles!staff_schedules_staff_id_fkey(id, full_name, email),
          shift:work_shifts!staff_schedules_shift_id_fkey(*)
        `,
        )
        .eq("status", "active")
        .order("start_date", { ascending: false })

      if (schedulesError) throw schedulesError

      setStaffList(staffData || [])
      setWorkShifts(shiftsData || [])
      setSchedules(schedulesData || [])
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

  // Hàm mở dialog phân công
  const handleOpenAssignDialog = () => {
    setSelectedStaff("")
    setSelectedShift("")
    setStartDate("")
    setEndDate("")
    setIsAssignDialogOpen(true)
  }

  // Hàm xác nhận phân công
  const handleConfirmAssignment = () => {
    if (!selectedStaff || !selectedShift || !startDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin.",
        variant: "destructive",
      })
      return
    }

    const assignmentData: AssignScheduleData = {
      staff_id: selectedStaff,
      shift_id: selectedShift,
      start_date: startDate,
      end_date: endDate || undefined,
    }

    setPendingAssignment(assignmentData)
    setIsAssignDialogOpen(false)
    setIsConfirmDialogOpen(true)
  }

  // Hàm thực hiện phân công
  const handleAssignSchedule = async () => {
    if (!pendingAssignment) return

    setIsProcessing(true)
    try {
      await saveSessionToCookies()
      const result = await assignStaffSchedule(pendingAssignment)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Phân công lịch làm việc thành công.",
      })

      setIsConfirmDialogOpen(false)
      setPendingAssignment(null)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể phân công lịch làm việc.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm xóa lịch làm việc
  const handleRemoveSchedule = async (scheduleId: string) => {
    try {
      await saveSessionToCookies()
      const result = await removeStaffSchedule(scheduleId)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Xóa lịch làm việc thành công.",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa lịch làm việc.",
        variant: "destructive",
      })
    }
  }

  // Lấy nhân viên chưa được xếp lịch cho ca cụ thể
  const getAvailableStaff = (shiftId: string) => {
    const assignedStaffIds = schedules.filter((s) => s.shift_id === shiftId).map((s) => s.staff_id)
    return staffList.filter((staff) => !assignedStaffIds.includes(staff.id))
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
        <h1 className="text-3xl font-bold">Xếp lịch nhân viên</h1>
        <Button onClick={handleOpenAssignDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Phân công lịch làm việc
        </Button>
      </div>

      {/* Hiển thị ca làm việc và nhân viên được phân công */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workShifts.map((shift) => {
          const shiftSchedules = schedules.filter((s) => s.shift_id === shift.id)
          return (
            <Card key={shift.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {shift.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  <div>
                    Thời gian: {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                  </div>
                  <div>Ngày: {shift.days_of_week.map((day) => getDayName(day)).join(", ")}</div>
                </div>
              </CardHeader>
              <CardContent>
                {shiftSchedules.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Chưa có nhân viên được phân công</div>
                ) : (
                  <div className="space-y-3">
                    {shiftSchedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{schedule.staff.full_name}</div>
                          <div className="text-sm text-muted-foreground">{schedule.staff.email}</div>
                          <div className="text-sm text-muted-foreground">
                            Từ: {formatDate(schedule.start_date)}
                            {schedule.end_date && ` - ${formatDate(schedule.end_date)}`}
                          </div>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveSchedule(schedule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog phân công lịch làm việc */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Phân công lịch làm việc</DialogTitle>
            <DialogDescription>Chọn nhân viên và ca làm việc để phân công</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ca làm việc</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ca làm việc" />
                </SelectTrigger>
                <SelectContent>
                  {workShifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.name} ({formatTime(shift.start_time)} - {formatTime(shift.end_time)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nhân viên</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {selectedShift &&
                    getAvailableStaff(selectedShift).map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ngày bắt đầu</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Ngày kết thúc (tùy chọn)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmAssignment}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận phân công */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận lịch làm việc</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn phân công lịch làm việc này không?</DialogDescription>
          </DialogHeader>

          {pendingAssignment && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <strong>Nhân viên:</strong> {staffList.find((s) => s.id === pendingAssignment.staff_id)?.full_name}
                </div>
                <div>
                  <strong>Ca làm việc:</strong> {workShifts.find((s) => s.id === pendingAssignment.shift_id)?.name}
                </div>
                <div>
                  <strong>Ngày bắt đầu:</strong> {formatDate(pendingAssignment.start_date)}
                </div>
                {pendingAssignment.end_date && (
                  <div>
                    <strong>Ngày kết thúc:</strong> {formatDate(pendingAssignment.end_date)}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isProcessing}>
              Không
            </Button>
            <Button onClick={handleAssignSchedule} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Có"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
