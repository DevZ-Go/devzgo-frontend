// src/pages/WrapPage.tsx
import { WrapChapter } from "../components/wrap/WrapChapter";
import { PixelSprite } from "../components/wrap/PixelSprite";
import { POTION, INVADER, CHERRIES, HEART, GHOST } from "../components/wrap/sprites";
import { mockWrap as w } from "../data/mockWrap";

export function WrapPage() {
    return (
        <main className="h-screen overflow-y-scroll snap-y snap-mandatory bg-[#f2f2f2]">
            <WrapChapter index="01" title={`You shipped ${w.posted.count} projects`}
                text={`${w.posted.linesOfCode.toLocaleString()} lines of code uploaded.`}>
                <PixelSprite sprite={POTION} size={18} />
            </WrapChapter>

            <WrapChapter index="02" title={`Your stack: ${w.topTech[0]}`}
                text={w.topTech.join(" • ")}>
                <PixelSprite sprite={INVADER} size={18} />
            </WrapChapter>

            <WrapChapter index="03" title={`${w.explored.topCategoryPct}% of your browsing was ${w.explored.topCategory}`}
                text={`You looked at ${w.explored.viewed} projects.`}>
                <PixelSprite sprite={CHERRIES} size={18} />
            </WrapChapter>

            <WrapChapter index="04" title="Built together"
                text={`${w.collab.joined} projects joined, ${w.collab.invited} collaborators invited.`}>
                <PixelSprite sprite={HEART} size={18} />
            </WrapChapter>

            <WrapChapter index="05" title={w.persona} text="That's your month. Share it!">
                <PixelSprite sprite={GHOST} size={18} />
            </WrapChapter>
        </main>
    );
}
