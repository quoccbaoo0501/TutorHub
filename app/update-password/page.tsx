import UpdatePasswordForm from "@/components/forms/updatepass-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <UpdatePasswordForm />
    </div>
  )
}
