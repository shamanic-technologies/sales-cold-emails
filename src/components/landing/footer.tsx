import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-12 px-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Sales Cold Emails" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="font-semibold text-gray-900">
            Sales Cold Emails
          </span>
        </div>
        <p className="text-sm text-gray-500">
          AI-powered cold email campaigns
        </p>
      </div>
    </footer>
  );
}
