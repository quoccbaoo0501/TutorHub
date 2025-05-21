import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Lấy thông tin phiên đăng nhập hiện tại
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 400 })
    }

    if (!sessionData.session) {
      return NextResponse.json({ error: "Không có phiên đăng nhập" }, { status: 401 })
    }

    // Lấy thông tin người dùng từ bảng auth.users
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    // Lấy thông tin hồ sơ từ bảng profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Trả về thông tin người dùng và hồ sơ
    return NextResponse.json({
      user: userData.user,
      profile: profileData,
    })
  } catch (error) {
    console.error("Lỗi kiểm tra người dùng:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
