import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Quên mật khẩu | TutorHub",
  description: "Quên mật khẩu năng nhập vào hệ thống quản lý trung tâm gia sư",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center relative">
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold text-primary">TutorHub</h1>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
