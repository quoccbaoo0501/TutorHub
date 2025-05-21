"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ClientLayout from "@/components/layout/client-layout"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const role = user.user_metadata?.role

        if (role === "admin" || role === "staff") {
          console.log("Admin/staff accessing user area. Redirecting to admin dashboard.")
          router.push("/admin/dashboard")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <ClientLayout>{children}</ClientLayout>
}
