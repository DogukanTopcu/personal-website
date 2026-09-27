"use client";

import { deleteMediaRow, insertMedia, kindOfMime, type MediaAsset } from "@/lib/data/media";
import { MAX_UPLOAD_BYTES, MEDIA_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { formatBytes } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { getBrowserClient } from "@/lib/supabase/client";

export class UploadError extends Error {}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/flac": "flac",
  "application/pdf": "pdf",
};

function randomChars(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/** `YYYY/MM/<slugified-name>-<6 random chars>.<ext>` */
export function buildStoragePath(file: File, now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const dot = file.name.lastIndexOf(".");
  const base = dot > 0 ? file.name.slice(0, dot) : file.name;
  const rawExt = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  const ext = /^[a-z0-9]{1,8}$/.test(rawExt) ? rawExt : (EXT_BY_MIME[file.type] ?? "bin");

  const name = slugify(base).slice(0, 60) || "file";
  return `${year}/${month}/${name}-${randomChars(6)}.${ext}`;
}

/** Does the file satisfy an `accept` string such as "image/*,application/pdf"? */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const mime = file.type.toLowerCase();
  const ext = file.name.includes(".") ? `.${file.name.split(".").pop()!.toLowerCase()}` : "";
  return accept.split(",").some((token) => {
    const rule = token.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return rule === ext;
    if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1));
    return rule === mime;
  });
}

export function validateFile(file: File, accept?: string): string | null {
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return `This file is ${formatBytes(file.size)}. The limit is 50 MB.`;
  if (!matchesAccept(file, accept)) return "This type of file cannot be used here.";
  return null;
}

type Dimensions = { width: number | null; height: number | null };

/** Pixel size of an image or video, read in the browser before upload. */
export function readDimensions(file: File): Promise<Dimensions> {
  const none: Dimensions = { width: null, height: null };
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return Promise.resolve(none);

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const done = (result: Dimensions) => {
      URL.revokeObjectURL(url);
      resolve(result.width && result.height ? result : none);
    };

    if (file.type.startsWith("image/")) {
      const image = new Image();
      image.onload = () => done({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => done(none);
      image.src = url;
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => done({ width: video.videoWidth, height: video.videoHeight });
    video.onerror = () => done(none);
    video.src = url;
  });
}

type StorageErrorBody = { statusCode?: string | number; error?: string; message?: string };

function describeStorageError(status: number, body: string): string {
  let parsed: StorageErrorBody = {};
  try {
    parsed = JSON.parse(body) as StorageErrorBody;
  } catch {
    // Not JSON.
  }
  const message = parsed.message ?? "";
  if (status === 413 || /exceeded|too large|maximum size/i.test(message)) return "The storage bucket rejected the file as too large (50 MB limit).";
  if (status === 415 || /mime type/i.test(message)) return "The storage bucket does not accept this type of file.";
  if (status === 401 || status === 403 || /row-level security|not authorized|unauthorized/i.test(message)) {
    return "Upload refused. Only admins can add media; sign in again if your session ended.";
  }
  if (status === 409 || /already exists/i.test(message)) return "A file with this name already exists. Try again.";
  return message ? `Upload failed: ${message}` : `Upload failed (HTTP ${status}).`;
}

type UploadOptions = {
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

/**
 * Sends the file to the `media` bucket the way supabase-js does (multipart
 * with a `cacheControl` field, `x-upsert: false`), but through XHR so the
 * caller gets progress events.
 */
function putObject(file: File, path: string, token: string, options: UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${SUPABASE_URL}/storage/v1/object/${MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

    xhr.open("POST", url);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError(describeStorageError(xhr.status, xhr.responseText)));
    };
    xhr.onerror = () => reject(new UploadError("The upload could not reach the storage server."));
    xhr.onabort = () => reject(new UploadError("Upload cancelled."));

    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    const body = new FormData();
    body.append("cacheControl", "31536000");
    body.append("", file, file.name);
    xhr.send(body);
  });
}

export function publicUrl(path: string): string {
  return getBrowserClient().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Uploads one file and records it in `media_assets`. Throws UploadError with a readable message. */
export async function uploadFile(file: File, options: UploadOptions = {}, accept?: string): Promise<MediaAsset> {
  const problem = validateFile(file, accept);
  if (problem) throw new UploadError(problem);

  const supabase = getBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new UploadError("Your session has ended. Sign in again, then retry.");

  const [path, dimensions] = await Promise.all([buildStoragePath(file), readDimensions(file)]);
  await putObject(file, path, session.access_token, options);

  const { data, error } = await insertMedia(supabase, {
    path,
    url: publicUrl(path),
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    width: dimensions.width,
    height: dimensions.height,
    alt: "",
  });

  if (error || !data) {
    // Do not leave an orphan in the bucket.
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw new UploadError(`The file was uploaded but could not be recorded: ${error?.message ?? "unknown error"}`);
  }

  options.onProgress?.(1);
  return data;
}

/** Removes the storage object, then the library row. */
export async function deleteAsset(asset: Pick<MediaAsset, "id" | "path">): Promise<void> {
  const supabase = getBrowserClient();
  const removed = await supabase.storage.from(MEDIA_BUCKET).remove([asset.path]);
  if (removed.error) throw new UploadError(`Could not delete the file: ${removed.error.message}`);
  const { error } = await deleteMediaRow(supabase, asset.id);
  if (error) throw new UploadError(`The file is gone but its entry could not be removed: ${error.message}`);
}

/** Markdown for a library entry. Media files become players on the site. */
export function markdownFor(asset: Pick<MediaAsset, "url" | "alt" | "mime_type" | "path">, caption = ""): string {
  const kind = kindOfMime(asset.mime_type);
  const name = asset.path.split("/").pop() ?? asset.path;
  const alt = asset.alt || (kind === "image" ? "" : name);
  if (kind === "image" || kind === "video" || kind === "audio") {
    return caption ? `![${alt}](${asset.url} "${caption.replace(/"/g, "'")}")` : `![${alt}](${asset.url})`;
  }
  return `[${alt || name}](${asset.url})`;
}
