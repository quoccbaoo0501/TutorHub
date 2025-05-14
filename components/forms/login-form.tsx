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
import { supabase } from "@/lib/supabase/supabase";

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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault() // Ngăn chặn hành vi mặc định của form (tải lại trang)
    setIsLoading(true) // Bắt đầu trạng thái loading
    setError(null)     // Xóa lỗi cũ (nếu có)

    try { 
      // Gọi API Supabase để đăng nhập người dùng với email và mật khẩu
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      // Xử lý kết quả từ Supabase
      if (error) {
        // Nếu có lỗi từ Supabase Auth, hiển thị lỗi
        setError(error.message);
        console.error("Login error:", error);
      } else if (data.user) {
        // Nếu đăng nhập thành công
        console.log("User logged in:", data.user);
        // Chuyển hướng người dùng đến trang dashboard hoặc trang khác sau khi đăng nhập thành công
        router.push("/dashboard");
        router.refresh(); // Tải lại dữ liệu nếu cần cho Server Components
      } else {
        // Trường hợp hiếm xảy ra: không có lỗi nhưng data.user cũng null
        setError("Đã xảy ra lỗi không mong muốn trong quá trình đăng nhập.");
      }

    } catch (err: any) {
      // Xử lý các lỗi không mong muốn khác trong quá trình thực thi (ví dụ: lỗi mạng)
      setError(err.message);
      console.error("Unexpected error:", err);
    } finally {
      // Luôn kết thúc trạng thái loading dù thành công hay thất bại
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Hiển thị thông báo lỗi nếu có */} 
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
              <Link href="/reset-password" className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </Link>
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
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-5 pt-2">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 488 512" className="mr-2">
              <path
                fill="#4285F4"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            Google
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Facebook className="h-4 w-4 mr-2" fill="#1877F2" color="white" />
            Facebook
          </Button>
        </div>

        <div className="text-center text-sm">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
