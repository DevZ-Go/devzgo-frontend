// src/components/wrap/WrapChapter.tsx
import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = { index: string; title: string; text: string; children: ReactNode };

export function WrapChapter({ index, title, text, children }: Props) {
    return (
        <section className="h-screen snap-start flex flex-col items-center justify-center gap-6 px-8 text-center">
            <span className="font-mono text-sm tracking-widest text-gray-500">{index}</span>
            <h2 className="text-4xl md:text-6xl font-black max-w-3xl">{title}</h2>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.6 }}
                transition={{ duration: 0.4 }}
            >
                {children}
            </motion.div>
            <p className="max-w-md text-gray-600">{text}</p>
        </section>
    );
}
