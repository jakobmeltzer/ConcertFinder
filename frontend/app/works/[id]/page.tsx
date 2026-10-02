import { notFound } from "next/navigation";
import { ApiError } from "../../../lib/api/client";
import { getWork } from "../../../lib/api/works";
import WorkDetail from "./WorkDetail";

export const dynamic = "force-dynamic";

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  return <WorkDetail work={work} today={new Date().toISOString().slice(0, 10)} />;
}
