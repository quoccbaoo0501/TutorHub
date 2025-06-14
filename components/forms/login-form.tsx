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
import { ThemeToggle } from "@/components/theme-toggle"

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
     
  const quotes = [
    "Học, Học nữa, Học mãi",
    "Tri thức là sức mạnh",
    "Vươn tới đỉnh cao",
    "Hiền tài là nguyên khí quốc gia",
    "Học tập vì đất nước"
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentQuote = quotes[quoteIndex];
    if (charIndex < currentQuote.length) {
      const typingTimeout = setTimeout(() => {
        setDisplayText(currentQuote.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 100);
      return () => clearTimeout(typingTimeout);
    } else {
      const holdTimeout = setTimeout(() => {
        setCharIndex(0);
        setDisplayText('');
        setQuoteIndex((quoteIndex + 1) % quotes.length);
      }, 2000);
      return () => clearTimeout(holdTimeout);
    }
  }, [charIndex, quoteIndex, quotes]);

  
  return (
    <div className="fixed inset-0 flex">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex flex-col justify-center items-center bg-yellow-50 text-orange-600 relative px-8">
        <div className="absolute top-6 left-6 text-2xl font-bold text-orange-500">
          TutorHub
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold font-mono whitespace-nowrap min-h-[3rem]">
            {displayText}
            <span className="animate-ping inline-block w-2 h-2 ml-1 bg-orange-500 rounded-full"></span>
          </h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#7de3eb] dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border border-cyan-500 dark:border-cyan-300 shadow-2xl rounded-2xl px-6 py-6 w-full max-w-sm text-center space-y-4 transition-colors duration-300 max-h-[90vh] overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đăng nhập</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Nhập thông tin đăng nhập của bạn để tiếp tục
          </p>

          {successMessage && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700 text-sm">
              <AlertDescription className="text-green-800 dark:text-green-100">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          {errorMessage && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-200 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-200 text-sm">Mật khẩu</Label>
                <button
                  type="button"
                  className="text-xs text-sky-600 hover:underline"
                  onClick={() => router.push("/reset-password")}
                >
                  Quên mật khẩu?
                </button>
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
                  className="dark:bg-gray-700 dark:text-white pr-10 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-gray-500 dark:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-sm"
              disabled={isLoading}
            >
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

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Chưa có tài khoản?{" "}
            <Button
              variant="link"
              className="text-sky-600 p-0 h-auto text-sm"
              onClick={() => router.push("/register")}
            >
              Đăng ký
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
