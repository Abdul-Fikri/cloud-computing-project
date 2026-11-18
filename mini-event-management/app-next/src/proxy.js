import { NextResponse } from "next/server";

// Authentication and authorization are enforced by the MySQL-backed
// requireOwner/requireGroup/requirePanitia guards in server components/actions.
// Do not initialize a Supabase client in the request proxy.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
