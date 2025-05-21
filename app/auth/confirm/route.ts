import type { EmailOtpType } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Lấy các tham số từ URL
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/update-password"
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next

  console.log("Auth confirm route called with params:", {
    token_hash: token_hash ? "exists" : "missing",
    type,
    next,
  })

  if (token_hash && type) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Xác minh OTP (One-Time Password)
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      console.log("OTP verified successfully, redirecting to:", next)
      return NextResponse.redirect(redirectTo)
    }

    console.error("Error verifying OTP:", error)
  }

  // Chuyển hướng người dùng đến trang lỗi với một số hướng dẫn
  redirectTo.pathname = "/reset-password"
  redirectTo.searchParams.set("error", "invalid_token")
  return NextResponse.redirect(redirectTo)
}
