import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, GraduationCap, Calendar, CheckCircle, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">Tutoring Center</div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground">
              Testimonials
            </Link>
          </nav>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Find Your Perfect Tutor</h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Connect with qualified tutors for personalized learning experiences tailored to your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=customer">
              <Button size="lg" className="w-full sm:w-auto">
                Find a Tutor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register?role=tutor">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Become a Tutor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Qualified Tutors</CardTitle>
                <CardDescription>
                  All our tutors are thoroughly vetted and have verified qualifications and experience.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Flexible Scheduling</CardTitle>
                <CardDescription>
                  Choose when and where you want to learn, with options for in-person or online sessions.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Personalized Learning</CardTitle>
                <CardDescription>
                  Get customized lessons tailored to your specific learning goals and pace.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create a Request</h3>
              <p className="text-muted-foreground">Describe your learning needs, schedule, and preferences.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Match with Tutors</h3>
              <p className="text-muted-foreground">Qualified tutors will apply to teach your class.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Tutor</h3>
              <p className="text-muted-foreground">Review tutor profiles and select the best match for you.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Learning</h3>
              <p className="text-muted-foreground">Begin your personalized learning journey with your tutor.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Excellent Math Tutor</CardTitle>
                <CardDescription>Parent of High School Student</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "We found an amazing math tutor for my daughter. Her grades improved significantly after just a few
                  sessions!"
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 mr-3"></div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <CheckCircle key={i} className="h-4 w-4" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Flexible and Professional</CardTitle>
                <CardDescription>Adult Learner</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "As a busy professional, I needed a flexible learning schedule. My language tutor accommodated my
                  needs perfectly and helped me prepare for my international business trip."
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 mr-3"></div>
                  <div>
                    <p className="font-medium">Michael Chen</p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <CheckCircle key={i} className="h-4 w-4" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Great Teaching Experience</CardTitle>
                <CardDescription>Tutor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "The platform makes it easy to connect with students who match my teaching style and expertise. The
                  scheduling and payment system is seamless."
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 mr-3"></div>
                  <div>
                    <p className="font-medium">David Rodriguez</p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <CheckCircle key={i} className="h-4 w-4" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Join our community of learners and tutors today and transform your educational journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=customer">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Find a Tutor
              </Button>
            </Link>
            <Link href="/register?role=tutor">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Become a Tutor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Tutoring Center</h3>
              <p className="text-muted-foreground">
                Connecting qualified tutors with eager learners for personalized educational experiences.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#testimonials" className="text-muted-foreground hover:text-foreground">
                    Testimonials
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-muted-foreground">Email: info@tutoringcenter.com</li>
                <li className="text-muted-foreground">Phone: (123) 456-7890</li>
                <li className="text-muted-foreground">Address: 123 Education St, Learning City</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-6 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Tutoring Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
