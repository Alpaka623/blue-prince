"use client";

import type { CustomContentBlock } from "@/lib/types";
import { ChecklistBlock } from "./checklist-block";

interface ContentRendererProps {
  blocks: CustomContentBlock[];
  findingId: string;
  inviteCode: string;
}

export function ContentRenderer({ blocks, findingId, inviteCode }: ContentRendererProps) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (!block) return null;
        
        switch (block.type) {
          case "heading":
            const Tag = `h${block.level}` as "h1" | "h2" | "h3";
            const sizes = { 1: "text-xl font-bold", 2: "text-lg font-semibold", 3: "text-base font-semibold" };
            return (
              <Tag key={index} className={sizes[block.level]}>
                {block.content}
              </Tag>
            );
          case "text":
            return (
              <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                {block.content}
              </p>
            );
          case "checklist":
            if (!block.items || !Array.isArray(block.items)) return null;
            return (
              <ChecklistBlock
                key={index}
                block={block}
                blockIndex={index}
                findingId={findingId}
                inviteCode={inviteCode}
              />
            );
          case "table":
            if (!block.headers || !Array.isArray(block.headers)) return null;
            if (!block.rows || !Array.isArray(block.rows)) return null;
            return (
              <div key={index} className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      {block.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => {
                      if (!Array.isArray(row)) return null;
                      return (
                        <tr key={ri} className="border-t border-border">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
