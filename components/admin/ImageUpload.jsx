"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Reusable image upload widget for admin forms.
 *
 * Props:
 *   value      {string|null}  current image URL (controlled)
 *   onChange   {fn}           called with new URL (or null on remove)
 *   label      {string}       optional label above the widget
 */
export default function ImageUpload({ value, onChange, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;

    // Client-side guard (server validates too)
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG or WebP allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      onChange(url);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-picked
    e.target.value = "";
  }

  return (
    <div>
      {label && <p className="text-slate-400 text-xs mb-1">{label}</p>}

      {value ? (
        <div className="relative inline-block">
          <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-slate-600">
            <Image
              src={value}
              alt="Question image"
              fill
              sizes="192px"
              className="object-contain bg-slate-900"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 rounded-full p-0.5 transition-colors"
            title="Remove image"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className="w-48 h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-slate-800/40 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-slate-500" />
              <span className="text-slate-500 text-xs text-center px-2">
                Click or drop<br />JPEG / PNG / WebP · 2MB
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
