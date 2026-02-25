"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export function SSOCallbackHandler() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}
