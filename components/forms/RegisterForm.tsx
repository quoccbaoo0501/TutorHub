"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterForm() {
  // State cho các trường nhập liệu của người dùng
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")


  // State cho thông tin riêng của gia sư
  const [education, setEducation] = useState("")
  const [experience, setExperience] = useState("")
  const [subjects, setSubjects] = useState("")


  // State cho việc kiểm soát UI
  const [showPassword, setShowPassword] = useState(false) // Bật/tắt hiển thị mật khẩu
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // Bật/tắt hiển thị mật khẩu xác nhận
  const [isLoading, setIsLoading] = useState(false) // Theo dõi trạng thái loading khi submit form
  const [error, setError] = useState<string | null>(null) // Lưu trữ thông báo lỗi đăng ký
  const [userType, setUserType] = useState<"customer" | "tutor">("customer") // Lưu trữ loại người dùng được chọn

  const router = useRouter() // Hook của Next.js để điều hướng

  // Xử lý sự kiện submit form đăng ký người dùng
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault() // Ngăn chặn hành vi mặc định của form (tải lại trang)
    setIsLoading(true) // Đặt trạng thái loading thành true trong quá trình submit
    setError(null)     // Xóa mọi thông báo lỗi trước đó

    // Kiểm tra cơ bản: Mật khẩu và xác nhận mật khẩu phải khớp
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.")
      setIsLoading(false) // Reset trạng thái loading
      return // Dừng thực thi nếu mật khẩu không khớp
    }

    try {
      // TODO: Thay thế bằng logic đăng ký thực tế với backend.
      // Phần này hiện tại mô phỏng một yêu cầu mạng.
      // Nhớ gửi tất cả dữ liệu người dùng liên quan (email, password, userType, fullName, phoneNumber, address)
      // và thông tin gia sư (education, experience, subjects) nếu userType là 'tutor'
      // đến API endpoint của backend để tạo tài khoản.
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Logic giả lập thành công: Ghi log dữ liệu và điều hướng đến dashboard
      // Trong ứng dụng thực tế, điều này sẽ xảy ra sau khi có phản hồi thành công từ backend.
      const registrationData: any = { email, password, userType, fullName, phoneNumber, address };
      if (userType === "tutor") {
        registrationData.education = education;
        registrationData.experience = experience;
        registrationData.subjects = subjects;
      }
      console.log("Đăng ký với:", registrationData)
      router.push("/dashboard") // Điều hướng đến dashboard khi đăng ký thành công
      router.refresh()          // Tải lại server components nếu cần

    } catch (err) {
      // Xử lý bất kỳ lỗi không mong muốn nào trong quá trình đăng ký
      setError("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.")
    } finally {
      // Khối này thực thi bất kể thành công hay thất bại
      setIsLoading(false) // Reset trạng thái loading khi quá trình submit hoàn tất
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Tạo tài khoản</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Lựa chọn loại người dùng: Khách hàng hoặc Gia sư */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            <Button
              type="button"
              variant={userType === "customer" ? "default" : "outline"} // Variant động dựa trên lựa chọn
              onClick={() => setUserType("customer")}
              disabled={isLoading}
            >
              Khách hàng
            </Button>
            <Button
              type="button"
              variant={userType === "tutor" ? "default" : "outline"} // Variant động dựa trên lựa chọn
              onClick={() => setUserType("tutor")}
              disabled={isLoading}
            >
              Gia sư
            </Button>
          </div>

          {/* Trường nhập liệu Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Trường nhập liệu Họ và tên */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Le Quoc Gia Bao"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Trường nhập liệu Số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input
              id="phoneNumber"
              type="tel" // Loại input cho số điện thoại
              placeholder="(028) 372 52002"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              // Thêm validation cụ thể hơn nếu cần (ví dụ: regex cho định dạng điện thoại)
              disabled={isLoading}
            />
          </div>

          {/* Trường nhập liệu Địa chỉ */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              type="text"
              placeholder="Khu phố 6, P.Linh Trung, Tp.Thủ Đức"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              // Thêm validation cụ thể hơn nếu cần
              disabled={isLoading}
            />
          </div>

          {/* Các trường thông tin bổ sung cho Gia sư */} 
          {userType === "tutor" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="education">Học vấn</Label>
                <Input
                  id="education"
                  type="text"
                  placeholder="Cử nhân Khoa học máy tính"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Kinh nghiệm</Label>
                <Input // Có thể đổi thành Textarea nếu cần nhập nhiều hơn
                  id="experience"
                  type="text"
                  placeholder="2 năm dạy Lập trình cấp 3..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjects">Môn dạy </Label>
                <Input
                  id="subjects"
                  type="text"
                  placeholder="Toán, Lý, Hóa"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* Trường nhập liệu Mật khẩu với nút bật/tắt hiển thị */}
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"} // Thay đổi type động để hiển thị/ẩn
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <Button
                type="button" // Quan trọng: type="button" để không submit form
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3" // Định vị nút icon bên trong input
                onClick={() => setShowPassword(!showPassword)} // Bật/tắt state hiển thị mật khẩu
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
              </Button>
            </div>
          </div>

          {/* Trường nhập liệu Xác nhận mật khẩu với nút bật/tắt hiển thị */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"} // Thay đổi type động để hiển thị/ẩn
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <Button
                type="button" // Quan trọng: type="button" để không submit form
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3" // Định vị nút icon bên trong input
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Bật/tắt state hiển thị mật khẩu xác nhận
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
              </Button>
            </div>
          </div>

          {/* Nút Submit với chỉ báo trạng thái loading */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              "Đăng ký"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
