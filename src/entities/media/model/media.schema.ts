import { z } from "zod";

export const mediaSourceSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive().optional(),
  url: z.url(),
  mimeType: z.string().min(1).optional(),
});

const mediaItemBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: z.number().positive(),
  sources: z.array(mediaSourceSchema).nonempty(),
  tags: z.array(z.string().min(1)),
});

const imageMediaItemSchema = mediaItemBaseSchema.extend({
  type: z.literal("image"),
});

const videoMediaItemSchema = mediaItemBaseSchema.extend({
  type: z.literal("video"),
  posterSources: z.array(mediaSourceSchema).nonempty(),
  durationMs: z.number().int().positive().optional(),
});

export const mediaItemSchema = z
  .discriminatedUnion("type", [imageMediaItemSchema, videoMediaItemSchema])
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
  });

export const mediaFeedSchema = z.array(mediaItemSchema);
