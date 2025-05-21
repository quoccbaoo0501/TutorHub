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
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  const handleRefresh = () => {
    // Sử dụng router.refresh() để reload page hiện tại
    router.refresh()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top bar cho client UI*/}
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

            {/* Profile dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/user/profiles">Hồ sơ</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-muted text-muted-foreground text-center text-sm py-4 mt-auto">
        © {new Date().getFullYear()} SE104
      </footer>
    </div>
  )
}

export default ClientLayout
