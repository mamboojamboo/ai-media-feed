# Justified Mixed Media Feed

A virtualized AI media feed with 2,000 mixed image/video items laid out as justified rows.

## Setup

This repository is locked with `pnpm`:

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

To regenerate the local fixture from Pexels, put `PEXELS_API_KEY` in `.env.local` and run:

```bash
pnpm generate:dataset
```

For parity with npm-based review environments, the scripts are standard Next scripts:

```bash
npm install
npm run dev
npm run build
```

## What Is Implemented

- Custom justified-row layout algorithm without relying on CSS masonry or grid shortcuts.
- Full feed rendering for 2,000 mixed media items, virtualized at the row level with TanStack Virtual.
- User-controlled layout density with (`2, 3, 4, 5, 6, 8`) items per row.
- Item-based scroll anchoring, so the current viewport position is preserved when the layout density changes.
- Lazy and proximity-based media loading to avoid loading unnecessary images and videos.
- Viewport-driven video playback, so videos only play when they are relevant to the visible area.
- Velocity-based fast-scroll handling to keep scrolling smooth during rapid navigation.
- Bounded browser-side object URL media cache for loaded media resources.
- Video playback state preservation for cached media.
- Right-sized image and poster source selection based on the rendered item size.
- Resize handling with `ResizeObserver` and `requestAnimationFrame`.
- Scroll anchor restoration after resize and layout recalculation.

## Why Next.js 16

Next.js is used for the app shell, server-side dataset loading, runtime validation, caching boundary, and easy review deployment. The feed itself is a client component because virtualization, viewport media playback, resize handling, and media cache are browser-side concerns.

The root route is a Server Component (`src/app/page.tsx`) that calls `getMediaFeed()`. The interactive feed starts below that boundary as a client island.

## Dataset

The static dataset lives at `src/shared/data/media-dataset.json` and contains 2,000 items:

- 1,400 images, 600 videos.
- Images use deterministic seeded Picsum URLs such as `https://picsum.photos/seed/{seed}/{width}/{height}` to avoid missing arbitrary image IDs.
- Videos come from the Pexels Videos API, are capped at 30 seconds, and are written to the local JSON fixture only after each direct MP4 URL passes a ranged `video/*` fetch check.
- Video posters use Pexels poster images with multiple width buckets and clean query parameters, so they are right-sized without forcing a cropped height.
- The UI includes a visible Pexels attribution link in the sticky header.
- Aspect ratios are generated from realistic families: `1:1`, `4:5`, `3:4`, `9:16`, `16:9`, `21:9`, plus small variations.

The dataset was generated deterministically for images and from a verified short Pexels video pool for video items. The current fixture uses 120 verified Pexels videos capped at 30 seconds across 600 video cards, with 360 unique encoded video URLs. Reuse is intentional and bounded: the project is about layout, virtualization, media lifecycle, cache boundaries, and playback state, not about storing hundreds of local video files in the repository.

## Architecture

The code is FSD-inspired:

- `src/app`: Next.js App Router shell.
- `src/views/media-feed`: route composition layer. It is named `views` instead of `pages` to avoid colliding with Next's Pages Router folder convention.
- `src/widgets/media-feed`: feed composition, header, debug panel.
- `src/entities/media`: media schema, types, data access, source picking.
- `src/features/justified-media-feed`: layout algorithm, virtualization, rows, cards, resize, scroll anchor, scroll velocity.
- `src/features/feed-density-control`: density UI and model.
- `src/features/viewport-video-playback`: viewport playback hook and thresholds.
- `src/shared/media-cache`: browser-side cache infrastructure.
- `src/shared/ui`: shadcn-style local UI primitives.

`getMediaFeed()` uses `use cache`, `cacheLife("max")`, and Zod runtime validation. The schema checks required fields, non-empty sources, video posters, positive dimensions, and aspect ratio consistency.

## Layout Algorithm

`computeJustifiedRows(items, options)` is a pure function with no React or DOM dependencies.

It accumulates items until the projected row is close to the target density, then computes:

```ts
availableWidth = containerWidth - gap * (items.length - 1);
rowHeight = availableWidth / sumAspectRatios;
```

Each item width is `rowHeight * aspectRatio`, so the original aspect ratio is preserved without crop. Full rows fill the container width; the last row is capped by `targetRowHeight` and `maxLastRowHeight`, so a sparse final row is allowed to be shorter instead of being stretched into a giant row.

## Virtualization

TanStack Virtual handles generic scroll virtualization. It does not compute justified rows. The app first computes rows using a custom layout algorithm, then virtualizes those rows.

The virtualizer count is `rows.length`, not `items.length`. Rendered DOM stays bounded because only visible/overscan rows mount, and each row renders only its own media cards.

## Scroll Anchoring

Density changes and resize do not preserve raw `scrollTop`. Instead, the feed captures an item near the top of the viewport:

```ts
type ScrollAnchor = {
  itemId: string;
  offsetTopInViewport: number;
};
```

After rows are recomputed, the app finds the new top for the same item and restores `scrollTop = newItemTop - offsetTopInViewport` inside a layout effect. The same mechanism is wired into ResizeObserver updates.

## Media Loading And Playback

Cards have proximity stages: `far`, `near`, and `visible`.

- `far`: no image/video source is attached; a lightweight placeholder renders.
- `near`: images and video posters can be fetched and cached.
- `visible`: video may attach its MP4 source and play if scroll velocity is calm.

Video playback is viewport-driven:

- `VIDEO_PLAY_THRESHOLD = 0.45`
- `VIDEO_PAUSE_THRESHOLD = 0.25`
- videos are `muted`, `playsInline`, and `loop`
- `video.play()` promise rejections are handled
- `currentTime`, metadata, can-play state, and status are saved to the cache on pause/unmount

Multiple visible videos may play at once. During fast scroll, new videos are not started.

## Media Cache

The app uses a bounded object URL media cache for loaded images and video posters, and it preserves video playback state across virtualization. The cache is LRU-limited to avoid unbounded memory growth. MP4 files are not copied into app-managed blobs; the `<video>` element uses the selected Pexels URL directly and relies on the browser HTTP cache for media bytes.

Current limits:

- `maxBytes`: 150 MB
- `maxImageEntries`: 300
- `maxPosterEntries`: 300

On eviction, object URLs are revoked with `URL.revokeObjectURL()`. The app does not try to preserve decoded browser frames; it preserves controlled image/poster object URLs, loaded state, and video playback state.

## Right-Sized Media

Images and posters use width buckets:

```ts
[320, 480, 640, 960, 1280, 1600];
```

Requested width is based on `cellWidth * devicePixelRatio`. If the cache already has an asset with `bestLoadedWidth >= requestedWidth`, that object URL is reused. Otherwise the next larger source is fetched and cached.

For videos, source selection supports multiple encoded widths when Pexels provides them. Right-sized behavior is complete for images/posters and structurally supported for video sources, with the final MP4 choice constrained by the encodes available from the API.

## Fast-Scroll Grace

`useScrollVelocity()` tracks `px/ms` and direction on the feed scroll container. If absolute velocity is above `1.5 px/ms`, the feed enters fast-scroll mode:

- new videos do not start
- new video sources are not attached just because an item flashes through the viewport
- already-attached video sources stay attached to avoid visual jumps
- uncached media loading is deferred while the virtualizer is actively scrolling and resumes after a short idle grace
- cached posters/images can still render

The debug panel shows velocity and fast-scroll state.

## Skipped Stretch Goals

I intentionally skipped full FLIP transitions for column-count changes because preserving virtualization correctness, scroll anchoring, and resize stability was more important for this project.

The scroll-anchor mechanism could be reused for prepend scenarios, but I did not add a live-data demo to avoid feature creep.

## Known Issues / Next Steps

- Browser-level visual verification depends on a local browser automation tool. The code has been verified with `pnpm lint`, `pnpm build`, and local HTTP rendering.
- Public sample MP4s can be slow depending on network and CDN behavior. The renderer avoids eager video blob downloads for that reason.
- A production product could add a small integration test around row geometry and anchor restore.
