import {
  Bot,
  Boxes,
  ChevronDown,
  CircleGauge,
  GitFork,
  LockKeyhole,
  Play,
  Radar,
  Route,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { DashboardPreview } from "@/components/landing/dashboard-preview";

import styles from "./page.module.css";

const githubUrl =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  "https://github.com/aprydatko/ai-logistics";

const navItems = ["Product", "Solutions", "Resources", "Pricing", "Company"];

const valuePills = [
  { icon: CircleGauge, label: "Real-time operations" },
  { icon: Sparkles, label: "AI-driven insights" },
  { icon: LockKeyhole, label: "Secure & scalable" },
];

const pillars = [
  {
    icon: Bot,
    title: "AI-Powered Insights",
    description:
      "Detect risks, delays, and anomalies before they impact your operations.",
    tone: "slate",
  },
  {
    icon: Radar,
    title: "Real-Time Visibility",
    description:
      "Track loads, drivers, and incidents in real-time on an interactive map.",
    tone: "cyan",
  },
  {
    icon: Workflow,
    title: "Automated Workflows",
    description:
      "Reduce manual work with AI-driven actions and smart automation.",
    tone: "violet",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="AI Logistics home">
          <span className={styles.brandMark}>
            <Route aria-hidden="true" />
          </span>
          <span>AI Logistics</span>
        </Link>

        <nav className={styles.navigation} aria-label="Marketing navigation">
          {navItems.map((item) => (
            <a href={`#${item.toLowerCase()}`} key={item}>
              {item}
              {item !== "Pricing" && <ChevronDown aria-hidden="true" />}
            </a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link className={styles.loginLink} href="/login">
            Log in
          </Link>
          <Link className={styles.primaryButton} href="/dashboard">
            View demo
          </Link>
        </div>
      </header>

      <section className={styles.hero} id="product">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>AI-powered logistics platform</p>
          <h1>AI Logistics Platform for Modern Fleets</h1>
          <p className={styles.lede}>
            Real-time visibility, AI-powered incident detection, and automated
            workflows that keep your operations moving.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/dashboard">
              <Play aria-hidden="true" fill="currentColor" />
              Live demo
            </Link>
            <a className={styles.secondaryButton} href={githubUrl}>
              <GitFork aria-hidden="true" />
              View on GitHub
            </a>
          </div>

          <div className={styles.valuePills}>
            {valuePills.map(({ icon: Icon, label }) => (
              <div className={styles.valuePill} key={label}>
                <span>
                  <Icon aria-hidden="true" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section className={styles.trust} id="company">
        <p>Trusted by logistics teams worldwide</p>
        <div className={styles.logos}>
          <span>◉ TransGlobal</span>
          <span>FAST CARGO</span>
          <span>NORTHLINE</span>
          <span>FleetRunner</span>
          <span>CARGOMAX</span>
        </div>
      </section>

      <section className={styles.pillars} id="solutions">
        {pillars.map(({ icon: Icon, title, description, tone }) => (
          <article className={styles.pillar} key={title}>
            <div className={styles.pillarIcon} data-tone={tone}>
              <Icon aria-hidden="true" />
            </div>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </article>
        ))}
        <Boxes className={styles.gridDecoration} aria-hidden="true" />
      </section>
    </main>
  );
}
