"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { Class, Registration, User, Tutor } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { MapPin, School, UserIcon, CheckCircle, XCircle } from "lucide-react"

export default function ClassDetailPage() {
  const { user, getUserRole } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [classData, setClassData] = useState<Class | null>(null)
  const [customer, setCustomer] = useState<User | null>(null)
  const [tutor, setTutor] = useState<User | null>(null)
  const [tutorProfile, setTutorProfile] = useState<Tutor | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [tutors, setTutors] = useState<Record<string, User>>({})
  const [tutorProfiles, setTutorProfiles] = useState<Record<string, Tutor>>({})
  const [loading, setLoading] = useState(true)
  const role = getUserRole()
  const classId = params.id as string

  useEffect(() => {
    // Only admin and staff can access this page
    if (role !== "admin" && role !== "staff") {
      router.push("/dashboard")
      return
    }

    const fetchClassDetails = async () => {
      if (!classId) return

      try {
        // Fetch class data
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("*")
          .eq("id", classId)
          .single()

        if (classError) throw classError

        setClassData(classData as Class)

        // Fetch customer data
        if (classData.customer_id) {
          const { data: customerData, error: customerError } = await supabase
            .from("users")
            .select("*")
            .eq("id", classData.customer_id)
            .single()

          if (!customerError) {
            setCustomer(customerData as User)
          }
        }

        // Fetch tutor data if assigned
        if (classData.tutor_id) {
          const { data: tutorData, error: tutorError } = await supabase
            .from("users")
            .select("*")
            .eq("id", classData.tutor_id)
            .single()

          if (!tutorError) {
            setTutor(tutorData as User)

            // Fetch tutor profile
            const { data: tutorProfileData } = await supabase
              .from("tutors")
              .select("*")
              .eq("user_id", classData.tutor_id)
              .single()

            if (tutorProfileData) {
              setTutorProfile(tutorProfileData as Tutor)
            }
          }
        }

        // Fetch registrations for this class
        const { data: registrationsData, error: registrationsError } = await supabase
          .from("registrations")
          .select("*")
          .eq("class_id", classId)

        if (registrationsError) throw registrationsError

        setRegistrations(registrationsData as Registration[])

        // Fetch tutor data for all registrations
        if (registrationsData.length > 0) {
          const tutorIds = registrationsData.map((reg) => reg.tutor_id)

          const { data: tutorsData } = await supabase.from("users").select("*").in("id", tutorIds)

          const tutorsMap: Record<string, User> = {}
          tutorsData?.forEach((tutorData: User) => {
            tutorsMap[tutorData.id] = tutorData
          })

          setTutors(tutorsMap)

          // Fetch tutor profiles
          const { data: tutorProfilesData } = await supabase.from("tutors").select("*").in("user_id", tutorIds)

          const tutorProfilesMap: Record<string, Tutor> = {}
          tutorProfilesData?.forEach((profileData: Tutor) => {
            tutorProfilesMap[profileData.user_id] = profileData
          })

          setTutorProfiles(tutorProfilesMap)
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch class details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClassDetails()
  }, [classId, role, router])

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

  const handleApproveClass = async () => {
    try {
      const { error } = await supabase.from("classes").update({ status: "approved" }).eq("id", classId)

      if (error) throw error

      // Update local state
      setClassData((prev) => (prev ? { ...prev, status: "approved" } : null))

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

  const handleRejectClass = async () => {
    try {
      const { error } = await supabase.from("classes").update({ status: "cancelled" }).eq("id", classId)

      if (error) throw error

      // Update local state
      setClassData((prev) => (prev ? { ...prev, status: "cancelled" } : null))

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

  const handleApproveTutor = async (registrationId: string, tutorId: string) => {
    try {
      // Update registration status
      const { error: regError } = await supabase
        .from("registrations")
        .update({ status: "approved" })
        .eq("id", registrationId)

      if (regError) throw regError

      // Update class with tutor_id and change status to in_progress
      const { error: classError } = await supabase
        .from("classes")
        .update({
          tutor_id: tutorId,
          status: "in_progress",
        })
        .eq("id", classId)

      if (classError) throw classError

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === registrationId ? { ...reg, status: "approved" } : { ...reg, status: "rejected" },
        ),
      )

      setClassData((prev) => (prev ? { ...prev, tutor_id: tutorId, status: "in_progress" } : null))

      // Fetch tutor data
      const { data: tutorData } = await supabase.from("users").select("*").eq("id", tutorId).single()

      if (tutorData) {
        setTutor(tutorData as User)
      }

      toast({
        title: "Tutor approved",
        description: "The tutor has been assigned to this class",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve tutor",
        variant: "destructive",
      })
    }
  }

  const handleRejectTutor = async (registrationId: string) => {
    try {
      const { error } = await supabase.from("registrations").update({ status: "rejected" }).eq("id", registrationId)

      if (error) throw error

      // Update local state
      setRegistrations((prev) => prev.map((reg) => (reg.id === registrationId ? { ...reg, status: "rejected" } : reg)))

      toast({
        title: "Tutor rejected",
        description: "The tutor has been rejected for this class",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject tutor",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Class not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/classes")}>
          Back to Classes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{classData.subject}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Class ID: {classData.id}</p>
            {getStatusBadge(classData.status)}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/classes")}>
            Back to Classes
          </Button>

          {classData.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="bg-green-50 hover:bg-green-100 text-green-600"
                onClick={handleApproveClass}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Class
              </Button>
              <Button variant="outline" className="bg-red-50 hover:bg-red-100 text-red-600" onClick={handleRejectClass}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Class
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Subject</p>
                <p className="text-sm text-muted-foreground">{classData.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Grade Level</p>
                <p className="text-sm text-muted-foreground">{classData.grade_level}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{classData.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">{classData.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created At</p>
                <p className="text-sm text-muted-foreground">{new Date(classData.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Fee</p>
                <p className="text-sm text-muted-foreground">${classData.fee ? classData.fee.toFixed(2) : "0.00"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Schedule</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {classData.schedule.map((scheduleItem, index) => (
                  <Badge key={index} variant="secondary">
                    {scheduleItem}
                  </Badge>
                ))}
              </div>
            </div>

            {classData.requirements && (
              <div>
                <p className="text-sm font-medium">Requirements</p>
                <p className="text-sm text-muted-foreground">{classData.requirements}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{customer.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{customer.address}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Customer information not available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tutor" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tutor">Tutor Information</TabsTrigger>
          <TabsTrigger value="registrations">Tutor Registrations ({registrations.length})</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
        </TabsList>

        <TabsContent value="tutor" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Tutor</CardTitle>
            </CardHeader>
            <CardContent>
              {tutor ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">{tutor.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{tutor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{tutor.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">{tutor.status}</p>
                    </div>
                  </div>

                  {tutorProfile && (
                    <>
                      <div>
                        <p className="text-sm font-medium">Education</p>
                        <p className="text-sm text-muted-foreground">{tutorProfile.education}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Experience</p>
                        <p className="text-sm text-muted-foreground">{tutorProfile.experience}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Subjects</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tutorProfile.subjects.map((subject, index) => (
                            <Badge key={index} variant="secondary">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tutor has been assigned to this class yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tutor Registrations</CardTitle>
              <CardDescription>Tutors who have registered to teach this class</CardDescription>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tutors have registered for this class yet</p>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => {
                    const tutorData = tutors[registration.tutor_id]
                    const tutorProfileData = tutorProfiles[registration.tutor_id]

                    return (
                      <Card key={registration.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>{tutorData?.full_name || "Unknown Tutor"}</CardTitle>
                            <Badge
                              variant="outline"
                              className={
                                registration.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : registration.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {registration.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            Registered on {new Date(registration.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          {tutorData && (
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{tutorData.email}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{tutorData.address}</span>
                              </div>
                              {tutorProfileData && (
                                <>
                                  <div className="flex items-center text-sm">
                                    <School className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{tutorProfileData.education}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {tutorProfileData.subjects.map((subject, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {subject}
                                      </Badge>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </CardContent>
                        {registration.status === "pending" && (
                          <CardFooter className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 bg-green-50 hover:bg-green-100 text-green-600"
                              onClick={() => handleApproveTutor(registration.id, registration.tutor_id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600"
                              onClick={() => handleRejectTutor(registration.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contract information will be displayed here once a tutor is assigned and a contract is created.
              </p>

              {classData.tutor_id && (
                <Button className="mt-4" onClick={() => router.push(`/dashboard/contracts/create?classId=${classId}`)}>
                  Create Contract
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
