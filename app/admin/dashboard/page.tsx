import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, BookOpen, DollarSign, Users } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Tiêu đề và nút tạo báo cáo */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button>Tạo báo cáo mới</Button>
      </div>

      {/* Các thẻ thống kê tổng quan */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Thẻ thống kê số lớp học */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lớp học</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+12% so với tháng trước</p>
          </CardContent>
        </Card>
        {/* Thẻ thống kê số khách hàng */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số khách hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">256</div>
            <p className="text-xs text-muted-foreground">+8% so với tháng trước</p>
          </CardContent>
        </Card>
        {/* Thẻ thống kê số gia sư */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số gia sư</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64</div>
            <p className="text-xs text-muted-foreground">+4% so với tháng trước</p>
          </CardContent>
        </Card>
        {/* Thẻ thống kê doanh thu */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25.6M VND</div>
            <p className="text-xs text-muted-foreground">+18% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ thống kê */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Biểu đồ doanh thu */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê doanh thu</CardTitle>
            <CardDescription>Doanh thu 6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <BarChart className="h-10 w-10 text-muted-foreground" />
              <span className="text-muted-foreground">Biểu đồ doanh thu sẽ hiển thị ở đây</span>
            </div>
          </CardContent>
        </Card>
        {/* Biểu đồ phân bố lớp học */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê lớp học</CardTitle>
            <CardDescription>Phân bố lớp học theo môn học</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <BarChart className="h-10 w-10 text-muted-foreground" />
              <span className="text-muted-foreground">Biểu đồ phân bố lớp học sẽ hiển thị ở đây</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danh sách hoạt động gần đây */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>Các hoạt động mới nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Danh sách các hoạt động gần đây */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center">
                  <span className="font-medium">{i}</span>
                </div>
                <div>
                  <p className="font-medium">
                    {
                      [
                        "Lớp học mới được tạo",
                        "Khách hàng mới đăng ký",
                        "Hợp đồng mới được ký kết",
                        "Thanh toán mới",
                        "Gia sư mới tham gia",
                      ][i - 1]
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(Date.now() - i * 3600000).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
