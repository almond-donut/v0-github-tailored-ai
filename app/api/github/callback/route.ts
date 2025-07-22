import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Log semua informasi request
  console.log("🔗 === GITHUB OAUTH CALLBACK STARTED ===")
  console.log("📍 Request URL:", request.url)
  console.log("📍 Request method:", request.method)
  console.log("📍 Request headers:", Object.fromEntries(request.headers.entries()))

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")
  const state = searchParams.get("state")

  console.log("📋 URL Parameters:", {
    code: code ? `Present (${code.substring(0, 10)}...)` : "Missing",
    error,
    error_description,
    state,
    origin,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  // Jika ada error dari GitHub
  if (error) {
    console.error("❌ GitHub OAuth Error:", { error, error_description })
    const errorMessage = error_description || error
    const redirectUrl = `${origin}/?oauth_error=${encodeURIComponent(errorMessage)}`
    console.log("🔄 Redirecting to:", redirectUrl)
    return NextResponse.redirect(redirectUrl)
  }

  // Jika tidak ada code
  if (!code) {
    console.error("❌ No authorization code received")
    const redirectUrl = `${origin}/?oauth_error=no_authorization_code`
    console.log("🔄 Redirecting to:", redirectUrl)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    console.log("🔄 Starting token exchange process...")

    // Ambil environment variables
    const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23liaOcBS8zuFJCGyG"
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || "b5e2c958fe85415f477d90a1c9482d8329b6e552"

    console.log("🔑 Using credentials:", {
      clientId: clientId.substring(0, 10) + "...",
      clientSecret: clientSecret ? "Present" : "Missing",
      hasClientSecret: !!clientSecret,
    })

    // Exchange code for access token
    const tokenRequestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }

    console.log("📤 Token request body:", {
      client_id: tokenRequestBody.client_id.substring(0, 10) + "...",
      client_secret: tokenRequestBody.client_secret ? "Present" : "Missing",
      code: tokenRequestBody.code.substring(0, 10) + "...",
    })

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "GitHub-Tailored-AI/1.0",
      },
      body: JSON.stringify(tokenRequestBody),
    })

    console.log("📥 Token response status:", tokenResponse.status, tokenResponse.statusText)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token request failed:", errorText)
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log("🔑 Token response data:", {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      error: tokenData.error,
      errorDescription: tokenData.error_description,
    })

    if (tokenData.error) {
      console.error("❌ Token exchange error:", tokenData)
      throw new Error(tokenData.error_description || tokenData.error)
    }

    if (!tokenData.access_token) {
      console.error("❌ No access token in response:", tokenData)
      throw new Error("No access token received from GitHub")
    }

    console.log("👤 Fetching user data from GitHub API...")

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Tailored-AI/1.0",
      },
    })

    console.log("👤 User response status:", userResponse.status, userResponse.statusText)

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("❌ User request failed:", errorText)
      throw new Error(`User request failed: ${userResponse.status} - ${errorText}`)
    }

    const userData = await userResponse.json()
    console.log("👤 User data received:", {
      login: userData.login,
      id: userData.id,
      name: userData.name,
      email: userData.email,
      publicRepos: userData.public_repos,
    })

    if (!userData.login) {
      console.error("❌ Invalid user data:", userData)
      throw new Error("Invalid user data received from GitHub")
    }

    console.log("📁 Fetching repositories...")

    // Get user repositories (with error handling)
    let reposData = []
    try {
      const reposResponse = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30&type=owner", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitHub-Tailored-AI/1.0",
        },
      })

      if (reposResponse.ok) {
        reposData = await reposResponse.json()
        console.log("📁 Repositories fetched:", {
          count: Array.isArray(reposData) ? reposData.length : 0,
        })
      } else {
        console.warn("⚠️ Failed to fetch repositories, continuing without them")
      }
    } catch (repoError) {
      console.warn("⚠️ Repository fetch error:", repoError)
    }

    // Create session data
    const sessionData = {
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name || userData.login,
        email: userData.email,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
      },
      repositories: Array.isArray(reposData) ? reposData : [],
      authenticated_at: new Date().toISOString(),
      access_token: tokenData.access_token, // Store for API calls
    }

    console.log("💾 Session data created:", {
      userId: sessionData.user.id,
      userLogin: sessionData.user.login,
      repoCount: sessionData.repositories.length,
    })

    // Create redirect response
    const redirectUrl = `${origin}/dashboard?oauth_success=true`
    console.log("🔄 Creating redirect to:", redirectUrl)

    const response = NextResponse.redirect(redirectUrl)

    // Set session cookie
    const cookieValue = JSON.stringify(sessionData)
    console.log("🍪 Setting session cookie, size:", cookieValue.length, "characters")

    response.cookies.set("github_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("✅ === GITHUB OAUTH CALLBACK COMPLETED SUCCESSFULLY ===")
    return response
  } catch (error) {
    console.error("❌ === GITHUB OAUTH CALLBACK FAILED ===")
    console.error("Error details:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    const errorMessage = error instanceof Error ? error.message : "authentication_failed"
    const redirectUrl = `${origin}/?oauth_error=${encodeURIComponent(errorMessage)}`
    console.log("🔄 Error redirect to:", redirectUrl)

    return NextResponse.redirect(redirectUrl)
  }
}
