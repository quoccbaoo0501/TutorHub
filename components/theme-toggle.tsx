// Component nút chuyển đổi theme sáng/tối
// Cho phép người dùng chuyển đổi giữa chế độ sáng và tối
"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  // Sử dụng hook useTheme từ next-themes để quản lý theme
  const { theme, setTheme } = useTheme()

  // Hàm chuyển đổi theme
  const toggleTheme = () => {
    // Nếu theme hiện tại là dark, chuyển sang light và ngược lại
    setTheme(theme === "dark" ? "light" : "dark")
    console.log("Theme đã chuyển sang:", theme === "dark" ? "light" : "dark")
  }

  return (
    // Nút chuyển đổi theme với biểu tượng mặt trời/mặt trăng
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {/* Biểu tượng mặt trời - hiển thị khi ở chế độ sáng */}
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      {/* Biểu tượng mặt trăng - hiển thị khi ở chế độ tối */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {/* Văn bản cho trình đọc màn hình */}
      <span className="sr-only">Chuyển đổi theme</span>
    </Button>
  )
}
