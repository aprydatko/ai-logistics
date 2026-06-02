import { Button } from "@repo/ui/components/button";
import Link from "next/link";

import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>AI Logistics</p>
        <h1 className={styles.title}>Dispatch operations, simplified.</h1>
        <p className={styles.description}>
          A focused workspace for loads, drivers, incidents, and AI-assisted
          logistics workflows.
        </p>
        <Button asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
