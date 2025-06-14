import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, BookOpen, DollarSign, Users } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-cyan-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-950 dark:to-black transition-colors duration-500 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-extrabold text-cyan-800 dark:text-cyan-300 drop-shadow">Admin Dashboard</h1>
        <Button className="bg-cyan-600 text-white hover:bg-cyan-700 transition">Tạo báo cáo mới</Button>
      </div>
  
      {/* Thống kê nhanh */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { title: "Tổng số lớp học", value: "128", percent: "+12%", icon: BookOpen },
          { title: "Tổng số khách hàng", value: "256", percent: "+8%", icon: Users },
          { title: "Tổng số gia sư", value: "64", percent: "+4%", icon: Users },
          { title: "Doanh thu tháng", value: "25.6M VND", percent: "+18%", icon: DollarSign },
        ].map((item, index) => (
          <Card
            key={index}
            className="hover:scale-[1.03] hover:shadow-xl transition-transform duration-300 ease-in-out cursor-pointer"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-800 dark:text-cyan-300">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.percent} so với tháng trước</p>
            </CardContent>
          </Card>
        ))}
      </div>
  
      {/* Biểu đồ */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Thống kê doanh thu</CardTitle>
            <CardDescription>Doanh thu 6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center text-cyan-700 dark:text-cyan-300">
            <div className="flex items-center space-x-2">
              <BarChart className="h-10 w-10 animate-pulse" />
              <span>Biểu đồ doanh thu sẽ hiển thị ở đây</span>
            </div>
          </CardContent>
        </Card>
  
        <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Thống kê lớp học</CardTitle>
            <CardDescription>Phân bố lớp học theo môn học</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center text-cyan-700 dark:text-cyan-300">
            <div className="flex items-center space-x-2">
              <BarChart className="h-10 w-10 animate-pulse" />
              <span>Biểu đồ phân bố lớp học sẽ hiển thị ở đây</span>
            </div>
          </CardContent>
        </Card>
      </div>
  
      {/* Hoạt động gần đây */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>Các hoạt động mới nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-start border-b pb-4 last:border-0 last:pb-0 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-md p-2 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-200 dark:bg-cyan-800 text-white flex items-center justify-center font-bold mr-3 shadow-inner">
                  {i}
                </div>
                <div>
                  <p className="font-medium text-cyan-800 dark:text-cyan-300">
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
  );
}
