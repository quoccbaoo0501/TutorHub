import type { Metadata } from 'next'
import '../styles/globals.css'
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: 'TutorHub',
  description: 'Created by Kevin Baoo',
}

export default function RootLayout({ children, }: Readonly <{ children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
