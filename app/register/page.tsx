import type { Metadata } from "next"
import RegisterForm from "@/components/forms/register-form"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Đăng ký | Trung tâm Gia sư",
  description: "Đăng ký vào hệ thống quản lý trung tâm gia sư",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <RegisterForm />
    </div>
  )
}

