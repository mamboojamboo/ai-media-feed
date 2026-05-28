import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "src/shared/data/media-dataset.json");
const TOTAL_ITEMS = 2000;
const VIDEO_RATIO_PER_TEN = 3;
const SIZE_BUCKETS = [320, 480, 640, 960, 1280, 1600];
const TARGET_PEXELS_VIDEOS = Number(process.env.PEXELS_VIDEO_POOL_SIZE ?? 120);
const PEXELS_PER_PAGE = 80;
const PEXELS_PAGES_PER_QUERY = Number(process.env.PEXELS_PAGES_PER_QUERY ?? 4);
const MAX_PEXELS_VIDEO_DURATION_SECONDS = Number(
  process.env.PEXELS_MAX_VIDEO_DURATION_SECONDS ?? 30,
);
const PEXELS_ENDPOINT = "https://api.pexels.com/v1/videos/search";

const BASE_RATIOS = [
  { label: "square", ratio: 1 },
  { label: "portrait-4-5", ratio: 4 / 5 },
  { label: "portrait-3-4", ratio: 3 / 4 },
  { label: "story-9-16", ratio: 9 / 16 },
  { label: "landscape-16-9", ratio: 16 / 9 },
  { label: "cinematic-21-9", ratio: 21 / 9 },
  { label: "wide-3-2", ratio: 3 / 2 },
  { label: "classic-4-3", ratio: 4 / 3 },
];

const TAGS = [
  "cinematic",
  "prompt",
  "motion",
  "editorial",
  "studio",
  "generated",
  "portrait",
  "landscape",
  "concept",
  "social",
];

const PEXELS_QUERIES = [
  { query: "abstract motion", orientation: "landscape" },
  { query: "cinematic city", orientation: "landscape" },
  { query: "technology", orientation: "landscape" },
  { query: "nature macro", orientation: "landscape" },
  { query: "ocean", orientation: "landscape" },
  { query: "fashion portrait", orientation: "portrait" },
  { query: "people creative", orientation: "portrait" },
  { query: "architecture", orientation: "portrait" },
  { query: "neon lights", orientation: "portrait" },
  { query: "art texture", orientation: "square" },
  { query: "food", orientation: "square" },
  { query: "studio product", orientation: "square" },
];

function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const text = fs.readFileSync(filePath, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key]) {
      continue;
    }

    process.env[key] = rawValue
      .trim()
      .replace(/^['"]/, "")
      .replace(/['"]$/, "");
  }
}

function loadLocalEnv() {
  readDotEnvFile(path.join(ROOT, ".env.local"));
  readDotEnvFile(path.join(ROOT, ".env"));
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260523);

function pick(array) {
  return array[Math.floor(random() * array.length)];
}

function normalizeAspectRatio(width, height) {
  return Math.round((width / height) * 1000) / 1000;
}

function imageSources(seed, ratio) {
  return SIZE_BUCKETS.map((width) => {
    const height = Math.max(160, Math.round(width / ratio));

    return {
      width,
      height,
      url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
      mimeType: "image/jpeg",
    };
  });
}

function pexelsPosterSources(url, ratio) {
  return SIZE_BUCKETS.map((width) => {
    const height = Math.max(160, Math.round(width / ratio));
    const posterUrl = new URL(url);

    posterUrl.search = "";
    posterUrl.searchParams.set("auto", "compress");
    posterUrl.searchParams.set("cs", "tinysrgb");
    posterUrl.searchParams.set("w", String(width));

    return {
      width,
      height,
      url: posterUrl.toString(),
      mimeType: "image/jpeg",
    };
  });
}

function toPositiveInteger(value, fallback) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function compactVideoSources(files) {
  const mp4Files = files
    .filter((file) => file.file_type === "video/mp4" && file.link)
    .map((file) => ({
      width: toPositiveInteger(file.width, 1280),
      height: toPositiveInteger(file.height, undefined),
      url: file.link,
      mimeType: "video/mp4",
    }))
    .sort((left, right) => left.width - right.width);
  const sourcesByBucket = new Map();

  for (const source of mp4Files) {
    const bucket = SIZE_BUCKETS.find((width) => width >= source.width) ?? 1600;
    const current = sourcesByBucket.get(bucket);

    if (!current || source.width < current.width) {
      sourcesByBucket.set(bucket, source);
    }
  }

  const compactSources = [...sourcesByBucket.values()];

  if (compactSources.length > 3) {
    return [
      compactSources[0],
      compactSources[Math.floor(compactSources.length / 2)],
      compactSources[compactSources.length - 1],
    ];
  }

  return compactSources;
}

async function fetchPexelsPage({ query, orientation, page, apiKey }) {
  const url = new URL(PEXELS_ENDPOINT);

  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", String(PEXELS_PER_PAGE));
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API failed with ${response.status} for "${query}"`);
  }

  return response.json();
}

async function validateVideoUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        Range: "bytes=0-1023",
      },
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";

    if (![200, 206].includes(response.status) || !contentType.startsWith("video/")) {
      return false;
    }

    await response.arrayBuffer();

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateSources(sources) {
  const validationResults = await Promise.all(
    sources.map(async (source) => ({
      source,
      isValid: await validateVideoUrl(source.url),
    })),
  );

  return validationResults
    .filter((result) => result.isValid)
    .map((result) => result.source);
}

async function collectPexelsVideos() {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is not set. Add it to .env.local or the shell env.");
  }

  const candidatesById = new Map();

  for (const search of PEXELS_QUERIES) {
    for (let page = 1; page <= PEXELS_PAGES_PER_QUERY; page += 1) {
      const payload = await fetchPexelsPage({ ...search, page, apiKey });

      for (const video of payload.videos ?? []) {
        const durationSeconds = toPositiveInteger(video.duration, 12);

        if (
          durationSeconds <= MAX_PEXELS_VIDEO_DURATION_SECONDS &&
          !candidatesById.has(video.id)
        ) {
          candidatesById.set(video.id, {
            id: video.id,
            width: toPositiveInteger(video.width, 1280),
            height: toPositiveInteger(video.height, 720),
            durationMs: durationSeconds * 1000,
            image: video.image,
            photographer: video.user?.name ?? "Pexels creator",
            query: search.query,
            orientation: search.orientation,
            sources: compactVideoSources(video.video_files ?? []),
          });
        }
      }

      if (candidatesById.size >= TARGET_PEXELS_VIDEOS * 1.8) {
        break;
      }
    }

    if (candidatesById.size >= TARGET_PEXELS_VIDEOS * 1.8) {
      break;
    }
  }

  const verifiedVideos = [];
  const candidates = [...candidatesById.values()].filter(
    (candidate) => candidate.image && candidate.sources.length,
  );
  const batchSize = 12;

  for (let index = 0; index < candidates.length; index += batchSize) {
    const batch = candidates.slice(index, index + batchSize);
    const validationResults = await Promise.all(
      batch.map(async (candidate) => {
        const validSources = await validateSources(candidate.sources);

        if (!validSources.length) {
          return null;
        }

        return {
          ...candidate,
          sources: validSources,
        };
      }),
    );

    for (const result of validationResults) {
      if (result) {
        verifiedVideos.push(result);
      }
    }

    console.log(
      `Verified ${verifiedVideos.length}/${TARGET_PEXELS_VIDEOS} Pexels videos <= ${MAX_PEXELS_VIDEO_DURATION_SECONDS}s`,
    );

    if (verifiedVideos.length >= TARGET_PEXELS_VIDEOS) {
      break;
    }
  }

  if (verifiedVideos.length < 24) {
    throw new Error(
      `Only ${verifiedVideos.length} verified Pexels videos found. Try again or increase query coverage.`,
    );
  }

  return verifiedVideos;
}

function createImageItem(imageCount) {
  const ratioBase = pick(BASE_RATIOS);
  const variation = 0.92 + random() * 0.16;
  const ratio = Math.round(ratioBase.ratio * variation * 1000) / 1000;
  const baseWidth = ratio >= 1 ? 1200 : Math.max(540, Math.round(1100 * ratio));
  const width = Math.max(360, Math.round(baseWidth));
  const height = Math.max(360, Math.round(width / ratio));
  const aspectRatio = normalizeAspectRatio(width, height);
  const picsumSeed = `ai-media-feed-${String(imageCount).padStart(4, "0")}`;
  const itemTags = Array.from(new Set([ratioBase.label, pick(TAGS), pick(TAGS)])).slice(0, 3);

  return {
    id: `image-${String(imageCount).padStart(4, "0")}`,
    type: "image",
    title: `AI visual exploration ${String(imageCount).padStart(3, "0")}`,
    width,
    height,
    aspectRatio,
    sources: imageSources(picsumSeed, aspectRatio),
    tags: itemTags,
  };
}

function createVideoItem(videoCount, videoAsset) {
  const width = videoAsset.width;
  const height = videoAsset.height;
  const aspectRatio = normalizeAspectRatio(width, height);
  const itemTags = Array.from(
    new Set([
      `pexels-${videoAsset.orientation}`,
      ...videoAsset.query.split(/\s+/).slice(0, 2),
      "video",
    ]),
  );

  return {
    id: `video-${String(videoCount).padStart(4, "0")}`,
    type: "video",
    title: `AI motion study ${String(videoCount).padStart(3, "0")} · ${videoAsset.photographer}`,
    width,
    height,
    aspectRatio,
    sources: videoAsset.sources,
    posterSources: pexelsPosterSources(videoAsset.image, aspectRatio),
    durationMs: videoAsset.durationMs,
    tags: itemTags,
  };
}

async function main() {
  loadLocalEnv();

  const pexelsVideos = await collectPexelsVideos();
  const items = [];
  let imageCount = 0;
  let videoCount = 0;

  for (let index = 0; index < TOTAL_ITEMS; index += 1) {
    const isVideo = index % 10 < VIDEO_RATIO_PER_TEN;

    if (isVideo) {
      videoCount += 1;
      items.push(createVideoItem(videoCount, pexelsVideos[(videoCount - 1) % pexelsVideos.length]));
    } else {
      imageCount += 1;
      items.push(createImageItem(imageCount));
    }
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(items, null, 2)}\n`);

  const uniqueVideoUrls = new Set(
    items
      .filter((item) => item.type === "video")
      .flatMap((item) => item.sources.map((source) => source.url)),
  );

  console.log(
    JSON.stringify(
      {
        items: items.length,
        images: imageCount,
        videos: videoCount,
        maxVideoDurationSeconds: MAX_PEXELS_VIDEO_DURATION_SECONDS,
        verifiedPexelsVideos: pexelsVideos.length,
        uniqueVideoUrls: uniqueVideoUrls.size,
        output: OUTPUT_PATH,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
