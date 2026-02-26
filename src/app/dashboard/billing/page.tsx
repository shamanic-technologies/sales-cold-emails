"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Coins, AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  getBillingBalance,
  getTransactions,
  createCheckoutSession,
} from "@/lib/api-client";
import type { BillingBalance, BillingTransaction } from "@/lib/types";

const RELOAD_AMOUNTS_CENTS = [500, 1000, 2500, 5000];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<BillingBalance | null>(null);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    Promise.all([getBillingBalance(), getTransactions()])
      .then(([b, t]) => {
        setBalance(b);
        setTransactions(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAddCredits = async (amountCents: number) => {
    setCheckoutLoading(amountCents);
    try {
      const { url } = await createCheckoutSession(amountCents);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-y-auto p-4 sm:p-6">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Credits added successfully!
        </div>
      )}
      {canceled && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Checkout was canceled.
        </div>
      )}

      {/* Balance card */}
      {balance && (
        <div className="mt-6 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Coins className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                ${(balance.balance_cents / 100).toFixed(2)}
              </p>
            </div>
          </div>

          {balance.depleted && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Your credits are depleted. Add credits to continue running campaigns.
            </div>
          )}

          <p className="mt-2 text-xs text-gray-400">
            Mode: {balance.billing_mode}
          </p>
        </div>
      )}

      {/* Add credits */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Add Credits</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RELOAD_AMOUNTS_CENTS.map((cents) => (
            <button
              key={cents}
              onClick={() => handleAddCredits(cents)}
              disabled={checkoutLoading !== null}
              className="flex flex-col items-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
            >
              <span className="text-lg font-bold">${cents / 100}</span>
              {checkoutLoading === cents && (
                <span className="mt-1 text-xs text-gray-400">Redirecting...</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="mt-8 pb-8">
        <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No transactions yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    tx.amount >= 0 ? "text-emerald-600" : "text-gray-700"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}${(tx.amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
