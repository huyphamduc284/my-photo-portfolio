const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 20 * 1024 * 1024;

export type ImagePreview = {
  file: File;
  url: string;
  width: number;
  height: number;
};

export function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "this file isn't a jpeg, png, or webp.";
  }
  if (file.size > MAX_BYTES) {
    return "this photograph is too large.";
  }
  return null;
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(url);
      if (!width || !height) {
        reject(new Error("couldn't read this photograph."));
        return;
      }
      resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("couldn't read this photograph."));
    };
    image.src = url;
  });
}

function safeFilename(name: string) {
  const trimmed = name.trim() || "photograph";
  const cleaned = trimmed.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return cleaned.toLowerCase();
}

export function storagePathForDate(date: string, file: File) {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  const year = match?.[1] ?? String(new Date().getFullYear());
  const month = match?.[2] ?? String(new Date().getMonth() + 1).padStart(2, "0");
  return `${year}/${month}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
}
