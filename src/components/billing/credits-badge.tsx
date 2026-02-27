"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { getBillingBalance } from "@/lib/api-client";

export function CreditsBadge() {
  const router = useRouter();
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [depleted, setDepleted] = useState(false);

  useEffect(() => {
    getBillingBalance()
      .then((b) => {
        setBalanceCents(b.balance_cents);
        setDepleted(b.depleted);
      })
      .catch(() => {});
  }, []);

  if (balanceCents === null) return null;

  const dollars = (balanceCents / 100).toFixed(2);

  return (
    <button
      onClick={() => router.push("/dashboard/billing")}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
        depleted
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-orange-50 text-orange-700 hover:bg-orange-100"
      }`}
      title="View billing"
    >
      <Coins className="h-3.5 w-3.5" />
      ${dollars}
    </button>
  );
}
