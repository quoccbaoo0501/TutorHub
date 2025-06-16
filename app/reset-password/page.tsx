import ResetPasswordForm from "@/components/forms/resetpass-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResetPasswordPage() {
  return (
    <div className="fixed inset-0 flex bg-[#7de3eb] dark:bg-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ResetPasswordForm />
      </div>
    </div>
  )
}
