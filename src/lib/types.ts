import type { Timestamp } from "firebase/firestore";

export type FindingCategory = string;

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export type CustomContentBlock =
  | { type: "text"; content: string }
  | { type: "checklist"; title: string; items: ChecklistItem[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "heading"; level: 1 | 2 | 3; content: string };

export interface Finding {
  id: string;
  imageUrl: string;
  imagePath: string;
  title: string;
  category: FindingCategory;
  description: string;
  extractedText?: string;
  tags: string[];
  customContent?: CustomContentBlock[];
  notes?: string;
  room?: string;
  customPrompt?: string;
  aiRawResponse?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
