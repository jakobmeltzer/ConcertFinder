import { getWork } from "../../app/data/works";
import { composerSlug } from "../composerSlug";
import type { WorkResponse } from "./works";

// Temporary migration boundary: detail routes still resolve the local catalogue.
// Remove this check when work and composer detail routes consume the API.
export function assertWorkLinks(works: WorkResponse[]): void {
  for (const work of works) {
    const detail = getWork(work.id);
    if (!detail || composerSlug(detail.composer) !== work.composer.id) {
      throw new Error(`Detail route not migrated for API work: ${work.id}`);
    }
  }
}
