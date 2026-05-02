import {
  DoorOpen,
  Package,
  FileText,
  Puzzle,
  StickyNote,
  ClipboardCheck,
} from "lucide-react";

export const CATEGORIES: Record<
  string,
  { label: string; icon?: typeof DoorOpen; color: string }
> = {
  allgemein: { label: "Allgemein", icon: StickyNote, color: "bg-gray-900/50 text-gray-300 border-gray-700" },
};

export function getCategoryConfig(category: string) {
  if (CATEGORIES[category]) return CATEGORIES[category];
  
  // Dynamic fallback based on keywords or just default
  const lower = category.toLowerCase();
  if (lower.includes("noten")) return { label: category, icon: FileText, color: "bg-emerald-900/50 text-emerald-300 border-emerald-700" };
  if (lower.includes("exam") || lower.includes("prüfung")) return { label: category, icon: ClipboardCheck, color: "bg-orange-900/50 text-orange-300 border-orange-700" };
  if (lower.includes("raum") || lower.includes("zimmer")) return { label: category, icon: DoorOpen, color: "bg-blue-900/50 text-blue-300 border-blue-700" };
  if (lower.includes("item") || lower.includes("objekt")) return { label: category, icon: Package, color: "bg-zinc-900/50 text-zinc-300 border-zinc-700" };
  if (lower.includes("rätsel") || lower.includes("puzzle")) return { label: category, icon: Puzzle, color: "bg-purple-900/50 text-purple-300 border-purple-700" };
  
  return { label: category, icon: undefined, color: "bg-gray-800/50 text-gray-300 border-gray-600" };
}
