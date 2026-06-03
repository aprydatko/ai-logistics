import { MainNavigation } from "@/components/main-navigation";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <>
      <MainNavigation />
      {children}
    </>
  );
}
