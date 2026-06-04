"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import type { User } from "@repo/shared";
import { loginSchema, type LoginValues } from "@/lib/auth/login-schema";
import { useUserStore } from "@/stores/user-store";
import { AlertCircle, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

interface AuthUserResponse {
  user: User;
}

const DEFAULT_ERROR = "Unable to sign in. Check your credentials and try again.";

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues): Promise<void> => {
    setSubmitError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        setSubmitError(DEFAULT_ERROR);
        return;
      }

      const authResponse = (await response.json()) as AuthUserResponse;
      setUser(authResponse.user);
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setSubmitError("The authentication service is unavailable. Try again shortly.");
    }
  };

  return (
    <Form {...form}>
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-500"
                />
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="email"
                    className="h-12 pl-11"
                    inputMode="email"
                    placeholder="you@example.com"
                    type="email"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-4">
                <FormLabel>Password</FormLabel>
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed text-xs font-medium text-primary opacity-80"
                  title="Password recovery is coming soon"
                >
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-500"
                />
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="current-password"
                    className="h-12 px-11"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                  />
                </FormControl>
                <Button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 text-ink-500 hover:bg-surface-100 hover:text-primary"
                  onClick={() => setShowPassword((visible) => !visible)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-5" />
                  ) : (
                    <Eye aria-hidden="true" className="size-5" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            className="size-4 rounded border-input accent-primary"
            type="checkbox"
          />
          Remember me
        </label>

        {submitError ? (
          <Alert>
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="mt-1 h-12 w-full bg-primary-700 text-base hover:bg-primary-600"
          disabled={form.formState.isSubmitting}
          size="lg"
          type="submit"
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <p className="text-center text-sm text-ink-500">
          New to AI Logistics?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/register">
            Create an account
          </Link>
        </p>
      </form>
    </Form>
  );
}
