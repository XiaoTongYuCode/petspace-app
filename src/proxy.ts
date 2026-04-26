import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/me/:path*",
    "/compose/:path*",
    "/api/me/:path*",
    "/api/oss/:path*",
    "/api/posts",
    "/api/posts/:id/like",
    "/api/posts/:id/favorite",
  ],
};
