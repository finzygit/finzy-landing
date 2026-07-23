import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classi condizionali (clsx) risolvendo i conflitti Tailwind (tailwind-merge).
 * Uso: cn("px-2", condition && "px-4", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
