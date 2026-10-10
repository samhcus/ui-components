import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const routes: Record<string, string> = { "/": "/library", "/assets": "/library/assets", "/notes": "/library/notes", "/components": "/library" };
  if (routes[path]) {
    const url = request.nextUrl.clone();
    url.pathname = routes[path];
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|.*\\.).*)"] };
