import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect("/dashboard?error=no_code")
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description)
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    const userData = await userResponse.json()

    // Get user repositories
    const reposResponse = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    const reposData = await reposResponse.json()

    // Save user to database
    const { data: user, error: userError } = await supabase
      .from("users")
      .upsert({
        github_username: userData.login,
        email: userData.email,
        subscription_tier: "free",
      })
      .select()
      .single()

    if (userError) throw userError

    // Save repositories to database
    const repositories = reposData.map((repo: any) => ({
      user_id: user.id,
      github_repo_id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      language: repo.language,
      stars_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      status: "pending",
    }))

    await supabase.from("repositories").upsert(repositories, { onConflict: "github_repo_id" })

    return NextResponse.redirect("/dashboard?connected=true")
  } catch (error) {
    console.error("GitHub OAuth error:", error)
    return NextResponse.redirect("/dashboard?error=oauth_failed")
  }
}
