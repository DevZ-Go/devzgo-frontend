import { useSearchParams } from "react-router-dom";
import { StudioWallPage } from "./StudioWallPage";

/**
 * Projects Directory & Gallery (unified into one page with Horizontal / Vertical scroll toggle).
 * `?view=reels` opens the Reels gallery (used by the guest tour).
 */
export function CatalogPage() {
  const [params] = useSearchParams();
  const reels = params.get("view") === "reels";
  return <StudioWallPage initialMode={reels ? "horizontal" : "vertical"} />;
}
