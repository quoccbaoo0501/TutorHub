import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogIn, UserPlus } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 relative text-foreground bg-gradient-to-br from-cyan-300 via-sky-200 to-blue-200 dark:from-gray-900 dark:via-gray-950 dark:to-black transition-colors duration-500">
      
      {/* Lớp phủ mờ tùy chế độ sáng/tối */}
      <div className="absolute inset-0 -z-10 bg-white/30 dark:bg-black/40"></div>

      {/* Nút đổi theme */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Khung chính */}
      <div className="z-10 w-full max-w-2xl p-10 rounded-3xl bg-white/60 dark:bg-white/10 backdrop-blur-xl shadow-2xl border border-white/60 dark:border-white/20 animate-fade-in text-center transition-all duration-500 hover:scale-[1.01]">

        <p className="text-lg sm:text-2xl mb-2 text-gray-700 dark:text-gray-300 italic">
          Nền tảng kết nối gia sư & học viên
        </p>

        <h1 className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-4 drop-shadow-md tracking-tight">
          TutorHub
        </h1>

        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
          Cùng nhau học tập, cùng nhau phát triển.
        </p>

        <div className="flex justify-center gap-6 mt-6 flex-wrap">
          <Button asChild size="lg" className="gap-2 hover:scale-105 transition-all duration-300">
            <Link href="/login">
              <LogIn className="w-5 h-5" /> Đăng nhập
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 hover:scale-105 transition-all duration-300">
            <Link href="/register">
              <UserPlus className="w-5 h-5" /> Đăng ký
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
