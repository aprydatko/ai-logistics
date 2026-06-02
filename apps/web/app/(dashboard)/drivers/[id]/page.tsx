import { PageIntro } from "@/components/page-intro";

type DriverDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DriverDetailPage({
  params,
}: DriverDetailPageProps) {
  const { id } = await params;

  return (
    <PageIntro
      description={`Driver profile for ${id}: status, truck info, documents, and trip history.`}
      eyebrow="Driver profile"
      title="Driver details"
    />
  );
}
