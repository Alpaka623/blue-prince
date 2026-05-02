import {
  DoorOpen,
  Package,
  FileText,
  Puzzle,
  Search,
  User,
  Map,
  ClipboardCheck,
  StickyNote,
  HelpCircle,
} from "lucide-react";
import type { FindingCategory } from "./types";

export const CATEGORIES: Record<
  FindingCategory,
  { label: string; icon: typeof DoorOpen; color: string }
> = {
  room: { label: "Raum", icon: DoorOpen, color: "bg-blue-900/50 text-blue-300 border-blue-700" },
  item: { label: "Item", icon: Package, color: "bg-amber-900/50 text-amber-300 border-amber-700" },
  document: { label: "Dokument", icon: FileText, color: "bg-emerald-900/50 text-emerald-300 border-emerald-700" },
  puzzle: { label: "Puzzle", icon: Puzzle, color: "bg-purple-900/50 text-purple-300 border-purple-700" },
  clue: { label: "Hinweis", icon: Search, color: "bg-rose-900/50 text-rose-300 border-rose-700" },
  character: { label: "Charakter", icon: User, color: "bg-cyan-900/50 text-cyan-300 border-cyan-700" },
  map: { label: "Karte", icon: Map, color: "bg-teal-900/50 text-teal-300 border-teal-700" },
  exam: { label: "Prüfung", icon: ClipboardCheck, color: "bg-orange-900/50 text-orange-300 border-orange-700" },
  note: { label: "Notiz", icon: StickyNote, color: "bg-yellow-900/50 text-yellow-300 border-yellow-700" },
  other: { label: "Sonstiges", icon: HelpCircle, color: "bg-gray-800/50 text-gray-300 border-gray-600" },
};
