"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, Calendar, User, Phone, MapPin, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

  // Tải dữ liệu khách hàng từ Supabase
  useEffect(() => {
    async function fetchCustomers() {
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
                selected_tutor_id,
                tutors:selected_tutor_id (
                  id,
                  profiles (
                    full_name,
                    email,
                    phone_number
                  )
                )
              `)
              .eq("customer_id", customer.id)
              .order("created_at", { ascending: false })

            return {
              ...customer,
              classes:
                classesData?.map((cls) => ({
                  ...cls,
                  selected_tutor: cls.tutors,
                })) || [],
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

    fetchCustomers()
  }, [supabase, toast])

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
                      <Button size="sm" variant="outline" onClick={() => handleOpenDetails(customer)}>
                        Chi tiết
                      </Button>
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
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenDetails(customer)}>
                  Chi tiết
                </Button>
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
    </div>
  )
}
