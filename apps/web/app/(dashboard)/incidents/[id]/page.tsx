import { IncidentDetailPage } from "@/components/incidents/incident-detail-page";

type IncidentRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IncidentRoutePage({
  params,
}: IncidentRoutePageProps): Promise<React.JSX.Element> {
  const { id } = await params;

  return <IncidentDetailPage incidentId={id} />;
}
