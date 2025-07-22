import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")

  console.log("🔗 Auth callback received:", {
    code: code ? "Present" : "Missing",
    error,
    error_description,
    origin,
  })

  // Handle OAuth errors
  if (error) {
    console.error("❌ OAuth error:", { error, error_description })
    return NextResponse.redirect(`${origin}/dashboard?error=${encodeURIComponent(error_description || error)}`)
  }

  if (!code) {
    console.error("❌ No authorization code received")
    return NextResponse.redirect(`${origin}/dashboard?error=no_authorization_code`)
  }

  try {
    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("❌ Code exchange error:", exchangeError)
      return NextResponse.redirect(`${origin}/dashboard?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (!data.session) {
      console.error("❌ No session created")
      return NextResponse.redirect(`${origin}/dashboard?error=no_session_created`)
    }

    console.log("✅ Authentication successful:", {
      userId: data.user?.id,
      email: data.user?.email,
      provider: data.user?.app_metadata?.provider,
    })

    // Successful authentication
    return NextResponse.redirect(`${origin}/dashboard?success=authenticated`)
  } catch (error) {
    console.error("❌ Callback processing error:", error)
    return NextResponse.redirect(
      `${origin}/dashboard?error=${encodeURIComponent(error instanceof Error ? error.message : "authentication_failed")}`,
    )
  }
}
