import type { Metadata } from "next"
import LoginForm from "@/components/forms/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Đăng nhập | TutorHub",
  description: "Đăng nhập vào hệ thống quản lý trung tâm gia sư",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  )
}
