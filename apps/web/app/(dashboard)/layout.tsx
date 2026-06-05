import { DashboardShell } from '@/components/layouts/dashboard';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return <DashboardShell>{children}</DashboardShell>;
}
