"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { Class } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, MapPin, School, Search, UserIcon, CheckCircle, XCircle } from "lucide-react"

export default function ClassesManagementPage() {
  const { user, getUserRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const role = getUserRole()

  useEffect(() => {
    // Only admin and staff can access this page
    if (role !== "admin" && role !== "staff") {
      router.push("/dashboard")
      return
    }

    const fetchClasses = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("classes").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setClasses(data as Class[])
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch classes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [user, role, router])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Approved
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleApproveClass = async (classId: string) => {
    try {
      const { error } = await supabase.from("classes").update({ status: "approved" }).eq("id", classId)

      if (error) throw error

      // Update local state
      setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, status: "approved" } : c)))

      toast({
        title: "Class approved",
        description: "The class has been approved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve class",
        variant: "destructive",
      })
    }
  }

  const handleRejectClass = async (classId: string) => {
    try {
      const { error } = await supabase.from("classes").update({ status: "cancelled" }).eq("id", classId)

      if (error) throw error

      // Update local state
      setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, status: "cancelled" } : c)))

      toast({
        title: "Class rejected",
        description: "The class has been rejected",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject class",
        variant: "destructive",
      })
    }
  }

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      searchTerm === "" ||
      classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "" || classItem.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const pendingClasses = filteredClasses.filter((c) => c.status === "pending")
  const approvedClasses = filteredClasses.filter((c) => c.status === "approved")
  const activeClasses = filteredClasses.filter((c) => c.status === "in_progress")
  const completedClasses = filteredClasses.filter((c) => c.status === "completed" || c.status === "cancelled")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
        <p className="text-muted-foreground">Manage all classes in the system</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by subject or location"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => router.push("/dashboard/classes/create")}>
            Create Class
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filteredClasses.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingClasses.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedClasses.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeClasses.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedClasses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground text-center">No classes found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{classItem.subject}</CardTitle>
                      {getStatusBadge(classItem.status)}
                    </div>
                    <CardDescription>Created on {new Date(classItem.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <School className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{classItem.grade_level}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{classItem.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{classItem.schedule.join(", ")}</span>
                      </div>
                      {classItem.tutor_id && (
                        <div className="flex items-center text-sm">
                          <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Tutor assigned</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/classes/${classItem.id}`)}
                    >
                      View Details
                    </Button>

                    {classItem.status === "pending" && (
                      <div className="flex gap-2">
                        <Button variant="outline" className="w-10 p-0" onClick={() => handleApproveClass(classItem.id)}>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="outline" className="w-10 p-0" onClick={() => handleRejectClass(classItem.id)}>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingClasses.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-muted-foreground text-center">No pending classes found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingClasses.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{classItem.subject}</CardTitle>
                      {getStatusBadge(classItem.status)}
                    </div>
                    <CardDescription>Created on {new Date(classItem.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <School className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{classItem.grade_level}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{classItem.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{classItem.schedule.join(", ")}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/classes/${classItem.id}`)}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" className="w-10 p-0" onClick={() => handleApproveClass(classItem.id)}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button variant="outline" className="w-10 p-0" onClick={() => handleRejectClass(classItem.id)}>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Similar content for other tabs (approved, active, completed) */}
        <TabsContent value="approved" className="mt-6">
          {/* Similar to pending tab but for approved classes */}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {/* Similar to pending tab but for active classes */}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {/* Similar to pending tab but for completed classes */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
