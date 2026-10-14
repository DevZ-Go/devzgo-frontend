import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Navbar } from "../components/Navbar";
import pixelCatBackground from "../assets/pixelcat-ezgif.com-gif-to-mp4-converter.mp4";

// Floating vintage/editorial stamp badges (stacked on right margin like reference photo)
function EditorialStamps() {
  return (
    <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-28 z-20 pointer-events-none select-none">
      {/* Stamp 1: Circular Standard Seal */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.85, x: 0 }}
        transition={{ delay: 0.3 }}
        className="w-16 h-16 rounded-full border-2 border-stone-400/60 flex flex-col items-center justify-center text-center p-1 bg-white/20 backdrop-blur-xs text-stone-700 shadow-sm"
      >
        <span className="text-[7px] font-bold tracking-widest uppercase">THE DEVZ</span>
        <span className="font-serif font-bold text-sm leading-none my-0.5">D</span>
        <span className="text-[6px] tracking-wider uppercase">STANDARD</span>
      </motion.div>

      {/* Stamp 2: Clean Square Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.85, x: 0 }}
        transition={{ delay: 0.4 }}
        className="w-16 h-16 rounded-lg border border-stone-400/60 flex flex-col items-center justify-center text-center p-1.5 bg-white/20 backdrop-blur-xs text-stone-700 shadow-sm"
      >
        <span className="text-[9px] font-bold tracking-tight">100%</span>
        <span className="text-[7px] font-semibold tracking-wider uppercase leading-tight">STUDENT<br />CRAFTED</span>
      </motion.div>

      {/* Stamp 3: Gold Circular Seal */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.85, x: 0 }}
        transition={{ delay: 0.5 }}
        className="w-16 h-16 rounded-full border border-amber-600/50 flex flex-col items-center justify-center text-center p-1 bg-amber-100/50 backdrop-blur-xs text-amber-900 shadow-sm"
      >
        <span className="text-[6px] font-bold tracking-widest uppercase">VERIFIED</span>
        <span className="font-serif text-[10px] font-bold leading-tight my-0.5">SOURCE</span>
        <span className="text-[6px] tracking-wider uppercase">COMMUNITY</span>
      </motion.div>

      {/* Stamp 4: Pill Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.85, x: 0 }}
        transition={{ delay: 0.6 }}
        className="w-16 h-12 rounded border border-emerald-800/40 flex flex-col items-center justify-center text-center p-1 bg-emerald-50/40 backdrop-blur-xs text-emerald-950 shadow-sm"
      >
        <span className="font-serif text-[8px] italic leading-tight">open source</span>
        <span className="text-[6px] tracking-widest uppercase text-emerald-900">IN THE WILD</span>
      </motion.div>

      {/* Stamp 5: Monogram Emblem */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.85, x: 0 }}
        transition={{ delay: 0.7 }}
        className="w-16 h-16 rounded-full border-2 border-stone-600/50 flex items-center justify-center text-center bg-stone-900/10 backdrop-blur-xs text-stone-800 shadow-sm"
      >
        <span className="font-serif text-lg font-bold">DZ</span>
      </motion.div>
    </div>
  );
}

// Decorative corner gingham / washi tape accent for the media card
function CornerTape() {
  return (
    <div
      className="absolute -top-3 -right-3 w-28 h-9 z-10 shadow-md rotate-[28deg] pointer-events-none opacity-85"
      style={{
        backgroundColor: "#687a6c",
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.25) 0, rgba(255, 255, 255, 0.25) 5px, transparent 0, transparent 10px),
          repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.15) 0, rgba(0, 0, 0, 0.15) 5px, transparent 0, transparent 10px)
        `,
      }}
    />
  );
}

export function LandingPage() {

  return (
    <div className="min-h-screen bg-[#f7f5ed] text-stone-800 selection:bg-amber-200">
      {/* ── Top Editorial Navigation ── */}
      <Navbar variant="editorial" />

      {/* ── SECTION 1: HERO (With Pixelcat Background, Title, Center Pill Button & Stamps) ── */}
      <section className="relative w-full h-[90vh] min-h-[640px] flex items-center justify-center overflow-hidden bg-stone-950">
        {/* Pixelcat Video Background Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            src={pixelCatBackground}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/50" />
        </div>

        {/* Floating Stamps Column on the Right */}
        <EditorialStamps />

        {/* Center Content: Headline & "Explore Projects" Pill Button */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal text-white tracking-tight leading-[1.08] drop-shadow-md"
          >
            Code is Coded. Like, <span className="italic">Really.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="mt-8"
          >
            <Link
              to="/explore"
              className="inline-block px-8 py-2.5 rounded-full bg-[#fced96] hover:bg-[#fae77c] text-stone-900 font-sans text-xs font-semibold uppercase tracking-widest transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Projects
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: OVERLAPPING SHEET & PRODUCT / PROJECT CARDS ── */}
      <section className="relative z-10 -mt-16 md:-mt-24 rounded-t-[2.5rem] md:rounded-t-[3.5rem] bg-[#f8f6f0] px-6 md:px-14 pt-16 pb-24 border-t border-stone-200/50 shadow-2xl">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header */}
          <div className="mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight">
              Better Ingredients, Better Flavor.
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-sans mt-1 tracking-wide">
              Lorem ipsum dolor sit amet.
            </p>
          </div>

          {/* Cards Grid: 1 Special Promo Card + 3 Item Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* 1. Feature / Promo Card (Brown package style in image) */}
            <div className="group relative rounded-2xl bg-[#c5b59e]/30 border border-[#b8a78e]/40 p-6 flex flex-col justify-between overflow-hidden min-h-[340px] shadow-sm hover:shadow-md transition-shadow">
              {/* Top Tag */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-[#a79479] text-white">
                  TOP CHARTED
                </span>
              </div>

              {/* Blank Media / Illustration Area */}
              <div className="my-auto flex items-center justify-center py-6">
                <div className="w-32 h-32 rounded-xl border border-dashed border-stone-400/40 flex items-center justify-center text-xs text-stone-500 text-center p-2">
                  {/* User can insert custom graphic or image here */}
                  [ Maybe you like this? / Box Image Slot ]
                </div>
              </div>

              {/* Bottom "Shop All" / "Explore All" Pill Button */}
              <div>
                <Link
                  to="/explore"
                  className="w-full block text-center py-2 px-4 rounded-full bg-[#faed9d] hover:bg-[#f8e882] text-stone-900 font-sans text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                >
                  Shop All
                </Link>
              </div>
            </div>

            {/* 2. Blank Item Card 1 */}
            <div className="group flex flex-col">
              <div className="aspect-square rounded-2xl bg-[#cedcd2]/45 border border-[#bccdc1]/50 overflow-hidden flex items-center justify-center relative shadow-xs transition-transform duration-300 group-hover:-translate-y-1">
                {/* Blank Image Slot */}
                <div className="text-center p-4 text-xs text-stone-400">
                  <div className="w-12 h-12 rounded-full border border-dashed border-stone-400/50 mx-auto mb-2 flex items-center justify-center">
                    +
                  </div>
                  [ Image Slot 1 ]
                </div>
              </div>
              <div className="mt-3.5">
                <h3 className="font-serif text-lg text-stone-900 font-normal">
                  Ribeye Steak
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">$29.89</p>
              </div>
            </div>

            {/* 3. Blank Item Card 2 */}
            <div className="group flex flex-col">
              <div className="aspect-square rounded-2xl bg-[#cedcd2]/45 border border-[#bccdc1]/50 overflow-hidden flex items-center justify-center relative shadow-xs transition-transform duration-300 group-hover:-translate-y-1">
                {/* Blank Image Slot */}
                <div className="text-center p-4 text-xs text-stone-400">
                  <div className="w-12 h-12 rounded-full border border-dashed border-stone-400/50 mx-auto mb-2 flex items-center justify-center">
                    +
                  </div>
                  [ Image Slot 2 ]
                </div>
              </div>
              <div className="mt-3.5">
                <h3 className="font-serif text-lg text-stone-900 font-normal">
                  Filet Mignon
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">From $31.00</p>
              </div>
            </div>

            {/* 4. Blank Item Card 3 */}
            <div className="group flex flex-col">
              <div className="aspect-square rounded-2xl bg-[#cedcd2]/45 border border-[#bccdc1]/50 overflow-hidden flex items-center justify-center relative shadow-xs transition-transform duration-300 group-hover:-translate-y-1">
                {/* Blank Image Slot */}
                <div className="text-center p-4 text-xs text-stone-400">
                  <div className="w-12 h-12 rounded-full border border-dashed border-stone-400/50 mx-auto mb-2 flex items-center justify-center">
                    +
                  </div>
                  [ Image Slot 3 ]
                </div>
              </div>
              <div className="mt-3.5">
                <h3 className="font-serif text-lg text-stone-900 font-normal">
                  Frenched Rack of Lamb
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">$44.00</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: SPLIT EDITORIAL SECTION (Quote/Story Box + Taped Media Card) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-24 items-stretch">
            {/* Left Column: Soft Pastel Story Card */}
            <div className="rounded-3xl bg-[#dbe8f5] p-8 sm:p-12 md:p-16 flex flex-col justify-center text-center shadow-xs">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-600 mb-6 block">
                THE CLEANEST MEAT IN AMERICA
              </span>
              <p className="font-serif text-xl sm:text-2xl md:text-3xl text-stone-800 leading-relaxed font-normal max-w-lg mx-auto">
                Our style of farming is about restoring connection to good,
                healthy food. It's thinking long term about what's good for the
                health of people, animals and land. And it's making the real
                changes necessary to get there. It's growing enjoyment and
                appreciation of food raised right, and knowledge of what goes
                into truly good food.
              </p>
            </div>

            {/* Right Column: Media / Photo Box with Decorative Tape */}
            <div className="relative rounded-3xl bg-stone-200/60 border border-stone-300/40 overflow-hidden min-h-[380px] flex items-center justify-center shadow-xs">
              {/* Decorative Corner Washi/Gingham Tape */}
              <CornerTape />

              {/* Blank Media / Image Placeholder */}
              <div className="text-center p-8 text-stone-400">
                <div className="w-16 h-16 rounded-2xl border border-dashed border-stone-400/60 mx-auto mb-3 flex items-center justify-center text-xl">
                  📷
                </div>
                <p className="font-serif text-base text-stone-600">
                  [ Blank Media / Photo Slot ]
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Place an image, gif, or video here
                </p>
              </div>
            </div>
          </div>

          {/* ── FUTURE SCROLL SECTIONS ── */}
          {/*
            You can keep adding more sections below as your page grows!
            Example:
            <section className="mt-24">...</section>
          */}
        </div>
      </section>
    </div>
  );
}
