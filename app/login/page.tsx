import Image from "next/image"
import type { Metadata } from "next"
import { LoginForm } from "@/components/forms/LoginForm"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Đăng nhập | Trung tâm Gia sư",
  description: "Đăng nhập vào hệ thống quản lý trung tâm gia sư",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">TutorHub</h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
