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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidLink, setIsValidLink] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const router = useRouter()
  //Kiểm tra user với session có hợp lệ hay không
  useEffect(() => {
    const checkSession = async () => {
      // Tạo client Supabase mới
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })

      // Lấy thông tin phiên đăng nhập từ Supabase
      const { data, error } = await supabase.auth.getSession()

      console.log(error, data.session)

      // Nếu không có session hoặc người dùng truy cập mà không qua luồng khôi phục
      if (error || !data.session) {
        setIsValidLink(false)
        setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.")
      } else {
        // Lấy thông tin người dùng từ phiên
        const { data: userData } = await supabase.auth.getUser()
        if (userData && userData.user) {
          if (userData.user.email) {
            setUserEmail(userData.user.email)
          } else {
            setUserEmail(null)
          }
        }
      }
    }

    checkSession()
  }, [])

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
      // Tạo client Supabase mới
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })

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

  // Nếu liên kết không hợp lệ, hiển thị thông báo lỗi
  if (!isValidLink) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Liên kết không hợp lệ</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.
            </AlertDescription>
          </Alert>
          {/* Nút để yêu cầu liên kết mới */}
          <Button className="w-full mt-4" onClick={() => router.push("/reset-password")}>
            Yêu cầu liên kết mới
          </Button>
        </CardContent>
      </Card>
    )
  }

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
