//NextRequest đại diện cho một HTTP request , NextResponse đại diện cho HTTP response
import { NextRequest, NextResponse } from 'next/server'; 

// Khởi tạo hàm middleware với tham số là đầu vào là đối tượng NextRequest , chứa toàn bộ thông tin về Request hiện tại
export function middleware(request: NextRequest) {
  //Lấy giá trị hiện tại của cookie sessionToken  , mục đíhc xem người dùng đăng nhập hay chưa
  const sessionToken = request.cookies.get('sessionToken')?.value; 

  //
  const { pathname } = request.nextUrl;

  // Log path để dễ debug
  console.log(`Request path: ${pathname}`);

  // Các đường dẫn công khai không cần xác thực
  const publicPaths = [
    '/login', '/login/',
    '/api/auth/login', '/api/auth/login/',
    '/register', '/register/',
    '/reset-password', '/reset-password/'
  ]; // Thêm các API route công khai nếu có

  // Tránh chuyển hướng cho các tài nguyên Next.js và file tĩnh
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    publicPaths.includes(pathname) || // Cho phép truy cập các trang/API trong publicPaths
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') || 
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }
  
  // Nếu không có token và không ở trang công khai, chuyển hướng đến /login
  if (!sessionToken) {
    console.log('No session token, redirecting to /login');
    const loginUrl = new URL('/login', request.url);
    // Thêm redirect_url để sau khi đăng nhập có thể quay lại trang trước đó
    loginUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Nếu có token, cho phép tiếp tục
  return NextResponse.next();
}
