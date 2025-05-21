"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  // Các state cho form đăng nhập
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  // Lấy các tham số từ URL
  const redirectUrl = searchParams.get("redirect_url") || ""
  const registered = searchParams.get("registered") === "true"

  // Khởi tạo Supabase client
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Hiển thị thông báo đăng ký thành công nếu có
  useEffect(() => {
    if (registered) {
      setSuccessMessage(
        "Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác nhận tài khoản trước khi đăng nhập.",
      )
    }
  }, [registered])

  // Kiểm tra phiên đăng nhập hiện tại khi component được tải
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        const userRole = data.session.user.user_metadata?.role
        console.log("Vai trò người dùng hiện tại:", userRole)

        // Chuyển hướng dựa trên vai trò
        if (userRole === "admin" || userRole === "staff") {
          router.push("/admin/dashboard")
        } else {
          router.push("/user/dashboard")
        }
      }
    }

    checkSession()
  }, [router, supabase])

  // Hàm để đồng bộ hóa metadata với vai trò trong profiles
  const syncUserMetadata = async (userId: string) => {
    try {
      // Lấy thông tin vai trò từ bảng profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Lỗi khi lấy thông tin profile:", profileError)
        return null
      }

      if (!profileData) {
        console.error("Không tìm thấy profile cho user:", userId)
        return null
      }

      // Cập nhật metadata của người dùng với vai trò từ profiles
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: profileData.role },
      })

      if (updateError) {
        console.error("Lỗi khi cập nhật metadata:", updateError)
        return null
      }

      console.log("Đã đồng bộ metadata với vai trò:", profileData.role)
      return profileData.role
    } catch (error) {
      console.error("Lỗi không mong muốn khi đồng bộ metadata:", error)
      return null
    }
  }

  // Xử lý đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      // Đăng nhập với email và mật khẩu
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Hiển thị lỗi cụ thể
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.")
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage(
            "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn và xác nhận email trước khi đăng nhập.",
          )
        } else {
          setErrorMessage(error.message)
        }
        console.error("Lỗi đăng nhập:", error)
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setErrorMessage("Không thể đăng nhập. Vui lòng thử lại sau.")
        setIsLoading(false)
        return
      }

      // Đồng bộ hóa metadata với vai trò trong profiles
      const userRole = await syncUserMetadata(data.user.id)

      // Nếu không thể đồng bộ, sử dụng vai trò từ metadata hiện tại
      const effectiveRole = userRole || data.user?.user_metadata?.role || "customer"

      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      })

      console.log("Vai trò người dùng sau khi đăng nhập:", effectiveRole)

      // Chuyển hướng dựa trên vai trò
      if (effectiveRole === "admin" || effectiveRole === "staff") {
        router.push("/admin/dashboard")
      } else if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        router.push("/user/dashboard")
      }
    } catch (error: any) {
      setErrorMessage("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.")
      console.error("Lỗi không mong muốn:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Đăng nhập</h1>
        <p className="text-muted-foreground">Nhập thông tin đăng nhập của bạn để tiếp tục</p>
      </div>

      {/* Hiển thị thông báo thành công nếu có */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Hiển thị thông báo lỗi nếu có */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Trường nhập email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {/* Trường nhập mật khẩu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => router.push("/reset-password")}
              type="button"
            >
              Quên mật khẩu?
            </Button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {/* Nút hiển thị/ẩn mật khẩu */}
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
        {/* Nút đăng nhập */}
        <Button type="submit" className="w-full" disabled={isLoading}>
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
      {/* Liên kết đến trang đăng ký */}
      <div className="text-center text-sm">
        Chưa có tài khoản?{" "}
        <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/register")}>
          Đăng ký
        </Button>
      </div>
    </div>
  )
}
