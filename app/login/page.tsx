"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import LoginForm from "@/components/forms/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Kiểm tra xem có phải là yêu cầu đặt lại mật khẩu không
  useEffect(() => {
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    if (token_hash && type === "recovery") {
      console.log("Recovery token detected, redirecting to auth/confirm")
      // Chuyển hướng đến endpoint xác thực với các tham số
      const next = searchParams.get("next") || "/update-password"
      router.push(`/auth/confirm?token_hash=${token_hash}&type=${type}&next=${next}`)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  )
}
