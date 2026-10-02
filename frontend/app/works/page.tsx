import { getWorks } from "../../lib/api/works";
import WorksListing from "./WorksListing";

export const dynamic = "force-dynamic";

export default async function WorksPage() {
  const works = await getWorks();
  return <WorksListing data={works} />;
}
