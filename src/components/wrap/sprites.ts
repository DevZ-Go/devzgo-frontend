// src/components/wrap/sprites.ts
export type Sprite = { grid: string[]; palette: Record<string, string> };

export const HEART: Sprite = {
    grid: [
        ".RR..RR.",
        "RRRRRRRR",
        "RWRRRRRR",
        "RRRRRRRR",
        ".RRRRRR.",
        "..RRRR..",
        "...RR...",
    ],
    palette: { R: "#e63946", W: "#ffffff" }, // "." = transparent
};

export const GHOST: Sprite = {
    grid: [
        "..OOOO..",
        ".OOOOOO.",
        "OWWOOWWO",
        "OWBOOWBO",
        "OOOOOOOO",
        "OOOOOOOO",
        "OO.OO.OO",
    ],
    palette: { O: "#ff9f1c", W: "#ffffff", B: "#1d3557" },
};

export const CHERRIES: Sprite = {
    grid: [
        "....GG..",
        "...G..G.",
        "..G....G",
        ".RR...RR",
        "RRRR.RRR",
        "RRRR.RRR",
        ".RR...RR",
    ],
    palette: { R: "#e63946", G: "#2a9d8f" },
};

export const POTION: Sprite = {
    grid: [
        "..GGGG..",
        "...CC...",
        "...CC...",
        "..CCCC..",
        ".CLLLLC.",
        "CLLLLLLC",
        "CLLLLLLC",
        ".CCCCCC.",
    ],
    palette: { G: "#8d99ae", C: "#4cc9f0", L: "#ff5d3a" },
};

export const INVADER: Sprite = {
    grid: [
        "..G....G..",
        "...G..G...",
        "..GGGGGG..",
        ".GGMGGMGG.",
        "GGGGGGGGGG",
        "G.GGGGGG.G",
        "G.G....G.G",
        "...GG.GG..",
    ],
    palette: { G: "#39ff14", M: "#ff2bd6" },
};
