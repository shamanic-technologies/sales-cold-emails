import { Check, Key, CreditCard } from "lucide-react";

const PLANS = [
  {
    name: "Free / BYOK",
    description: "Bring Your Own Keys",
    price: "$0",
    priceLabel: "forever",
    icon: Key,
    features: [
      "Unlimited campaigns",
      "Bring your own API keys (Apollo, Claude, etc.)",
      "Full workflow customization",
      "Real-time tracking dashboard",
      "You pay providers directly at their cost",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pay as you go",
    description: "Zero markup, we pass through costs",
    price: "At cost",
    priceLabel: "no markup",
    icon: CreditCard,
    features: [
      "Everything in Free",
      "No API keys needed - we handle it",
      "Pay only for what you use",
      "Costs passed through at 100%",
      "No hidden fees, no subscription",
    ],
    cta: "Get Started",
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section className="bg-white py-24 px-4">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Simple, transparent pricing
        </h2>
        <p className="mt-3 text-lg text-gray-500">
          No markup. No hidden fees. Pay for what you use.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border-2 p-8 text-left transition ${
                plan.highlighted
                  ? "border-indigo-600 shadow-lg shadow-indigo-100"
                  : "border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Popular
                </span>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    plan.highlighted
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <plan.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="ml-2 text-gray-500">/ {plan.priceLabel}</span>
              </div>

              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/sign-up"
                className={`mt-8 block rounded-lg py-3 text-center text-sm font-medium transition ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
