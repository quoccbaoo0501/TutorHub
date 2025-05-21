"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  const router = useRouter()

  // Hiển thị lỗi nếu token không hợp lệ
  useEffect(() => {
    if (errorParam === "invalid_token") {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.")
    }
  }, [errorParam])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Tạo client Supabase mới
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })

      // Gửi yêu cầu đặt lại mật khẩu cho email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // URL sẽ chuyển hướng sau khi đặt lại mật khẩu thành công
        redirectTo: `${window.location.origin}/update-password`,
      })

      // Xử lý kết quả
      if (error) {
        setError(error.message)
        console.error("Password reset error:", error)
      } else {
        // Nếu thành công, hiển thị thông báo thành công
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message)
      console.error("Unexpected error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Quên mật khẩu</CardTitle>
        <CardDescription className="text-center">Nhập email của bạn để nhận liên kết đặt lại mật khẩu</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Liên kết đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi liên kết đặt lại"
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center flex-col space-y-2">
        <Link href="/login" className="text-primary hover:underline text-sm">
          Quay lại đăng nhập
        </Link>
        {success && (
          <Link
            href="https://mail.google.com/mail/u/0/#inbox"
            className="text-primary hover:underline text-sm"
            target="_blank"
          >
            Vào hòm thư Email của bạn
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
