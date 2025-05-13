"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // TODO: Implement actual password reset logic (e.g., API call)
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

      // For demonstration, assume success if email is provided
      if (email) {
        setSuccessMessage("Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được một liên kết đặt lại mật khẩu.")
        // Optionally, redirect or clear form
        // setEmail("") 
      } else {
        setError("Vui lòng nhập địa chỉ email của bạn.")
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
        <CardDescription>
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="default"> {/* Changed to default variant for success */}
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          {!successMessage && ( // Only show email input if success message is not shown
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}
          {!successMessage && (
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
          )}
        </form>
      </CardContent>
      <CardFooter className="text-center">
        <Link href="/login" className="text-sm text-primary hover:underline w-full">
          Quay lại Đăng nhập
        </Link>
      </CardFooter>
    </Card>
  )
} 