import { Mail, Zap, Target, BarChart3 } from "lucide-react";
import { HeroForm } from "@/components/landing/hero-form";
import { PricingSection } from "@/components/landing/pricing-section";
import { Footer } from "@/components/landing/footer";

const FEATURES = [
  {
    icon: Target,
    title: "Smart Targeting",
    description: "AI finds the right prospects matching your ideal customer profile.",
  },
  {
    icon: Zap,
    title: "Personalized at Scale",
    description: "Every email is uniquely crafted based on prospect research.",
  },
  {
    icon: BarChart3,
    title: "Real-time Tracking",
    description: "Monitor opens, clicks, and replies as they happen.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Mail className="h-4 w-4" />
            </div>
            <span className="font-semibold text-gray-900">
              Sales Cold Emails
            </span>
          </div>
          <a
            href="/sign-in"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Sign In
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero pt-32 pb-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900">
            Cold emails that{" "}
            <span className="gradient-text">actually get replies</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            AI-powered outreach campaigns. Enter your website, set your
            objective, and we build the workflow for you. Free with BYOK or
            pay-as-you-go with zero markup.
          </p>
          <HeroForm />
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />
      <Footer />
    </main>
  );
}
