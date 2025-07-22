import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("github_session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const sessionData = JSON.parse(sessionCookie.value)

    // Verify session is still valid (not expired)
    const authenticatedAt = new Date(sessionData.authenticated_at)
    const now = new Date()
    const daysSinceAuth = (now.getTime() - authenticatedAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceAuth > 7) {
      // Session expired
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    // Remove sensitive data before sending to client
    const { access_token, ...safeSessionData } = sessionData

    return NextResponse.json(safeSessionData)
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the session cookie
    response.cookies.set("github_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
    })

    return response
  } catch (error) {
    console.error("Session delete error:", error)
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 })
  }
}
