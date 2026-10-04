import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, Star, Heart, Code2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-cream-50 relative overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-50/85 backdrop-blur-xl border-b border-amber-100/60">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            to="/home"
            className="flex items-center gap-2 group"
          >
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-lavender-400 to-coral-400 text-white"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <span className="text-lg font-bold text-gray-800 tracking-tight group-hover:text-lavender-600 transition-colors">
              DevZ-Go
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors"
            >
              Sign in
            </Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="px-4 py-2.5 bg-gradient-to-r from-lavender-500 to-coral-400 text-white rounded-2xl text-sm font-semibold shadow-md shadow-lavender-500/20 hover:shadow-lg transition-all"
              >
                Get started
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Floating decorative icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-lavender-100/30 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-[350px] h-[350px] bg-coral-100/25 rounded-full blur-[80px]" />
        <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-mint-100/20 rounded-full blur-[60px]" />

        {/* Small whimsical floating icons */}
        <motion.div
          className="absolute top-[20%] left-[10%]"
          animate={{ y: [-6, 6, -6], rotate: [-5, 5, -5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Star className="w-5 h-5 text-peach-300/60" />
        </motion.div>
        <motion.div
          className="absolute top-[15%] right-[12%]"
          animate={{ y: [4, -8, 4], rotate: [3, -3, 3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="w-4 h-4 text-coral-300/50" />
        </motion.div>
        <motion.div
          className="absolute bottom-[25%] left-[8%]"
          animate={{ y: [-4, 6, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Code2 className="w-5 h-5 text-lavender-300/50" />
        </motion.div>
      </div>

      {/* Content */}
      <section className="pt-28 pb-16 px-6 relative">
        <div className="max-w-[1200px] mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3 tracking-tight">
              <span className="text-gray-800">
                {title}
              </span>
              {" "}
              <motion.span
                className="inline-block"
                animate={{ rotate: [0, 14, -8, 14, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
              >
                👋
              </motion.span>
            </h1>
            <p className="text-base text-gray-400">{subtitle}</p>
          </motion.div>
          {children}
        </div>
      </section>
    </div>
  );
}
