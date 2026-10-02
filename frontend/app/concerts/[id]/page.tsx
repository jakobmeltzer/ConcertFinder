import { notFound } from "next/navigation";
import { ApiError } from "../../../lib/api/client";
import { getConcert } from "../../../lib/api/concerts";
import ConcertDetail from "./ConcertDetail";

export const dynamic = "force-dynamic";

export default async function ConcertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concert = await getConcert(id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  return <ConcertDetail concert={concert} />;
}
