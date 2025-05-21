import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Xử lý callback từ Supabase Auth sau khi xác minh email
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Trao đổi code để lấy session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Chuyển hướng về trang chủ
  return NextResponse.redirect(new URL("/", request.url))
}
