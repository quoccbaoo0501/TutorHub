"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, Calendar, User, Phone, MapPin, FileText, Trash2, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { updateCustomer, type UpdateCustomerData } from "@/app/actions/customer-actions"

// Định nghĩa kiểu dữ liệu cho khách hàng
interface Customer {
  id: string
  full_name: string
  email: string
  phone_number?: string
  address?: string
  gender?: string
  created_at: string
  classes?: Array<{
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
    selected_tutor?: {
      id: string
      profiles: {
        full_name: string
        email: string
        phone_number?: string
      }
    }
  }>
}

// Định nghĩa kiểu dữ liệu cho form chỉnh sửa khách hàng
interface CustomerFormData {
  full_name: string
  phone_number: string
  address: string
  gender: string
}

// Tạo Supabase client với service role key cho admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default function AdminCustomersPage() {
  // State cho dữ liệu và UI
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Customer | "full_name" | "phone_number"
    direction: "ascending" | "descending"
  }>({ key: "created_at", direction: "descending" })

  // State cho dialog chi tiết
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // State cho dialog form chỉnh sửa
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: "",
    phone_number: "",
    address: "",
    gender: "male",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
  const handleSort = (key: keyof Customer | "full_name" | "phone_number") => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Hàm mở dialog chi tiết
  const handleOpenDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDialogOpen(true)
  }

  // Hàm mở dialog form chỉnh sửa
  const handleOpenEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      full_name: customer.full_name,
      phone_number: customer.phone_number || "",
      address: customer.address || "",
      gender: customer.gender || "male",
    })
    setFormErrors({})
    setIsFormDialogOpen(true)
  }

  // Hàm lấy màu badge dựa trên trạng thái lớp
  const getClassStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "matched":
        return "secondary"
      case "completed":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getClassStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ duyệt"
      case "approved":
        return "Đã duyệt"
      case "matched":
        return "Đã ghép"
      case "completed":
        return "Hoàn thành"
      case "cancelled":
        return "Đã hủy"
      default:
        return status
    }
  }

  // Hàm xử lý xóa khách hàng
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      setIsProcessing(true)

      // Lấy danh sách lớp học của khách hàng
      const { data: customerClasses } = await supabase.from("classes").select("id").eq("customer_id", customerId)

      // Xóa các bản ghi liên quan cho từng lớp học
      if (customerClasses && customerClasses.length > 0) {
        for (const cls of customerClasses) {
          await supabase.from("tutor_applications").delete().eq("class_id", cls.id)
          await supabase.from("contracts").delete().eq("class_id", cls.id)
        }

        // Xóa tất cả lớp học của khách hàng
        await supabase.from("classes").delete().eq("customer_id", customerId)
      }

      // Xóa profile của khách hàng
      const { error } = await supabase.from("profiles").delete().eq("id", customerId)

      if (error) throw error

      // Cập nhật state
      setCustomers((prevCustomers) => prevCustomers.filter((customer) => customer.id !== customerId))

      toast({
        title: "Thành công",
        description: "Đã xóa khách hàng và tất cả dữ liệu liên quan thành công.",
      })

      setDeleteConfirmOpen(false)
      setCustomerToDelete(null)
    } catch (error) {
      console.error("Lỗi khi xóa khách hàng:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa khách hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Move fetchCustomers out of useEffect so it can be called anywhere
  const fetchCustomers = async () => {
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

      const { data: customersData, error: customersError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone_number,
          address,
          gender,
          created_at
        `)
        .eq("role", "customer")
        .order("created_at", { ascending: false })

      if (customersError) {
        throw customersError
      }

      // Lấy thông tin lớp học cho mỗi khách hàng
      const customersWithClasses = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: classesData } = await supabase
            .from("classes")
            .select(`
      id,
      name,
      subject,
      level,
      province,
      district,
      address,
      schedule,
      status,
      created_at,
      selected_tutor_id
    `)
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false })

          // Get tutor information separately for matched classes
          const classesWithTutors = await Promise.all(
            (classesData || []).map(async (cls) => {
              if (cls.selected_tutor_id && cls.status === "matched") {
                const { data: tutorData } = await supabase
                  .from("profiles")
                  .select("id, full_name, email, phone_number")
                  .eq("id", cls.selected_tutor_id)
                  .single()

                return {
                  ...cls,
                  selected_tutor: tutorData
                    ? {
                        id: tutorData.id,
                        profiles: {
                          full_name: tutorData.full_name,
                          email: tutorData.email,
                          phone_number: tutorData.phone_number,
                        },
                      }
                    : undefined,
                }
              }
              return {
                ...cls,
                selected_tutor: undefined,
              }
            }),
          )

          return {
            ...customer,
            classes: classesWithTutors,
          }
        }),
      )

      setCustomers(customersWithClasses)
      setFilteredCustomers(customersWithClasses)
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khách hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect chỉ gọi fetchCustomers
  useEffect(() => {
    fetchCustomers()
  }, [supabase, toast])

  // Lấy role của user hiện tại
  useEffect(() => {
    const getUserRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        const userRole = session.user.user_metadata?.role
        setUserRole(userRole)
      }
    }
    getUserRole()
  }, [supabase])

  // Lọc và sắp xếp dữ liệu khi các điều kiện thay đổi
  useEffect(() => {
    // Lọc dữ liệu theo từ khóa tìm kiếm
    const result = customers.filter((customer) => {
      const matchesSearch =
        customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())

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
        aValue = a[sortConfig.key as keyof Customer]
        bValue = b[sortConfig.key as keyof Customer]
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

    setFilteredCustomers(result)
  }, [customers, searchTerm, sortConfig])

  // Hàm validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      errors.full_name = "Họ tên không được để trống"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // handleSubmitForm: gọi await fetchCustomers() trước khi đóng dialog
  const handleSubmitForm = async () => {
    if (!validateForm()) return

    setIsProcessing(true)
    try {
      const updateData: UpdateCustomerData = {
        id: editingCustomer.id,
        full_name: formData.full_name,
        phone_number: formData.phone_number || undefined,
        address: formData.address || undefined,
        gender: formData.gender,
      }

      const result = await updateCustomer(updateData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin khách hàng thành công.",
      })

      setIsFormDialogOpen(false)
      fetchCustomers()
    } catch (error: any) {
      console.error("Lỗi khi cập nhật khách hàng:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin khách hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý khách hàng</h1>
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
                      Tên khách hàng
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1" onClick={() => handleSort("phone_number")}>
                      SĐT
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Địa chỉ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Số lớp</th>
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
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{customer.full_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {customer.phone_number || "Chưa cập nhật"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.address || "Chưa cập nhật"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.classes?.length || 0} lớp</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(customer.created_at).split(",")[0]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDetails(customer)}>
                          Chi tiết
                        </Button>
                        {(userRole === "admin" || userRole === "staff") && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenEditForm(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {userRole === "admin" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCustomerToDelete(customer.id)
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - List */}
          <div className="md:hidden space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{customer.full_name}</h3>
                  <span className="text-sm text-muted-foreground">{customer.classes?.length || 0} lớp</span>
                </div>
                <div className="text-sm text-muted-foreground">SĐT: {customer.phone_number || "Chưa cập nhật"}</div>
                <div className="text-sm text-muted-foreground">Địa chỉ: {customer.address || "Chưa cập nhật"}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày tạo: {formatDate(customer.created_at).split(",")[0]}</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenDetails(customer)}>
                    Chi tiết
                  </Button>
                  {(userRole === "admin" || userRole === "staff") && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenEditForm(customer)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Sửa
                    </Button>
                  )}
                  {userRole === "admin" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        setCustomerToDelete(customer.id)
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa khách hàng
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Không tìm thấy khách hàng nào phù hợp với tiêu chí tìm kiếm.
            </div>
          )}
        </>
      )}

      {/* Dialog chi tiết khách hàng */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
            <DialogDescription>Thông tin chi tiết về khách hàng và các lớp học đã tạo</DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedCustomer.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Giới tính: {getGenderText(selectedCustomer.gender)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                      </div>
                    </div>
                    {selectedCustomer.phone_number && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Số điện thoại</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.phone_number}</p>
                        </div>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Địa chỉ</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Ngày đăng ký</p>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedCustomer.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thống kê lớp học</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Tổng số lớp</p>
                      <p className="text-2xl font-bold">{selectedCustomer.classes?.length || 0}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Lớp đã ghép gia sư</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedCustomer.classes?.filter((cls) => cls.status === "matched").length || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Classes section */}
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách lớp học ({selectedCustomer.classes?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCustomer.classes && selectedCustomer.classes.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.classes.map((cls) => (
                        <div key={cls.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{cls.name}</h4>
                              <p className="text-sm text-muted-foreground">Môn: {cls.subject}</p>
                            </div>
                            <Badge variant={getClassStatusBadgeVariant(cls.status)}>
                              {getClassStatusText(cls.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium">Cấp độ:</span> {cls.level}
                            </div>
                            <div>
                              <span className="font-medium">Lịch học:</span> {cls.schedule}
                            </div>
                            <div>
                              <span className="font-medium">Địa điểm:</span> {cls.province}, {cls.district}
                            </div>
                            <div>
                              <span className="font-medium">Ngày tạo:</span> {formatDate(cls.created_at).split(",")[0]}
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-sm">Địa chỉ chi tiết:</span>
                            <p className="text-sm text-muted-foreground">{cls.address}</p>
                          </div>

                          {/* Hiển thị thông tin gia sư nếu lớp đã được selected */}
                          {cls.status === "matched" && cls.selected_tutor && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                                Thông tin gia sư được chọn:
                              </h5>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="font-medium">Tên:</span> {cls.selected_tutor.profiles.full_name}
                                </div>
                                <div>
                                  <span className="font-medium">Email:</span> {cls.selected_tutor.profiles.email}
                                </div>
                                {cls.selected_tutor.profiles.phone_number && (
                                  <div>
                                    <span className="font-medium">SĐT:</span> {cls.selected_tutor.profiles.phone_number}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">Khách hàng chưa tạo lớp học nào.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog xác nhận xóa */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng này không? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu
              liên quan bao gồm các lớp học, đơn đăng ký và hợp đồng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => customerToDelete && handleDeleteCustomer(customerToDelete)}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog form chỉnh sửa khách hàng */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
            <DialogDescription>Cập nhật thông tin khách hàng</DialogDescription>
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
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
