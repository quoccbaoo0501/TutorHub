import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Chào mừng đến với TutorHub</h1>
        <p className="text-xl text-center mb-8">Nền tảng kết nối giáo viên và học sinh hiệu quả</p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
