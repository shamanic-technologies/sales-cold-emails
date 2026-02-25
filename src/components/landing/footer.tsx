import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-12 px-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Mail className="h-4 w-4" />
          </div>
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
