import { PageIntro } from "@/components/page-intro";

type IncidentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
  const { id } = await params;

  return (
    <PageIntro
      description={`Incident ${id}: AI classification, suggested response, ticket actions, and live timeline.`}
      eyebrow="Incident detail"
      title="Incident details"
    />
  );
}
