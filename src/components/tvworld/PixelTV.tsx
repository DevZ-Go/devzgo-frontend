import { memo, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { PlacedTv } from "./types";
import "./tvworld.css";

interface Props {
  tv: PlacedTv;
  focused: boolean;
  onSelect: (id: string) => void;
}

const KNOB_ANGLES = [-40, -10, 25, 60];

/** One project as a dark pixel-art CRT television, placed at its world coordinates. */
export const PixelTV = memo(function PixelTV({ tv, focused, onSelect }: Props) {
  const { project } = tv;
  const [imageFailed, setImageFailed] = useState(false);
  const showVideo = focused && project.videoUrl !== null;
  const showImage = !showVideo && project.coverUrl !== null && !imageFailed;
  const num = String(tv.number).padStart(2, "0");

  // Per-TV variation derived from the id hash (via the layout), never random at render time.
  const knobA = KNOB_ANGLES[tv.number % KNOB_ANGLES.length];
  const knobB = KNOB_ANGLES[(tv.number + 2) % KNOB_ANGLES.length];

  const style = {
    left: tv.x,
    top: tv.y,
    width: tv.w,
    height: tv.h,
    "--s": tv.scale,
    "--rot": `${tv.rot}deg`,
    "--fd": `${tv.flickerDuration}s`,
    "--fdl": `${tv.flickerDelay}s`,
    "--gd": `${tv.glitchDuration}s`,
    "--gdl": `${tv.glitchDelay}s`,
  } as CSSProperties;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(project.id);
    }
  }

  return (
    <div className={`tv${focused ? " tv--focused" : ""}`} style={style} data-tv-id={project.id}>
      <div className="tv-shell">
        <div className="tv-floor" />
        <div
          className="tv-body"
          role="button"
          tabIndex={0}
          aria-label={`Open project ${project.title}`}
          onClick={() => onSelect(project.id)}
          onKeyDown={onKeyDown}
        >
          <div className="tv-body-inner">
            <div className="tv-vents" />
            <div className="tv-bezel">
              <div className="tv-screen">
                {showVideo ? (
                  <video
                    className="tv-media"
                    src={project.videoUrl ?? undefined}
                    poster={project.coverUrl ?? undefined}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : showImage ? (
                  <img
                    className="tv-media"
                    src={project.coverUrl ?? undefined}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="tv-nosignal">
                    <i />
                    <span>NO SIGNAL</span>
                  </div>
                )}
                <div className="tv-scan" />
                <div className="tv-noise" />
                <div className="tv-glass" />
                <div className="tv-glitch" />
              </div>
            </div>
            <div className="tv-panel">
              <span className="tv-led" />
              <span className="tv-knob" style={{ "--knob": `${knobA}deg` } as CSSProperties} />
              <span className="tv-knob" style={{ "--knob": `${knobB}deg` } as CSSProperties} />
              <span className="tv-buttons">
                <b />
                <b />
                <b />
              </span>
              <span className="tv-grille" />
            </div>
          </div>
          <div className="tv-feet">
            <i />
            <i />
          </div>
        </div>
      </div>
      <div className="tv-label">
        <b>{project.title}</b>
        <small>{num}</small>
      </div>
    </div>
  );
});
