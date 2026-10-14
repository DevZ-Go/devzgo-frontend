import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { TrendingUp, ArrowRight } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "../types/project";

interface FeedSectionProps {
  projects: Project[];
  title?: string;
  subtitle?: string;
}

const bouncy = { type: "spring" as const, stiffness: 300, damping: 22 };

export function FeedSection({
  projects,
  title = "Projects Making Waves 🌊",
  subtitle = "Trending Now",
}: FeedSectionProps) {
  const [featuredProject, ...smallerProjects] = projects;

  return (
    <section className="py-16 px-6 md:px-8 relative">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <TrendingUp className="w-5 h-5 text-coral-400" />
              </motion.div>
              <span className="text-xs font-bold text-coral-400 uppercase tracking-widest">
                {subtitle}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
              {title}
            </h2>
          </div>
          <motion.div whileHover={{ x: 4 }}>
            <Link
              to="/explore"
              className="group flex items-center gap-2 text-sm font-semibold text-lavender-500 hover:text-lavender-600 transition-colors"
            >
              View all projects
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {featuredProject && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ ...bouncy, delay: 0.1 }}
              className="md:col-span-8 md:row-span-2"
            >
              <ProjectCard project={featuredProject} variant="featured" />
            </motion.div>
          )}

          {smallerProjects.slice(0, 2).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ ...bouncy, delay: 0.2 + index * 0.1 }}
              className="md:col-span-4"
            >
              <ProjectCard project={project} variant="compact" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
