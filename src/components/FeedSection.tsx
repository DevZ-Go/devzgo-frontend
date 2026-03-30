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

export function FeedSection({
  projects,
  title = "Projects Making Waves",
  subtitle = "Trending Now",
}: FeedSectionProps) {
  const [featuredProject, ...smallerProjects] = projects;

  return (
    <section className="py-20 px-8 relative">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
                {subtitle}
              </span>
            </div>
            <h2 className="text-5xl font-black text-gray-900">{title}</h2>
          </div>
          <Link
            to="/explore"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <span>View all projects</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {featuredProject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 md:row-span-2"
            >
              <ProjectCard project={featuredProject} variant="featured" />
            </motion.div>
          )}

          {smallerProjects.slice(0, 2).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
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
