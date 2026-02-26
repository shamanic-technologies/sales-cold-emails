"use client";

import { useEffect, useState } from "react";

export function ProvisionGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    fetch("/api/auth/provision", { method: "POST" })
      .then((res) => {
        if (res.ok) {
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Setting up your account...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-red-500">
          Failed to set up your account. Please refresh the page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
