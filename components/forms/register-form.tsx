"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Textarea } from "../ui/textarea"

// Khởi tạo Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [userType, setUserType] = useState<"customer" | "tutor">("customer")

  const router = useRouter()

  // Xử lý sự kiện submit form đăng ký người dùng
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Để chắc chắn rằng không bị chỉnh sửa role trong dev tools
    if (!["customer", "tutor"].includes(userType)) {
      setError("Vai trò không hợp lệ.")
      setIsLoading(false)
      return
    }

    // Kiểm tra cơ bản: Mật khẩu và xác nhận mật khẩu phải khớp
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.")
      setIsLoading(false)
      return
    }

    try {
      // Chuẩn bị dữ liệu metadata cho người dùng
      interface UserData {
        role: "customer" | "tutor"
        full_name: string
        phone_number: string
        address: string
      }

      const userData: UserData = {
        role: userType,
        full_name: fullName,
        phone_number: phoneNumber,
        address: address,
      }

      // Gọi API Supabase để đăng ký người dùng mới với email và mật khẩu
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Lỗi đăng ký:", error)
        setError(error.message)
        return
      }

      if (data.user) {
        console.log("Đăng ký thành công:", data.user.id)

        // Tạo hồ sơ người dùng cơ bản trong bảng profiles
        const profileData = {
          id: data.user.id,
          email: email,
          full_name: fullName,
          phone_number: phoneNumber,
          address: address,
          role: userType,
        }

        // Thêm hồ sơ vào bảng profiles
        const { error: profileError } = await supabase.from("profiles").upsert(profileData, { onConflict: "id" })

        if (profileError) {
          console.error("Lỗi tạo hồ sơ:", profileError)
          // Vẫn tiếp tục hiển thị thành công ngay cả khi có lỗi tạo hồ sơ
        }

        // Thêm dữ liệu vào bảng customers hoặc tutors tùy theo vai trò
        if (userType === "customer") {
          const { error: customerError } = await supabase.from("customers").insert({
            id: data.user.id,
          })

          if (customerError) {
            console.error("Lỗi tạo hồ sơ khách hàng:", customerError)
          }
        } else if (userType === "tutor") {
          // Thêm thông tin gia sư vào bảng tutors, bao gồm các trường đã chuyển từ profiles
          const { error: tutorError } = await supabase.from("tutors").insert({
            id: data.user.id,
            education: education,
            experience: experience,
            subjects: subjects,
            certificate_approve: false,
          })

          if (tutorError) {
            console.error("Lỗi tạo hồ sơ gia sư:", tutorError)
          }
        }

        // Hiển thị thông báo thành công và hướng dẫn xác nhận email
        setSuccess(true)
      } else {
        setError("Không thể tạo tài khoản. Vui lòng thử lại sau.")
      }
    } catch (err: any) {
      console.error("Lỗi không mong muốn:", err)
      setError(err.message || "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  // Nếu đăng ký thành công, hiển thị thông báo
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Đăng ký thành công!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Chúng tôi đã gửi email xác nhận đến địa chỉ {email}. Vui lòng kiểm tra hộp thư của bạn và nhấp vào liên
              kết xác nhận để hoàn tất quá trình đăng ký.
            </AlertDescription>
          </Alert>
          <p className="text-center text-muted-foreground">
            Nếu bạn không nhận được email trong vòng vài phút, vui lòng kiểm tra thư mục spam hoặc thử đăng ký lại.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => router.push("/login")}>Đến trang đăng nhập</Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "https://mail.google.com")}
              className="ml-2"
            >
              Mở Gmail
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Tạo tài khoản</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Hiển thị thông báo lỗi nếu có */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Lựa chọn loại người dùng: Khách hàng hoặc Gia sư */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            <Button
              type="button"
              variant={userType === "customer" ? "default" : "outline"}
              onClick={() => setUserType("customer")}
              disabled={isLoading}
            >
              Khách hàng
            </Button>
            <Button
              type="button"
              variant={userType === "tutor" ? "default" : "outline"}
              onClick={() => setUserType("tutor")}
              disabled={isLoading}
            >
              Gia sư
            </Button>
          </div>

          {/* Trường nhập email */}
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

          {/* Trường nhập họ và tên */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Kevin Baoo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Trường nhập số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="(028) 372 52002"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Trường nhập địa chỉ */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              type="text"
              placeholder="Khu phố 6, P.Linh Trung, Tp.Thủ Đức"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Các trường thông tin bổ sung cho gia sư */}
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
                <Textarea
                  id="experience"
                  placeholder="10 điểm đồ án SE104..."
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

          {/* Trường nhập mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
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

          {/* Trường xác nhận mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
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

          {/* Nút đăng ký */}
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
