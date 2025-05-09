"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { Class, Registration } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, MapPin, Search } from "lucide-react"

export default function AvailableClassesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [registrations, setRegistrations] = useState<Record<string, Registration>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("")
  const [gradeLevelFilter, setGradeLevelFilter] = useState("")

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Literature",
    "History",
    "Geography",
    "Computer Science",
    "Foreign Language",
    "Music",
    "Art",
  ]

  const gradeLevels = ["Elementary School", "Middle School", "High School", "College", "University", "Adult Education"]

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return

      try {
        // Fetch available classes (pending approval)
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("*")
          .eq("status", "approved")
          .is("tutor_id", null)

        if (classesError) throw classesError

        // Fetch tutor's registrations
        const { data: registrationsData, error: registrationsError } = await supabase
          .from("registrations")
          .select("*")
          .eq("tutor_id", user.id)

        if (registrationsError) throw registrationsError

        // Create a map of class_id to registration for easy lookup
        const registrationsMap: Record<string, Registration> = {}
        registrationsData.forEach((reg: Registration) => {
          registrationsMap[reg.class_id] = reg
        })

        setClasses(classesData as Class[])
        setRegistrations(registrationsMap)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch available classes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [user])

  const handleRegister = async (classId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to register for a class",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("registrations")
        .insert([
          {
            class_id: classId,
            tutor_id: user.id,
            status: "pending",
          },
        ])
        .select()

      if (error) throw error

      // Update local state
      setRegistrations((prev) => ({
        ...prev,
        [classId]: data[0] as Registration,
      }))

      toast({
        title: "Registration successful",
        description: "Your registration has been submitted and is pending approval",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register for class",
        variant: "destructive",
      })
    }
  }

  const getRegistrationStatus = (classId: string) => {
    const registration = registrations[classId]
    if (!registration) return null

    switch (registration.status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Registration Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Registration Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Registration Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      searchTerm === "" ||
      classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSubject = subjectFilter === "" || classItem.subject === subjectFilter
    const matchesGradeLevel = gradeLevelFilter === "" || classItem.grade_level === gradeLevelFilter

    return matchesSearch && matchesSubject && matchesGradeLevel
  })

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
        <h1 className="text-3xl font-bold tracking-tight">Available Classes</h1>
        <p className="text-muted-foreground">Browse and register for available classes</p>
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
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={gradeLevelFilter} onValueChange={setGradeLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Grade Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {gradeLevels.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground text-center">No available classes found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{classItem.subject}</CardTitle>
                  {getRegistrationStatus(classItem.id)}
                </div>
                <CardDescription>{classItem.grade_level}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{classItem.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{classItem.schedule.join(", ")}</span>
                  </div>
                  {classItem.requirements && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Requirements:</p>
                      <p className="text-sm text-muted-foreground">{classItem.requirements}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {registrations[classItem.id] ? (
                  <Button variant="outline" className="w-full" disabled>
                    Already Registered
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleRegister(classItem.id)}>
                    Register for Class
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
