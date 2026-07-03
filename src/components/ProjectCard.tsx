import React from "react";
import { Project } from "../types";
import { Github, ExternalLink, Calendar, Cpu } from "lucide-react";

interface ProjectCardProps {
  key?: React.Key;
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Graceful fallback for missing project images
  const defaultImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
  const imageSrc = project.projectImage || defaultImage;

  return (
    <div className="glass-card flex flex-col h-full rounded-2xl overflow-hidden group hover:border-violet-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/5 hover:-translate-y-1.5">
      {/* Project Image */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        <img
          src={imageSrc}
          alt={project.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Category Tag overlay */}
        <div className="absolute top-4 left-4 bg-zinc-900/80 dark:bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono tracking-widest uppercase font-semibold px-2.5 py-1 rounded-full shadow-sm">
          {project.category}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-grow p-6">
        {/* Date badge */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono mb-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{project.date}</span>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 line-clamp-3 leading-relaxed flex-grow">
          {project.description}
        </p>

        {/* Technologies List */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          {project.technologies.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium font-mono rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/30 dark:border-zinc-800/30"
            >
              <Cpu className="w-2.5 h-2.5 text-violet-500" />
              {tech}
            </span>
          ))}
          {project.technologies.length > 5 && (
            <span className="px-2 py-1 text-[11px] font-medium font-mono rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
              +{project.technologies.length - 5}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-5 pt-3">
          {project.githubLink && (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-sm"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          )}
          {project.liveDemoLink && (
            <a
              href={project.liveDemoLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white hover:shadow-md hover:shadow-violet-600/10 transition-all ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Demo</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
