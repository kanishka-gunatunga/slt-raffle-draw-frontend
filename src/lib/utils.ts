import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const API_URL = "http://localhost:4000";

export const getImageUrl = (url: string | undefined | null) => {
    if (!url) return undefined;
    if (url.startsWith("http") || url.startsWith("https")) return url;

    // Normalize slashes to forward slashes
    let normalizedPath = url.replace(/\\/g, "/");

    // Ensure leading slash
    if (!normalizedPath.startsWith("/")) {
        normalizedPath = `/${normalizedPath}`;
    }

    return `${API_URL}${normalizedPath}`;
};
