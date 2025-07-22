import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?message=${sessionError.message}`
      );
    }

    if (session) {
      const { provider_token, user } = session;

      if (!provider_token) {
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/error?message=No provider token found. Please try signing in again.`
        );
      }

      try {
        // Get user info from GitHub
        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `token ${provider_token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });
        const userData = await userResponse.json();

        // Get user repositories
        const reposResponse = await fetch(
          "https://api.github.com/user/repos?sort=updated&per_page=100",
          {
            headers: {
              Authorization: `token ${provider_token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        const reposData = await reposResponse.json();

        // Save user profile to database
        const { error: userError } = await supabase.from("user_profiles").upsert({
          id: user.id,
          github_username: userData.login,
          github_id: userData.id,
          display_name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
        });

        if (userError) throw userError;

        // Save repositories to database
        const repositories = reposData.map((repo: any) => ({
          user_id: user.id,
          github_repo_id: repo.id,
          repo_data: {
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
            pushed_at: repo.pushed_at,
            size: repo.size,
            open_issues_count: repo.open_issues_count,
            topics: repo.topics || [],
            has_issues: repo.has_issues,
            has_projects: repo.has_projects,
            has_wiki: repo.has_wiki,
            archived: repo.archived,
            disabled: repo.disabled
          },
          priority_order: 0,
        }));

        const { error: repoError } = await supabase
          .from("user_repositories")
          .upsert(repositories, { onConflict: "github_repo_id,user_id" });

        if (repoError) {
          console.error("Error saving repositories:", repoError);
          // Don't fail the entire flow if repo sync fails
        }
      } catch (error) {
        console.error("Error syncing GitHub data:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/dashboard?error=sync_failed`
        );
      }
    }
  }

  // URL to redirect to after sign in process completes
  const response = NextResponse.redirect(`${requestUrl.origin}/dashboard?connected=true`);
  
  // Ensure cookies are properly set in the response
  const cookieStore = cookies();
  cookieStore.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  });

  return response;
}
