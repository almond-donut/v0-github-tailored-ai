import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "GitHub Tailored AI - Your Personal Repository Assistant",
  description:
    "Clean up and organize your GitHub repositories with AI before applying for jobs. Reorganize structure, write docs, and prep your repos like a pro.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono`}>{children}</body>
    </html>
  )
}
