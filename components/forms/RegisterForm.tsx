"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Facebook } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  // State để lưu trữ email người dùng nhập vào
  const [email, setEmail] = useState("")
  // State để lưu trữ mật khẩu người dùng nhập vào
  const [password, setPassword] = useState("")
  // State để kiểm soát việc hiển thị/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false)
  // State để theo dõi trạng thái loading của form (ví dụ: khi đang gửi request)
  const [isLoading, setIsLoading] = useState(false)
  // State để lưu trữ thông báo lỗi (nếu có)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter() // Hook để điều hướng giữa các trang

  // Hàm xử lý khi người dùng submit form đăng nhập
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault() // Ngăn chặn hành vi mặc định của form (tải lại trang)
    setIsLoading(true) // Bắt đầu trạng thái loading
    setError(null)     // Xóa lỗi cũ (nếu có)

    try {
      // TODO: Thay thế bằng logic xác thực thực tế với backend
      // Đoạn code này chỉ mô phỏng việc chờ đợi server phản hồi
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Ví dụ kiểm tra thông tin đăng nhập (logic này nên ở backend)
      if (email === "admin@example.com" && password === "password") {
        router.push("/dashboard") // Điều hướng đến trang dashboard nếu thành công
        router.refresh()          // Tải lại dữ liệu trên trang mới (nếu cần thiết cho Server Components)
      } else {
        setError("Email hoặc mật khẩu không chính xác.")
      }
    } catch (err) {
      // Xử lý các lỗi không mong muốn từ quá trình xác thực
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.")
    } finally {
      // Dù thành công hay thất bại, kết thúc trạng thái loading
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Đăng ký</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading} // Vô hiệu hóa input khi đang loading
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
            </div>
            <div className="relative"> {/* Container cho input mật khẩu và nút hiển thị/ẩn */} 
              <Input
                id="password"
                type={showPassword ? "text" : "password"} // Thay đổi type để hiển thị/ẩn mật khẩu
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              {/* Nút để chuyển đổi hiển thị mật khẩu */} 
              <Button
                type="button" // Quan trọng: type="button" để không submit form
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3" // Định vị nút ở cuối input
                onClick={() => setShowPassword(!showPassword)} // Chuyển đổi state showPassword
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {/* Hiển thị spinner và text khác nhau tùy theo trạng thái loading */} 
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              "Đăng ký tài khoản mới"
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
