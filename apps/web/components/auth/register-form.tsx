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
import type { User as DomainUser } from "@repo/shared";
import {
  registerSchema,
  type RegisterValues,
} from "@/lib/auth/register-schema";
import { useUserStore } from "@/stores/user-store";
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

interface AuthUserResponse {
  user: DomainUser;
}

const DEFAULT_ERROR = "Unable to create your account. Check the details and try again.";

export function RegisterForm(): React.JSX.Element {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterValues): Promise<void> => {
    setSubmitError(null);

    try {
      const response = await fetch("/api/auth/register", {
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-500"
                  />
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="given-name"
                      className="h-12 pl-11"
                      placeholder="Alex"
                      type="text"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-500"
                  />
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="family-name"
                      className="h-12 pl-11"
                      placeholder="Morgan"
                      type="text"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-500"
                />
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="new-password"
                    className="h-12 px-11"
                    placeholder="Create a password"
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
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
