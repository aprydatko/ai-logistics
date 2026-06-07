import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | AI Logistics",
  description: "Sign in to the AI Logistics operations workspace.",
};

export default function LoginPage(): React.JSX.Element {
  return (
    <section aria-label="Login">
      <div className="mb-8">
        <p className="mb-5 hidden w-fit rounded-full bg-info-soft-background px-3 py-1 text-xs font-medium text-info-accent lg:block">
          Login / Register form
        </p>
        <h1 className="text-3xl font-bold text-ink-900">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Sign in to your AI Logistics account.
        </p>
      </div>
      <LoginForm />
    </section>
  );
}
