import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Hàm này được sử dụng trong middleware để cập nhật phiên làm việc của Supabase
export async function updateSession(request: NextRequest) {
  // Tạo một đối tượng NextResponse để tiếp tục xử lý request
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Tạo client Supabase phía server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Cấu hình cách Supabase client đọc cookie từ request
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Cấu hình cách Supabase client ghi cookie vào response
        set(name: string, value: string, options: CookieOptions) {
          // Ghi cookie vào request để các middleware hoặc route handler sau có thể đọc ngay
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Tạo lại NextResponse để cập nhật cookie trong response
          supabaseResponse = NextResponse.next({
            request,
          })
          // Ghi cookie vào response để gửi về trình duyệt
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        // Cấu hình cách Supabase client xóa cookie
        remove(name: string, options: CookieOptions) {
           // Xóa cookie trong request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Tạo lại NextResponse để cập nhật cookie trong response
          supabaseResponse = NextResponse.next({
            request,
          })
           // Xóa cookie trong response để gửi về trình duyệt
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Lấy thông tin người dùng hiện tại từ Supabase Auth.
  // Thao tác này sẽ tự động làm mới session nếu cần thiết, rất quan trọng cho Server Components.
  await supabase.auth.getUser()

  // Trả về response đã được cập nhật session cookie
  return supabaseResponse
} 