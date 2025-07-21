import { type NextRequest, NextResponse } from "next/server"
import { geminiAI } from "@/lib/gemini"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { repositoryId, repoData } = await request.json()

    // Update status to analyzing
    await supabase.from("repositories").update({ status: "analyzing" }).eq("id", repositoryId)

    // Analyze with Gemini AI
    const analysis = await geminiAI.analyzeRepository(repoData)

    // Save analysis results
    const { data: analysisResult, error: analysisError } = await supabase
      .from("analysis_results")
      .insert({
        repository_id: repositoryId,
        suggestions: analysis.suggestions,
        readme_generated: analysis.readme_content,
        score: analysis.score,
      })
      .select()
      .single()

    if (analysisError) throw analysisError

    // Update repository status and score
    await supabase
      .from("repositories")
      .update({
        status: "completed",
        score: analysis.score,
        last_analyzed: new Date().toISOString(),
      })
      .eq("id", repositoryId)

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    })
  } catch (error) {
    console.error("Analysis error:", error)

    // Update status to error
    const { repositoryId } = await request.json()
    await supabase.from("repositories").update({ status: "error" }).eq("id", repositoryId)

    return NextResponse.json({ success: false, error: "Analysis failed" }, { status: 500 })
  }
}
