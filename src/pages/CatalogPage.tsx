import { useSearchParams } from "react-router-dom";
import { StudioWallPage } from "./StudioWallPage";

/**
 * Projects Directory & Gallery.
 * Reels is the default; `?view=directory` opens the grid catalog.
 */
export function CatalogPage() {
  const [params] = useSearchParams();
  const directory = params.get("view") === "directory";
  return <StudioWallPage initialMode={directory ? "vertical" : "horizontal"} />;
}
