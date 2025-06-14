import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogIn, UserPlus, BookOpen, Users, Star, ArrowRight } from "lucide-react"

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
      <div className="z-10 w-full max-w-4xl p-10 rounded-3xl bg-white/60 dark:bg-white/10 backdrop-blur-xl shadow-2xl border border-white/60 dark:border-white/20 animate-fade-in text-center transition-all duration-500 hover:scale-[1.01]">

        <p className="text-lg sm:text-2xl mb-2 text-gray-700 dark:text-gray-300 italic animate-fade-in-up">
          Nền tảng kết nối gia sư & học viên
        </p>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-4 drop-shadow-md tracking-tight animate-fade-in-up animation-delay-200">
          TutorHub
        </h1>

        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8 animate-fade-in-up animation-delay-300">
          Cùng nhau học tập, cùng nhau phát triển.
        </p>

        {/* Các tính năng nổi bật */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 animate-fade-in-up animation-delay-400">
          <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group">
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Khóa học đa dạng</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Nhiều môn học, nhiều cấp độ</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group">
            <Users className="w-8 h-8 mx-auto mb-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Gia sư chất lượng</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Đội ngũ gia sư chuyên nghiệp</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group">
            <Star className="w-8 h-8 mx-auto mb-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Học tập hiệu quả</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Phương pháp học tập tối ưu</p>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-6 flex-wrap animate-fade-in-up animation-delay-500">
          <Button asChild size="lg" className="gap-2 hover:scale-105 transition-all duration-300 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/login">
              <LogIn className="w-5 h-5" /> Đăng nhập
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 hover:scale-105 transition-all duration-300 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950">
            <Link href="/register">
              <UserPlus className="w-5 h-5" /> Đăng ký
            </Link>
          </Button>
        </div>

        {/* Nút tìm hiểu thêm */}
        <div className="mt-8 animate-fade-in-up animation-delay-600">
          <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group">
            Tìm hiểu thêm
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </main>
  )
}
