"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function UpdatePasswordForm() {
  // State để lưu trữ thông tin
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking session...")

        // Lấy thông tin phiên hiện tại
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          throw sessionError
        }

        if (!session) {
          console.log("No session found")
          setError("Không tìm thấy phiên đăng nhập. Vui lòng yêu cầu liên kết đặt lại mật khẩu mới.")
          return
        }

        console.log("Session found, user:", session.user.email)

        // Lấy thông tin người dùng
        setUserEmail(session.user.email || null)
      } catch (err) {
        console.error("Error checking session:", err)
        setError("Không thể xác thực phiên làm việc. Vui lòng yêu cầu liên kết đặt lại mật khẩu mới.")
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  // Hàm handle form update pass dành cho user
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      // Xử lý kết quả
      if (error) {
        setError(error.message)
        console.error("Password update error:", error)
      } else {
        // Nếu thành công, hiển thị thông báo và chuyển hướng đến trang đăng nhập sau 3 giây
        setSuccess(true)

        // Đăng xuất để liên kết không thể được sử dụng lại từ lịch sử trình duyệt
        await supabase.auth.signOut()

        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message)
      console.error("Unexpected error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Hiển thị trạng thái đang kiểm tra
  if (checking) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đang xác thực</CardTitle>
          <CardDescription className="text-center">
            Vui lòng đợi trong khi chúng tôi xác thực phiên làm việc...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // Nếu có lỗi và chưa thành công
  if (error && !success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Lỗi xác thực</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => router.push("/reset-password")}>
            Yêu cầu liên kết mới
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
            Quay lại đăng nhập
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Form đặt lại mật khẩu khi đã có session
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Đặt lại mật khẩu</CardTitle>
        <CardDescription className="text-center">
          {userEmail ? `Đặt mật khẩu mới cho tài khoản ${userEmail}` : "Nhập mật khẩu mới của bạn"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Mật khẩu đã được cập nhật thành công! Bạn sẽ được chuyển hướng đến trang đăng nhập...
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật mật khẩu"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
