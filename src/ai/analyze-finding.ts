import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { z } from "genkit";
import { SYSTEM_PROMPT, buildAnalysisPrompt } from "./prompts";

const ai = genkit({ plugins: [googleAI()] });

const ChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  checked: z.boolean(),
});

const CustomContentBlockSchema = z.union([
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({
    type: z.literal("checklist"),
    title: z.string(),
    items: z.array(ChecklistItemSchema),
  }),
  z.object({
    type: z.literal("table"),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    content: z.string(),
  }),
]);

const FindingOutputSchema = z.object({
  title: z.string(),
  category: z.string(),
  description: z.string().optional(),
  extractedText: z.string().optional(),
  tags: z.array(z.string()),
  customContent: z.array(CustomContentBlockSchema).optional(),
});

export type FindingOutput = z.infer<typeof FindingOutputSchema>;

export const analyzeFinding = ai.defineFlow(
  {
    name: "analyzeFinding",
    inputSchema: z.object({
      imageBase64: z.string(),
      mimeType: z.string(),
      customPrompt: z.string().optional(),
    }),
    outputSchema: FindingOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      system: SYSTEM_PROMPT,
      prompt: [
        {
          media: {
            contentType: input.mimeType as "image/jpeg" | "image/png" | "image/webp",
            url: `data:${input.mimeType};base64,${input.imageBase64}`,
          },
        },
        { text: buildAnalysisPrompt(input.customPrompt) },
      ],
      output: { schema: FindingOutputSchema },
    });
    return response.output!;
  }
);
