import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, Eye, MessageCircle, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { getTechStackChipClasses } from "../utils/techStackChipStyle";
import type { Project } from "../types/project";

interface ProjectCardProps {
  project: Project;
  variant?: "hero" | "featured" | "compact";
}

export function ProjectCard({ project, variant = "compact" }: ProjectCardProps) {
  const techClass = (tech: string) => getTechStackChipClasses(tech, "onDark");

  if (variant === "hero") {
    return (
      <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <Link
          to={`/project/${project.id}`}
          className="group block relative bg-white rounded-3xl shadow-soft-lg overflow-hidden border-2 border-cream-200/60 hover:shadow-soft-xl hover:border-lavender-200/40 transition-all"
        >
          <div className="aspect-video relative overflow-hidden">
            <ImageWithFallback
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2">
                {project.techStack.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className={`backdrop-blur-sm ${techClass(tech)}`}
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-white">{project.title}</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-500 mb-4 text-sm">{project.shortDescription}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{project.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{project.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{project.comments}</span>
                </div>
              </div>
              <span className="text-lavender-500 group-hover:text-lavender-600 flex items-center gap-1 text-sm font-medium">
                View
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === "featured") {
    return (
      <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <Link
          to={`/project/${project.id}`}
          className="group block relative h-full rounded-3xl overflow-hidden bg-white border-2 border-cream-200/60 hover:shadow-soft-xl hover:border-lavender-200/40 transition-all"
        >
          <div className="aspect-[16/10] relative overflow-hidden">
            <ImageWithFallback
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-3">
                <ImageWithFallback
                  src={project.author.avatar}
                  alt={project.author.name}
                  className="w-9 h-9 rounded-full border-2 border-white/40"
                />
                <div>
                  <div className="text-white font-medium text-sm">{project.author.name}</div>
                  <div className="text-white/60 text-xs">
                    @{project.author.username}
                  </div>
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
                {project.title}
              </h3>
              <p className="text-white/80 text-sm mb-3 max-w-xl line-clamp-2">
                {project.shortDescription}
              </p>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {project.techStack.map((tech) => (
                  <span key={tech} className={`backdrop-blur-sm ${techClass(tech)}`}>
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-5 text-white/60 text-sm">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  <span>{project.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{project.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>{project.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // ── Compact variant ──
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link
        to={`/project/${project.id}`}
        className="group block relative h-full rounded-2xl overflow-hidden bg-white border-2 border-cream-200/60 hover:shadow-soft-xl hover:border-lavender-200/40 transition-all"
      >
        <div className="aspect-[4/3] relative overflow-hidden">
          <ImageWithFallback
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <h3 className="text-xl font-bold text-white mb-1.5">{project.title}</h3>
            <p className="text-white/75 text-xs mb-2.5 line-clamp-2">
              {project.shortDescription}
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              {project.techStack.slice(0, 2).map((tech) => (
                <span
                  key={tech}
                  className={`rounded-lg text-[10px] backdrop-blur-sm ${techClass(tech)} px-2 py-0.5`}
                >
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-white/60 text-xs">
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span>{project.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{project.views.toLocaleString()}</span>
              </div>
              {project.author.username && (
                <div className="flex items-center gap-1">
                  <span>@{project.author.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
