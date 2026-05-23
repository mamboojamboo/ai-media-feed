import { z } from "zod";

export const mediaSourceSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive().optional(),
  url: z.url(),
  mimeType: z.string().min(1).optional(),
});

export const mediaItemSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["image", "video"]),
    title: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    aspectRatio: z.number().positive(),
    sources: z.array(mediaSourceSchema).min(1),
    posterSources: z.array(mediaSourceSchema).optional(),
    durationMs: z.number().int().positive().optional(),
    tags: z.array(z.string().min(1)),
  })
  .superRefine((item, ctx) => {
    const expectedAspectRatio = item.width / item.height;
    const diff = Math.abs(expectedAspectRatio - item.aspectRatio);

    if (diff > 0.02) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `aspectRatio does not match width / height for item ${item.id}`,
        path: ["aspectRatio"],
      });
    }

    if (item.type === "video" && !item.posterSources?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "video item should provide posterSources",
        path: ["posterSources"],
      });
    }
  });

export const mediaFeedSchema = z.array(mediaItemSchema);
