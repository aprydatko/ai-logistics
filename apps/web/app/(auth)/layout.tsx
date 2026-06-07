import GitHubIcon from "@/assets/GitHubIcon";
import { Button } from "@repo/ui/components/button";
import {
  ArrowLeft,
  BookOpen,
  Boxes,
  Home,
  Play,
  PlayCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Security",
    description: "Enterprise-grade security and data protection.",
  },
  {
    icon: UsersRound,
    title: "Roles",
    description: "Role-based access and permissions for every workspace.",
  },
  {
    icon: Boxes,
    title: "Others",
    description: "Loads, incidents, documents, and AI-assisted operations.",
  },
];

const mobileNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/dashboard", icon: PlayCircle, label: "Demo" },
  {
    href: "https://github.com/aprydatko/ai-logistics",
    icon: GitHubIcon,
    label: "GitHub",
  },
  {
    href: "https://github.com/aprydatko/ai-logistics/tree/main/docs",
    icon: BookOpen,
    label: "Docs",
  },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <main className="min-h-svh bg-surface-50">
      <div className="min-h-svh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(480px,0.88fr)]">
        <section className="bg-gray-100 relative hidden px-10 py-7 text-ink-900 lg:flex lg:flex-col xl:px-12">
          <div className="flex h-full flex-col">
            <Link className="inline-flex w-fit items-center gap-3" href="/">
              <Image
                alt=""
                className="size-11 rounded-md"
                height={44}
                src="/logo.png"
                width={44}
              />
              <span className="text-lg font-semibold text-ink-900">
                AI Logistics
              </span>
            </Link>

            <div className="mt-10 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-600">
                AI logistics operations
              </p>
              <h1 className="mt-4 max-w-lg text-3xl font-bold leading-tight text-ink-900">
                Calm control for every logistics decision
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-ink-500">
                Monitor loads, coordinate drivers, respond to incidents, and
                keep AI-assisted actions clear and auditable.
              </p>
            </div>

            <div className="mt-8 flex gap-4">
              <Button
                asChild
                className="h-11 has-[>svg]:px-5"
                variant="outline"
              >
                <Link href="/dashboard">
                  <Play aria-hidden="true" />
                  Live demo
                </Link>
              </Button>
              <Button
                asChild
                className="h-11 has-[>svg]:px-8"
                variant="outline"
              >
                <Link
                  href="https://github.com/aprydatko/ai-logistics"
                  rel="noreferrer"
                  target="_blank"
                >
                  <GitHubIcon aria-hidden="true" />
                  GitHub
                </Link>
              </Button>
            </div>

            <div className="mt-8 xl:mt-50">
              <h2 className="mb-4 text-md font-semibold text-ink-900">
                Built for secure logistics operations
              </h2>
              <div className="grid gap-4 lg:grid-cols-3">
                {benefits.map(({ icon: Icon, title, description }) => (
                  <article
                    className="min-h-32 rounded-lg bg-white border border-border p-4"
                    key={title}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        aria-hidden="true"
                        className="size-7 shrink-0 text-primary"
                      />
                      <h3 className="text-sm font-semibold text-ink-900">
                        {title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-svh flex-col pb-20 lg:pb-0">
          <header className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link
              className="inline-flex items-center gap-2.5 lg:hidden"
              href="/"
            >
              <Image
                alt=""
                className="size-8 rounded-md"
                height={32}
                src="/logo.png"
                width={32}
              />
              <span className="text-sm font-semibold text-ink-900">
                AI Logistics
              </span>
            </Link>
            <Link
              className="ml-auto hidden min-h-11 items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-primary hover:underline lg:inline-flex"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to home
            </Link>
          </header>
          <div className="flex flex-1 justify-center px-5 pb-12 pt-8 sm:px-8 lg:items-center lg:px-10 lg:pb-8 lg:pt-0 xl:px-12">
            <div className="w-full max-w-md">{children}</div>
          </div>
          <nav
            aria-label="Auth navigation"
            className="fixed inset-x-0 bottom-0 z-20 grid h-20 grid-cols-4 border-t border-border bg-surface-0 lg:hidden"
          >
            {mobileNavItems.map(({ href, icon: Icon, label }) => {
              const isExternal = href.startsWith("http");

              return (
                <Link
                  className="flex min-h-11 flex-col items-center justify-center gap-1 text-xs font-medium text-ink-500 transition-colors hover:bg-surface-50 hover:text-primary"
                  href={href}
                  key={label}
                  rel={isExternal ? "noreferrer" : undefined}
                  target={isExternal ? "_blank" : undefined}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </section>
      </div>
    </main>
  );
}
