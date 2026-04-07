import { Link } from "react-router-dom";
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
      <Link
        to={`/project/${project.id}`}
        className="group block relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 hover:shadow-2xl transition-all"
      >
        <div className="aspect-video relative overflow-hidden">
          <ImageWithFallback
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
          <p className="text-gray-600 mb-4">{project.shortDescription}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{project.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{project.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{project.comments}</span>
              </div>
            </div>
            <span className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View Project
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        to={`/project/${project.id}`}
        className="group block relative h-full rounded-3xl overflow-hidden bg-white border border-gray-200/50 hover:shadow-2xl transition-all"
      >
        <div className="aspect-[16/10] relative overflow-hidden">
          <ImageWithFallback
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="flex items-center gap-3 mb-4">
              <ImageWithFallback
                src={project.author.avatar}
                alt={project.author.name}
                className="w-10 h-10 rounded-full border-2 border-white/50"
              />
              <div>
                <div className="text-white font-medium">{project.author.name}</div>
                <div className="text-white/70 text-sm">
                  @{project.author.username}
                </div>
              </div>
            </div>
            <h3 className="text-4xl font-black text-white mb-3">{project.title}</h3>
            <p className="text-white/90 text-lg mb-4 max-w-2xl">
              {project.shortDescription}
            </p>
            <div className="flex items-center gap-2 mb-4">
              {project.techStack.map((tech) => (
                <span key={tech} className={`backdrop-blur-sm ${techClass(tech)}`}>
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-6 text-white/80">
              <div className="flex items-center gap-1.5">
                <Heart className="w-5 h-5" />
                <span>{project.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-5 h-5" />
                <span>{project.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-5 h-5" />
                <span>{project.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/project/${project.id}`}
      className="group block relative h-full rounded-2xl overflow-hidden bg-white border border-gray-200/50 hover:shadow-xl transition-all"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <ImageWithFallback
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
          <p className="text-white/80 text-sm mb-3 line-clamp-2">
            {project.shortDescription}
          </p>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {project.techStack.slice(0, 2).map((tech) => (
              <span
                key={tech}
                className={`rounded-lg text-[11px] backdrop-blur-sm ${techClass(tech)} px-2 py-1`}
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{project.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
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
  );
}
