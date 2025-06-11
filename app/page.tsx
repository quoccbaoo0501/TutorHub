import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground relative">

      <div className="absolute inset-0 bg-[url('/Background_login.jpg')] bg-cover bg-center opacity-30 -z-10 blur-sm"></div>


      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Khung nội dung chính */}
      <div className="z-10 w-full max-w-2xl p-10 rounded-2xl bg-white/30 dark:bg-white/10 backdrop-blur-md shadow-xl text-center animate-fade-in border border-white/60 dark:border-white/20">
        
        <p className="text-2xl mb-4 text-gray-700 dark:text-gray-200">
          Nền tảng kết nối gia sư & học viên
        </p>

        <h1 className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-8">
          TutorHub
        </h1>

        <div className="flex justify-center gap-6 mt-6">
          <Button asChild size="lg">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
