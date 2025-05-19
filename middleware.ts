import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // You can add additional middleware logic here if needed
  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
