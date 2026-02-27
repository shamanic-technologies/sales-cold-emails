import Image from "next/image";
import { Zap, Target, BarChart3 } from "lucide-react";
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
            <Image src="/logo.jpg" alt="Sales Cold Emails" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-gray-900">
              Sales Cold Emails
            </span>
          </div>
          <a
            href="/sign-in"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
          >
            Sign In
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero px-4 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Cold emails that{" "}
            <span className="gradient-text">actually get replies</span>
          </h1>
          <p className="mt-4 text-base text-gray-600 sm:text-lg md:text-xl">
            AI-powered outreach campaigns. Enter your website, set your
            objective, and we build the workflow for you. Free with BYOK or
            pay-as-you-go with zero markup.
          </p>
          <HeroForm />
          <div className="mt-10">
            <Image
              src="/hero-banner.jpg"
              alt="Sales Cold Emails — AI-powered cold email campaigns"
              width={800}
              height={400}
              className="mx-auto rounded-2xl shadow-lg"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
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
