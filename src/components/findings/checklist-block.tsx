"use client";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import type { CustomContentBlock } from "@/lib/types";

interface ChecklistBlockProps {
  block: Extract<CustomContentBlock, { type: "checklist" }>;
  blockIndex: number;
  findingId: string;
}

export function ChecklistBlock({ block, blockIndex, findingId }: ChecklistBlockProps) {
  async function toggleItem(itemIndex: number) {
    const docRef = doc(db, "findings", findingId);
    const newChecked = !block.items[itemIndex].checked;
    const fieldPath = `customContent.${blockIndex}.items.${itemIndex}.checked`;

    // Firestore doesn't support array-index field paths, so we update the whole customContent
    // We need to read the current block, modify it, and write back
    const updatedItems = block.items.map((item, i) =>
      i === itemIndex ? { ...item, checked: newChecked } : item
    );

    // We can't do a partial array update, so we'll rely on the parent to have the full customContent
    // Instead, use a transaction-free approach by updating the specific item
    // Actually, let's just update the full document field
    await updateDoc(docRef, {
      [`customContent`]: undefined, // placeholder
    }).catch(() => {});

    // Better approach: fetch and update
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const customContent = [...(data.customContent || [])];
    if (customContent[blockIndex]?.type === "checklist") {
      customContent[blockIndex] = {
        ...customContent[blockIndex],
        items: updatedItems,
      };
      await updateDoc(docRef, { customContent, updatedAt: new Date() });
    }
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">{block.title}</h4>
      <div className="space-y-1.5">
        {block.items.map((item, i) => (
          <label
            key={item.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors"
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => toggleItem(i)}
            />
            <span className={item.checked ? "line-through text-muted-foreground" : ""}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
