"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, Calendar, User, Phone, MapPin, FileText, Plus, Edit, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  createStaff,
  updateStaff,
  deleteStaff,
  type CreateStaffData,
  type UpdateStaffData,
} from "@/app/actions/staff-actions"

// Định nghĩa kiểu dữ liệu cho staff
interface Staff {
  id: string
  full_name: string
  email: string
  phone_number?: string
  address?: string
  gender?: string
  role: string
  created_at: string
  updated_at: string
}

// Định nghĩa kiểu dữ liệu cho form tạo/chỉnh sửa staff
interface StaffFormData {
  full_name: string
  email: string
  phone_number: string
  address: string
  gender: string
  password?: string
}

export default function AdminStaffPage() {
  // State cho dữ liệu và UI
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Staff | "full_name" | "phone_number"
    direction: "ascending" | "descending"
  }>({ key: "created_at", direction: "descending" })

  // State cho dialog chi tiết và form
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState<StaffFormData>({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    gender: "male",
    password: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Hàm chuyển đổi mã giới tính thành văn bản hiển thị
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

  // Hàm xử lý sắp xếp
  const handleSort = (key: keyof Staff | "full_name" | "phone_number") => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Hàm mở dialog chi tiết
  const handleOpenDetails = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsDetailDialogOpen(true)
  }

  // Hàm mở dialog form tạo mới
  const handleOpenCreateForm = () => {
    setEditingStaff(null)
    setFormData({
      full_name: "",
      email: "",
      phone_number: "",
      address: "",
      gender: "male",
      password: "",
    })
    setFormErrors({})
    setIsFormDialogOpen(true)
  }

  // Hàm mở dialog form chỉnh sửa
  const handleOpenEditForm = (staff: Staff) => {
    setEditingStaff(staff)
    setFormData({
      full_name: staff.full_name,
      email: staff.email,
      phone_number: staff.phone_number || "",
      address: staff.address || "",
      gender: staff.gender || "male",
    })
    setFormErrors({})
    setIsFormDialogOpen(true)
  }

  // Hàm mở dialog xác nhận xóa
  const handleOpenDeleteDialog = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsDeleteDialogOpen(true)
  }

  // Hàm validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      errors.full_name = "Họ tên không được để trống"
    }

    if (!formData.email.trim()) {
      errors.email = "Email không được để trống"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email không hợp lệ"
    }

    if (!editingStaff && !formData.password) {
      errors.password = "Mật khẩu không được để trống khi tạo mới"
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Hàm lưu session vào cookies để Server Action có thể truy cập
  const saveSessionToCookies = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      // Set cookies để Server Action có thể truy cập
      document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=strict`
      if (session.refresh_token) {
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; secure; samesite=strict`
      }
    }
  }

  // Hàm xử lý submit form
  const handleSubmitForm = async () => {
    if (!validateForm()) return

    setIsProcessing(true)
    try {
      // Lưu session vào cookies trước khi gọi Server Action
      await saveSessionToCookies()

      if (editingStaff) {
        // Cập nhật staff
        const updateData: UpdateStaffData = {
          id: editingStaff.id,
          full_name: formData.full_name,
          phone_number: formData.phone_number || undefined,
          address: formData.address || undefined,
          gender: formData.gender,
          password: formData.password || undefined,
        }

        const result = await updateStaff(updateData)

        if (!result.success) {
          throw new Error(result.error)
        }

        toast({
          title: "Thành công",
          description: "Cập nhật thông tin nhân viên thành công.",
        })
      } else {
        // Tạo staff mới
        const createData: CreateStaffData = {
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number || undefined,
          address: formData.address || undefined,
          gender: formData.gender,
          password: formData.password!,
        }

        const result = await createStaff(createData)

        if (!result.success) {
          throw new Error(result.error)
        }

        toast({
          title: "Thành công",
          description: "Tạo nhân viên mới thành công.",
        })
      }

      setIsFormDialogOpen(false)
      fetchStaff()
    } catch (error: any) {
      console.error("Lỗi khi xử lý form:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xử lý yêu cầu. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Hàm xử lý xóa staff
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return

    setIsProcessing(true)
    try {
      // Lưu session vào cookies trước khi gọi Server Action
      await saveSessionToCookies()

      const result = await deleteStaff(selectedStaff.id)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Xóa nhân viên thành công.",
      })

      setIsDeleteDialogOpen(false)
      fetchStaff()
    } catch (error: any) {
      console.error("Lỗi khi xóa nhân viên:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa nhân viên. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Tải dữ liệu staff từ Supabase
  const fetchStaff = async () => {
    setIsLoading(true)
    try {
      // Check authentication first
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError) {
        console.error("Session error:", sessionError)
        window.location.href = "/login"
        return
      }
      if (!session) {
        window.location.href = "/login"
        return
      }

      // Kiểm tra quyền admin
      const userRole = session.user.user_metadata?.role
      if (userRole !== "admin") {
        toast({
          title: "Không có quyền truy cập",
          description: "Chỉ admin mới có thể truy cập trang này.",
          variant: "destructive",
        })
        return
      }

      const { data: staffData, error: staffError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "staff") // Chỉ lấy staff, không lấy admin
        .order("created_at", { ascending: false })

      if (staffError) {
        throw staffError
      }

      setStaffList(staffData || [])
      setFilteredStaff(staffData || [])
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhân viên:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhân viên. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  // Lọc và sắp xếp dữ liệu khi các điều kiện thay đổi
  useEffect(() => {
    // Lọc dữ liệu theo từ khóa tìm kiếm
    const result = staffList.filter((staff) => {
      const matchesSearch =
        staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })

    // Sắp xếp dữ liệu
    result.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortConfig.key === "full_name") {
        aValue = a.full_name
        bValue = b.full_name
      } else if (sortConfig.key === "phone_number") {
        aValue = a.phone_number
        bValue = b.phone_number
      } else {
        aValue = a[sortConfig.key as keyof Staff]
        bValue = b[sortConfig.key as keyof Staff]
      }

      if (aValue === undefined || bValue === undefined) return 0

      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortConfig.direction === "ascending") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }

      return 0
    })

    setFilteredStaff(result)
  }, [staffList, searchTerm, sortConfig])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý nhân viên</h1>
        <Button onClick={handleOpenCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop view - Table */}
          <div className="hidden md:block overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("full_name")}>
                      Tên nhân viên
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("phone_number")}>
                      SĐT
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("created_at")}>
                      Ngày tạo
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{staff.full_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{staff.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{staff.phone_number || "Chưa cập nhật"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(staff.created_at).split(",")[0]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDetails(staff)}>
                          Chi tiết
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditForm(staff)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteDialog(staff)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - List */}
          <div className="md:hidden space-y-4">
            {filteredStaff.map((staff) => (
              <div key={staff.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{staff.full_name}</h3>
                </div>
                <div className="text-sm text-muted-foreground">Email: {staff.email}</div>
                <div className="text-sm text-muted-foreground">SĐT: {staff.phone_number || "Chưa cập nhật"}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày tạo: {formatDate(staff.created_at).split(",")[0]}</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenDetails(staff)}>
                    Chi tiết
                  </Button>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenEditForm(staff)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleOpenDeleteDialog(staff)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Không tìm thấy nhân viên nào phù hợp với tiêu chí tìm kiếm.
            </div>
          )}
        </>
      )}

      {/* Dialog chi tiết nhân viên */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết nhân viên</DialogTitle>
            <DialogDescription>Thông tin chi tiết về nhân viên</DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">Thông tin cá nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedStaff.full_name}</p>
                      <p className="text-sm text-muted-foreground">Giới tính: {getGenderText(selectedStaff.gender)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{selectedStaff.email}</p>
                    </div>
                  </div>
                  {selectedStaff.phone_number && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Số điện thoại</p>
                        <p className="text-sm text-muted-foreground">{selectedStaff.phone_number}</p>
                      </div>
                    </div>
                  )}
                  {selectedStaff.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Địa chỉ</p>
                        <p className="text-sm text-muted-foreground">{selectedStaff.address}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Ngày tạo</p>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedStaff.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Cập nhật lần cuối</p>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedStaff.updated_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog form tạo/chỉnh sửa nhân viên */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</DialogTitle>
            <DialogDescription>
              {editingStaff ? "Cập nhật thông tin nhân viên" : "Điền thông tin để tạo nhân viên mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nguyễn Văn A"
                disabled={isProcessing}
              />
              {formErrors.full_name && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.full_name}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                disabled={isProcessing || !!editingStaff}
              />
              {formErrors.email && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.email}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Số điện thoại</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="0123456789"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Đường ABC, Quận XYZ"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu {!editingStaff && <span className="text-red-500">*</span>}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingStaff ? "Để trống nếu không muốn thay đổi" : "Nhập mật khẩu"}
                disabled={isProcessing}
              />
              {formErrors.password && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.password}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handleSubmitForm} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : editingStaff ? (
                "Cập nhật"
              ) : (
                "Tạo mới"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa nhân viên "{selectedStaff?.full_name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteStaff} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
