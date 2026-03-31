import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Star, Zap, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ProjectCard } from "../components/ProjectCard";
import { FeedSection } from "../components/FeedSection";
import { fetchProjects, fetchTechStacks } from "../api/projects";
import type { TechStackItem } from "../api/projects";
import { transformApiProject } from "../utils/projectTransform";
import { getApiErrorMessage } from "../utils/apiError";
import type { Project } from "../types/project";

export function LandingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [techStacks, setTechStacks] = useState<TechStackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [projectList, stackList] = await Promise.all([
          fetchProjects(),
          fetchTechStacks(),
        ]);
        if (!cancelled) {
          setProjects(projectList.map((api, i) => transformApiProject(api, i)));
          setTechStacks(stackList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroProject = projects[0] ?? null;
  const feedProjects = projects.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-orange-500/10 to-pink-600/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-[1440px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full border border-blue-500/20 mb-6">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    The future of developer portfolios
                  </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Showcase Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Code. Build Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Future.
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
                  Join the most vibrant community of student developers. Share
                  your projects, discover incredible work, and connect with peers
                  who code at the edge of innovation.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to="/explore"
                    className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all flex items-center gap-3"
                  >
                    <span className="text-lg">Explore Projects</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/add-project"
                    className="px-8 py-4 bg-white text-gray-900 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <span className="text-lg">Submit Your Work</span>
                  </Link>
                </div>

                <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-200">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      12K+
                    </div>
                    <div className="text-sm text-gray-600">Projects</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      8.5K+
                    </div>
                    <div className="text-sm text-gray-600">Developers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">50+</div>
                    <div className="text-sm text-gray-600">Countries</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {loading && (
              <div className="hidden lg:flex items-center justify-center min-h-[320px]">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            )}
            {!loading && heroProject && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-20" />
                <div className="relative">
                  <ProjectCard project={heroProject} variant="hero" />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {techStacks.length > 0 && (
        <section className="px-8 pb-8">
          <div className="max-w-[1440px] mx-auto">
            <p className="text-sm font-medium text-gray-500 mb-3">
              Tech stacks (from API)
            </p>
            <div className="flex flex-wrap gap-2">
              {techStacks.map((t) => (
                <span
                  key={t.id}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-sm border border-gray-200/80"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Projects Section */}
      {error && (
        <section className="py-12 px-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <section className="py-20 px-8">
          <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </section>
      ) : (
        <FeedSection
          projects={feedProjects}
          title="Projects Making Waves"
          subtitle="Trending Now"
        />
      )}

      {/* CTA Section */}
      <section className="py-32 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-[1440px] mx-auto relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-sm text-white">Join 8,500+ developers</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Ready to showcase
              <br />
              your next masterpiece?
            </h2>

            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Share your projects with a global community of developers and get
              the recognition you deserve.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/add-project"
                className="group px-10 py-5 bg-white text-gray-900 rounded-2xl hover:shadow-2xl transition-all flex items-center gap-3"
              >
                <span className="text-lg font-semibold">Submit Your Project</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/explore"
                className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <span className="text-lg">Explore First</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto text-center text-gray-600">
          <p>© 2026 DevZ-Go. Built by developers, for developers.</p>
        </div>
      </footer>
    </div>
  );
}
