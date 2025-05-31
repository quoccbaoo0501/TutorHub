// Thêm comments bằng tiếng Việt

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Các đường dẫn công khai không yêu cầu xác thực
const publicRoutes = ["/", "/login", "/register", "/reset-password", "/update-password", "/auth/callback"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const url = req.nextUrl.clone()
  const { pathname } = req.nextUrl

  // Bỏ qua các tài nguyên tĩnh và API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes("favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.includes(".png") ||
    pathname.includes(".jpg") ||
    pathname.includes(".svg") ||
    pathname.includes(".ico")
  ) {
    return res
  }

  try {
    // Tạo client Supabase cho middleware
    const supabase = createMiddlewareClient({ req, res })

    // Lấy thông tin phiên đăng nhập hiện tại với error handling
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Handle session errors
    if (sessionError) {
      console.error("Middleware session error:", sessionError)
      // If there's a session error and we're not on a public route, redirect to login
      if (!publicRoutes.includes(pathname)) {
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }
      return res
    }

    // Nếu không có phiên đăng nhập và đang truy cập đường dẫn được bảo vệ
    if (!session) {
      // Cho phép truy cập các đường dẫn công khai
      if (publicRoutes.includes(pathname)) {
        return res
      }

      // Chuyển hướng đến trang đăng nhập nếu truy cập đường dẫn được bảo vệ
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    // Nếu có phiên đăng nhập
    if (session) {
      // Lấy vai trò từ metadata của người dùng
      const userRole = session.user.user_metadata?.role || "customer"

      console.log("User role:", userRole, "Pathname:", pathname)

      // Nếu đang truy cập trang công khai (như login), chuyển hướng đến dashboard phù hợp
      if (publicRoutes.includes(pathname)) {
        if (userRole === "admin" || userRole === "staff") {
          url.pathname = "/admin/dashboard"
          return NextResponse.redirect(url)
        } else {
          url.pathname = "/user/dashboard"
          return NextResponse.redirect(url)
        }
      }

      // Kiểm tra quyền truy cập dựa trên vai trò
      const isAdmin = userRole === "admin" || userRole === "staff"
      const isAccessingAdminRoute = pathname.startsWith("/admin")
      const isAccessingUserRoute = pathname.startsWith("/user")

      // Nếu là admin/staff nhưng đang truy cập route của user
      if (isAdmin && isAccessingUserRoute) {
        url.pathname = "/admin/dashboard"
        return NextResponse.redirect(url)
      }

      // Nếu là user thường nhưng đang truy cập route của admin
      if (!isAdmin && isAccessingAdminRoute) {
        url.pathname = "/user/dashboard"
        return NextResponse.redirect(url)
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)

    // Trong trường hợp lỗi, chuyển hướng đến trang đăng nhập
    if (!publicRoutes.includes(pathname)) {
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    return res
  }
}

// Cấu hình matcher cho middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
