import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register | AI Logistics",
  description:
    "Create an AI Logistics account and enter the operations workspace.",
};

export default function RegisterPage(): React.JSX.Element {
  return (
    <section aria-label="Register">
      <div className="mb-8">
        <p className="mb-5 hidden w-fit rounded-full bg-info-soft-background px-3 py-1 text-xs font-medium text-info-accent lg:block">
          Login / Register form
        </p>
        <h1 className="text-3xl font-bold text-ink-900">Create account</h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Register and enter your AI Logistics workspace.
        </p>
      </div>
      <RegisterForm />
    </section>
  );
}
