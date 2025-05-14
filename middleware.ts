// Import hàm tạo Supabase middleware client và các kiểu dữ liệu cần thiết
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware chính để xử lý tất cả request
export async function middleware(req: NextRequest) {
  // Tạo response mặc định để tiếp tục xử lý request nếu không có gì chặn
  const res = NextResponse.next()

  // Khởi tạo Supabase client cho middleware
  // Thư viện này sẽ tự động đọc và ghi cookie để duy trì phiên đăng nhập
  const supabase = createMiddlewareClient({ req, res })

  // Lấy thông tin người dùng hiện tại từ Supabase
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const role = user?.user_metadata?.role

  // Lấy đường dẫn hiện tại của request
  const { pathname } = req.nextUrl

  // Định nghĩa các đường dẫn cần bảo vệ (chỉ người dùng đăng nhập mới được truy cập)
  const protectedPaths = ['/dashboard' , '/dashboard/']

  // Kiểm tra xem đường dẫn hiện tại có nằm trong danh sách cần bảo vệ không
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  // Nếu người dùng chưa đăng nhập và đang cố vào trang cần bảo vệ
  if (isProtected && !user) {
    // Tạo URL mới để chuyển hướng người dùng đến trang đăng nhập
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    
    // Gắn thông tin đường dẫn gốc để sau khi đăng nhập có thể quay lại
    redirectUrl.searchParams.set('redirect_url', pathname)

    // Chuyển hướng người dùng đến trang đăng nhập
    return NextResponse.redirect(redirectUrl)
  }
  //Check role user là tutor/customer hay là admin/staff
  if( role === "tutor" || role === "customer"){
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/(user)/dashboard'
  }

  // Nếu người dùng hợp lệ hoặc truy cập trang công khai, tiếp tục xử lý request
  return res
}
