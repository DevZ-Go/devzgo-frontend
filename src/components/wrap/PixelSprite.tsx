// src/components/wrap/PixelSprite.tsx
import type { Sprite } from "./sprites";

type Props = { sprite: Sprite; size?: number; paletteOverride?: Record<string, string> };

export function PixelSprite({ sprite, size = 16, paletteOverride }: Props) {
    const palette = { ...sprite.palette, ...paletteOverride };
    const cols = sprite.grid[0].length;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, ${size}px)`,
                imageRendering: "pixelated",
            }}
        >
            {sprite.grid.flatMap((row, y) =>
                [...row].map((ch, x) => (
                    <div
                        key={`${x}-${y}`}
                        style={{
                            width: size,
                            height: size,
                            background: palette[ch] ?? "transparent",
                        }}
                    />
                ))
            )}
        </div>
    );
}
