import { getWorks } from "../../lib/api/works";
import { assertWorkLinks } from "../../lib/api/work-links";
import WorksListing from "./WorksListing";

export const dynamic = "force-dynamic";

export default async function WorksPage() {
  const works = await getWorks();
  assertWorkLinks(works);
  return <WorksListing data={works} />;
}
