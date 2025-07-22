import { type NextRequest, NextResponse } from "next/server"
import { geminiAI } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { repository, userProfile } = await request.json()

    if (!repository) {
      return NextResponse.json({ error: "Repository data is required" }, { status: 400 })
    }

    // Analyze repository using Gemini AI
    const analysis = await geminiAI.analyzeRepository(repository, userProfile)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze repository" }, { status: 500 })
  }
}
