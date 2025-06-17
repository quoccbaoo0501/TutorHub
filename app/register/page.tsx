import RegisterForm from "@/components/forms/register-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#7de3eb] dark:bg-gray-900 relative transition-colors duration-500">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <RegisterForm />
    </div>
  )
}
