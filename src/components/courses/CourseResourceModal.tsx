"use client";

import React, { useState } from "react";
import { X, Link2, Book, FileText, FolderGit2 } from "lucide-react";
import { CourseResource, Course } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface CourseResourceModalProps {
  isOpen: boolean;
  course: Course;
  onClose: () => void;
  onSave: (resource: Omit<CourseResource, "id">) => void;
}

export const CourseResourceModal: React.FC<CourseResourceModalProps> = ({
  isOpen,
  course,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<CourseResource["type"]>("notes");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError("Please fill in both title and URL");
      return;
    }

    onSave({
      title: title.trim(),
      url: url.trim(),
      type,
    });

    setTitle("");
    setUrl("");
    setType("notes");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-spy-surface border border-spy-border rounded-[6px] p-5 sm:p-6 text-spy-text shadow-2xl font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-spy-green" />
            <h3 className="text-sm font-semibold text-spy-text font-mono">
              ADD COURSE RESOURCE &middot; {course.code}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-spy-muted hover:text-spy-text p-1"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-[4px] bg-spy-redMuted border border-spy-red/30 text-xs text-spy-red font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              Resource Title
            </label>
            <input
              type="text"
              placeholder="e.g. xv6 RISC-V Source Commentary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              URL / Link
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-spy-muted mb-1">
              Resource Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "notes", label: "Notes", icon: <FileText className="w-3.5 h-3.5" /> },
                { type: "book", label: "Book", icon: <Book className="w-3.5 h-3.5" /> },
                { type: "slides", label: "Slides", icon: <FolderGit2 className="w-3.5 h-3.5" /> },
                { type: "syllabus", label: "Syllabus", icon: <FileText className="w-3.5 h-3.5" /> },
                { type: "drive", label: "Drive", icon: <Link2 className="w-3.5 h-3.5" /> },
                { type: "link", label: "Link", icon: <Link2 className="w-3.5 h-3.5" /> },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type as CourseResource["type"])}
                  className={`py-1.5 px-2 rounded-[3px] border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${
                    type === item.type
                      ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green font-bold"
                      : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-spy-border">
            <Button type="button" variant="stealth" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Resource
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

