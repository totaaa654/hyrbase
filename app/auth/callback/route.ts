import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Supabase appends type=recovery for password-reset emails
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const isRecovery = type === "recovery" || next.startsWith("/reset-password");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (isRecovery) {
        // Password reset: keep the session so the user can update their password
        return NextResponse.redirect(`${origin}${next}`);
      }
      // Email confirmation: verification done, but don't auto-login
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/auth/verified`);
    }
  }

  // Error fallback — route to the appropriate page for each flow
  if (isRecovery) {
    return NextResponse.redirect(`${origin}/reset-password?error=invalid`);
  }
  return NextResponse.redirect(`${origin}/auth/verification-error`);
}
