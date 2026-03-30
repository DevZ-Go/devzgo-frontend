import { Link } from "react-router-dom";
import { motion } from "motion/react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            to="/home"
            className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            DevZ-Go
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-orange-500/10 to-pink-600/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <section className="pt-32 pb-20 px-8 relative">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
            <p className="text-lg text-gray-600">{subtitle}</p>
          </motion.div>
          {children}
        </div>
      </section>
    </div>
  );
}
