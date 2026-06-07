"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./main-navigation.module.css";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/drivers", label: "Drivers" },
  { href: "/loads", label: "Loads" },
  { href: "/incidents", label: "Incidents" },
  { href: "/documents", label: "Documents" },
  { href: "/assistant", label: "Assistant" },
  { href: "/ai-logs", label: "AI Logs" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings", label: "Settings" },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/">
        AI Logistics
      </Link>
      <nav className={styles.nav} aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={styles.link}
              data-active={isActive}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
