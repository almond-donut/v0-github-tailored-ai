import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=no_code`)
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
        client_id: process.env.GITHUB_CLIENT_ID || "Ov23liaOcBS8zuFJCGyG",
        client_secret: process.env.GITHUB_CLIENT_SECRET || "b5e2c958fe85415f477d90a1c9482d8329b6e552",
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

    // Create user profile in Supabase
    const { data: userProfile, error: userError } = await supabase
      .from("user_profiles")
      .upsert({
        github_username: userData.login,
        github_id: userData.id,
        display_name: userData.name,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        preferences: {},
      })
      .select()
      .single()

    if (userError) {
      console.error("User creation error:", userError)
    }

    // Save repositories to database
    const repositories = reposData.map((repo: any) => ({
      user_id: userProfile?.id || userData.id.toString(),
      github_repo_id: repo.id,
      repo_data: {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        default_branch: repo.default_branch,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
        topics: repo.topics || [],
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
      },
      priority_order: 0,
      is_featured: false,
    }))

    const { error: repoError } = await supabase
      .from("user_repositories")
      .upsert(repositories, { onConflict: "github_repo_id,user_id" })

    if (repoError) {
      console.error("Repository save error:", repoError)
    }

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?connected=true`)
  } catch (error) {
    console.error("GitHub OAuth error:", error)
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=oauth_failed`)
  }
}
