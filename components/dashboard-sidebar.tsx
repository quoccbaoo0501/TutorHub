"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Home,
  Users,
  BookOpen,
  FileText,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  Calendar,
  AlertTriangle,
  User,
} from "lucide-react"

export function DashboardSidebar() {
  const { user, signOut, getUserRole } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const role = getUserRole()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const NavItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
    const isActive = pathname === href

    return (
      <Link href={href}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={`w-full justify-start ${isActive ? "bg-secondary" : ""}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {icon}
          <span className="ml-2">{label}</span>
        </Button>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex flex-col h-screen w-64 bg-background border-r p-4">
        <div className="text-xl font-bold mb-6">Tutoring Center</div>
        <nav className="space-y-2 flex-1">
          <NavItem href="/dashboard" icon={<Home className="h-5 w-5" />} label="Dashboard" />

          {/* Admin and Staff Links */}
          {(role === "admin" || role === "staff") && (
            <>
              <NavItem href="/dashboard/tutors" icon={<Users className="h-5 w-5" />} label="Tutors" />
              <NavItem href="/dashboard/customers" icon={<User className="h-5 w-5" />} label="Customers" />
              <NavItem href="/dashboard/classes" icon={<BookOpen className="h-5 w-5" />} label="Classes" />
              <NavItem href="/dashboard/contracts" icon={<FileText className="h-5 w-5" />} label="Contracts" />
              {role === "admin" && (
                <>
                  <NavItem href="/dashboard/staff" icon={<UserPlus className="h-5 w-5" />} label="Staff" />
                  <NavItem href="/dashboard/schedule" icon={<Calendar className="h-5 w-5" />} label="Schedule" />
                  <NavItem href="/dashboard/finance" icon={<DollarSign className="h-5 w-5" />} label="Finance" />
                  <NavItem href="/dashboard/reports" icon={<BarChart2 className="h-5 w-5" />} label="Reports" />
                  <NavItem href="/dashboard/incidents" icon={<AlertTriangle className="h-5 w-5" />} label="Incidents" />
                </>
              )}
            </>
          )}

          {/* Tutor Links */}
          {role === "tutor" && (
            <>
              <NavItem href="/dashboard/my-classes" icon={<BookOpen className="h-5 w-5" />} label="My Classes" />
              <NavItem
                href="/dashboard/available-classes"
                icon={<Calendar className="h-5 w-5" />}
                label="Available Classes"
              />
              <NavItem href="/dashboard/my-contracts" icon={<FileText className="h-5 w-5" />} label="Contracts" />
              <NavItem href="/dashboard/my-payments" icon={<DollarSign className="h-5 w-5" />} label="Payments" />
            </>
          )}

          {/* Customer Links */}
          {role === "customer" && (
            <>
              <NavItem href="/dashboard/my-requests" icon={<BookOpen className="h-5 w-5" />} label="My Requests" />
              <NavItem href="/dashboard/create-request" icon={<UserPlus className="h-5 w-5" />} label="New Request" />
              <NavItem href="/dashboard/my-classes" icon={<Calendar className="h-5 w-5" />} label="My Classes" />
              <NavItem href="/dashboard/payments" icon={<DollarSign className="h-5 w-5" />} label="Payments" />
            </>
          )}

          <NavItem href="/dashboard/settings" icon={<Settings className="h-5 w-5" />} label="Settings" />
        </nav>
        <div className="pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-5 w-5" />
            <span className="ml-2">Logout</span>
          </Button>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu}></div>
          <div className="relative flex flex-col w-64 max-w-xs bg-background p-4 overflow-y-auto">
            <div className="text-xl font-bold mb-6">Tutoring Center</div>
            <nav className="space-y-2 flex-1">
              <NavItem href="/dashboard" icon={<Home className="h-5 w-5" />} label="Dashboard" />

              {/* Admin and Staff Links */}
              {(role === "admin" || role === "staff") && (
                <>
                  <NavItem href="/dashboard/tutors" icon={<Users className="h-5 w-5" />} label="Tutors" />
                  <NavItem href="/dashboard/customers" icon={<User className="h-5 w-5" />} label="Customers" />
                  <NavItem href="/dashboard/classes" icon={<BookOpen className="h-5 w-5" />} label="Classes" />
                  <NavItem href="/dashboard/contracts" icon={<FileText className="h-5 w-5" />} label="Contracts" />
                  {role === "admin" && (
                    <>
                      <NavItem href="/dashboard/staff" icon={<UserPlus className="h-5 w-5" />} label="Staff" />
                      <NavItem href="/dashboard/schedule" icon={<Calendar className="h-5 w-5" />} label="Schedule" />
                      <NavItem href="/dashboard/finance" icon={<DollarSign className="h-5 w-5" />} label="Finance" />
                      <NavItem href="/dashboard/reports" icon={<BarChart2 className="h-5 w-5" />} label="Reports" />
                      <NavItem
                        href="/dashboard/incidents"
                        icon={<AlertTriangle className="h-5 w-5" />}
                        label="Incidents"
                      />
                    </>
                  )}
                </>
              )}

              {/* Tutor Links */}
              {role === "tutor" && (
                <>
                  <NavItem href="/dashboard/my-classes" icon={<BookOpen className="h-5 w-5" />} label="My Classes" />
                  <NavItem
                    href="/dashboard/available-classes"
                    icon={<Calendar className="h-5 w-5" />}
                    label="Available Classes"
                  />
                  <NavItem href="/dashboard/my-contracts" icon={<FileText className="h-5 w-5" />} label="Contracts" />
                  <NavItem href="/dashboard/my-payments" icon={<DollarSign className="h-5 w-5" />} label="Payments" />
                </>
              )}

              {/* Customer Links */}
              {role === "customer" && (
                <>
                  <NavItem href="/dashboard/my-requests" icon={<BookOpen className="h-5 w-5" />} label="My Requests" />
                  <NavItem
                    href="/dashboard/create-request"
                    icon={<UserPlus className="h-5 w-5" />}
                    label="New Request"
                  />
                  <NavItem href="/dashboard/my-classes" icon={<Calendar className="h-5 w-5" />} label="My Classes" />
                  <NavItem href="/dashboard/payments" icon={<DollarSign className="h-5 w-5" />} label="Payments" />
                </>
              )}

              <NavItem href="/dashboard/settings" icon={<Settings className="h-5 w-5" />} label="Settings" />
            </nav>
            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
