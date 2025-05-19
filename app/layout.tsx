import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aplicación de Quiz con IA",
  description: "Pon a prueba tus conocimientos con preguntas generadas por IA o predefinidas",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} dark`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <main className="min-h-screen bg-spotify-background text-spotify-text">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
