// Provider cho việc quản lý theme sáng/tối
// Cung cấp context cho toàn bộ ứng dụng để quản lý theme
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

// Component ThemeProvider bọc toàn bộ ứng dụng
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    // Sử dụng NextThemesProvider từ thư viện next-themes
    // attribute="class": Sử dụng class CSS để áp dụng theme
    // defaultTheme="light": Theme mặc định là sáng
    // enableSystem={false}: Không sử dụng theme hệ thống
    // disableTransitionOnChange: Tắt hiệu ứng chuyển đổi để tránh nhấp nháy
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
