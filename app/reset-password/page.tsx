import ResetPasswordForm from "@/components/forms/resetpass-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <ResetPasswordForm />
    </div>
  )
}
