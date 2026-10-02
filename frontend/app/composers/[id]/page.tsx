import { notFound } from "next/navigation";
import { ApiError } from "../../../lib/api/client";
import { getComposer } from "../../../lib/api/composers";
import ComposerDetail from "./ComposerDetail";

export const dynamic = "force-dynamic";

export default async function ComposerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const composer = await getComposer(id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  return <ComposerDetail composer={composer} today={new Date().toISOString().slice(0, 10)} />;
}
