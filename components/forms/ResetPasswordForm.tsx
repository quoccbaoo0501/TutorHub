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

export default function ResetPasswordForm() {
  // State để lưu trữ email người dùng nhập vào
  const [email, setEmail] = useState("")

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
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Quên mật khẩu</CardTitle>
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {/* Hiển thị spinner và text khác nhau tùy theo trạng thái loading */} 
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi..
              </>
            ) : (
              "Lấy lại mật khẩu"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm">
          Trở về trang đăng nhập?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>
        </div>        
      </CardFooter>
    </Card>
  )
}
