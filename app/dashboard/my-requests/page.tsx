"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { Class } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, MapPin, School, User } from "lucide-react"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setClasses(data as Class[])
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch class requests",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [user])

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

  const pendingClasses = classes.filter((c) => c.status === "pending")
  const approvedClasses = classes.filter((c) => c.status === "approved")
  const activeClasses = classes.filter((c) => c.status === "in_progress")
  const completedClasses = classes.filter((c) => c.status === "completed" || c.status === "cancelled")

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
        <h1 className="text-3xl font-bold tracking-tight">My Class Requests</h1>
        <p className="text-muted-foreground">View and manage your class requests</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({classes.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingClasses.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedClasses.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeClasses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground text-center">You haven&apos;t created any class requests yet.</p>
                <Button className="mt-4" onClick={() => router.push("/dashboard/create-request")}>
                  Create New Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {classes.map((classItem) => (
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
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Tutor assigned</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/my-requests/${classItem.id}`)}
                    >
                      View Details
                    </Button>
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
                <p className="text-muted-foreground text-center">You don&apos;t have any pending class requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
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
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/my-requests/${classItem.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedClasses.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-muted-foreground text-center">You don&apos;t have any approved class requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {approvedClasses.map((classItem) => (
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
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Tutor assigned</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/my-requests/${classItem.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeClasses.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-muted-foreground text-center">You don&apos;t have any active classes.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {activeClasses.map((classItem) => (
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
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Tutor assigned</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/my-requests/${classItem.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-8">
        <Button onClick={() => router.push("/dashboard/create-request")}>Create New Request</Button>
      </div>
    </div>
  )
}
