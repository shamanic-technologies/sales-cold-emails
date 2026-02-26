import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
]);

function noopMiddleware(_req: NextRequest) {
  return NextResponse.next();
}

const handler = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware(async (auth, req) => {
      const { userId } = await auth();

      if (
        req.nextUrl.pathname.startsWith("/sign-in") ||
        req.nextUrl.pathname.startsWith("/sign-up") ||
        req.nextUrl.pathname.startsWith("/sso-callback")
      ) {
        if (userId) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }

      if (!isPublicRoute(req) && !userId) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
      }

      return NextResponse.next();
    })
  : noopMiddleware;

export default handler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
