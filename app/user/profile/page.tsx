"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ProfilePage() {
  // State để lưu trữ thông tin hồ sơ và trạng thái
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Khởi tạo Supabase client
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Tải thông tin hồ sơ khi component được tải
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)

        // Lấy thông tin người dùng hiện tại
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Không tìm thấy thông tin người dùng")
          return
        }

        // Lấy thông tin hồ sơ từ bảng profiles
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Lỗi lấy hồ sơ:", error)
          setError("Không thể tải thông tin hồ sơ")
          return
        }

        setProfile(data)
      } catch (err) {
        console.error("Lỗi không mong muốn:", err)
        setError("Đã xảy ra lỗi khi tải thông tin hồ sơ")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  // Hiển thị trạng thái đang tải
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Hiển thị thông báo lỗi nếu có
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lỗi</CardTitle>
          <CardDescription>Không thể tải thông tin hồ sơ</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Hiển thị thông tin hồ sơ
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hồ sơ của tôi</h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Thông tin chi tiết về tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                  <p>{profile.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Họ và tên</h3>
                  <p>{profile.full_name || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Số điện thoại</h3>
                  <p>{profile.phone_number || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Địa chỉ</h3>
                  <p>{profile.address || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Vai trò</h3>
                  <p>
                    {profile.role === "customer"
                      ? "Khách hàng"
                      : profile.role === "tutor"
                        ? "Gia sư"
                        : profile.role === "admin"
                          ? "Quản trị viên"
                          : profile.role === "staff"
                            ? "Nhân viên"
                            : profile.role}
                  </p>
                </div>
              </div>

              {/* Hiển thị thông tin bổ sung cho gia sư */}
              {profile.role === "tutor" && (
                <div className="mt-6 pt-6 border-t">
                  <h2 className="text-xl font-semibold mb-4">Thông tin gia sư</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Học vấn</h3>
                      <p>{profile.education || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Kinh nghiệm</h3>
                      <p>{profile.experience || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Môn dạy</h3>
                      <p>{profile.subjects || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>Không tìm thấy thông tin hồ sơ. Vui lòng liên hệ quản trị viên.</p>
          )}
        </CardContent>
      </Card>

      {/* Hiển thị dữ liệu JSON cho mục đích debug */}
      <Card>
        <CardHeader>
          <CardTitle>Dữ liệu người dùng (Debug)</CardTitle>
          <CardDescription>Thông tin chi tiết từ cơ sở dữ liệu</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-xs">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
