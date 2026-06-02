import { PageIntro } from "@/components/page-intro";

type LoadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LoadDetailPage({ params }: LoadDetailPageProps) {
  const { id } = await params;

  return (
    <PageIntro
      description={`Load ${id}: assignment, ETA, route, documents, and status timeline.`}
      eyebrow="Load detail"
      title="Load details"
    />
  );
}
