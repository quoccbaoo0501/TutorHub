"use client"
import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ThemeToggle } from "@/components/theme-toggle"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ClientLayoutProps {
  children: React.ReactNode
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const router = useRouter()
  // Khởi tạo Supabase client cho phía client
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Hàm làm mới trang hiện tại
  const handleRefresh = () => {
    // Sử dụng router.refresh() để reload page hiện tại
    router.refresh()
  }

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      // Đồng bộ metadata của người dùng trước khi đăng xuất
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await syncUserMetadata(user.id)
      }

      // Tiến hành đăng xuất
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Lỗi trong quá trình đăng xuất:", error)
      router.push("/login")
    }
  }

  // Hàm đồng bộ metadata của người dùng với dữ liệu từ bảng profiles
  const syncUserMetadata = async (userId: string) => {
    try {
      // Lấy thông tin vai trò từ bảng profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Lỗi khi lấy thông tin profile:", profileError)
        return null
      }

      if (!profileData) {
        console.error("Không tìm thấy profile cho user:", userId)
        return null
      }

      // Cập nhật metadata của người dùng với vai trò từ profiles
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: profileData.role },
      })

      if (updateError) {
        console.error("Lỗi khi cập nhật metadata:", updateError)
        return null
      }

      console.log("Đã đồng bộ metadata với vai trò:", profileData.role)
      return profileData.role
    } catch (error) {
      console.error("Lỗi không mong muốn khi đồng bộ metadata:", error)
      return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Thanh điều hướng phía trên cho giao diện người dùng */}
      <header className="bg-background border-b border-border shadow-sm">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <button onClick={handleRefresh} className="text-xl font-bold hover:text-primary transition-colors">
              TutorHub
            </button>
          </div>
          <div className="flex space-x-4 items-center">
            <Link href="/user/dashboard" className="px-3 py-2 rounded hover:bg-muted cursor-pointer">
              Dashboard
            </Link>
            <Link href="/user/class" className="px-3 py-2 rounded hover:bg-muted cursor-pointer">
              Classes
            </Link>
            <Link href="/user/contract" className="px-3 py-2 rounded hover:bg-muted cursor-pointer">
              Contracts
            </Link>
            <Link href="/user/payment" className="px-3 py-2 rounded hover:bg-muted cursor-pointer">
              Payment
            </Link>
            <ThemeToggle />

            {/* Menu dropdown cho hồ sơ người dùng */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/user/profile">Hồ sơ</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>

      {/* Nội dung chính của trang */}
      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      {/* Phần chân trang */}
      <footer className="bg-muted text-muted-foreground text-center text-sm py-4 mt-auto">
        © {new Date().getFullYear()} SE104
      </footer>
    </div>
  )
}

export default ClientLayout
