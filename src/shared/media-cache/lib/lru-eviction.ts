export type LruCandidate = {
  id: string;
  kind: "image" | "poster";
  lastAccessedAt: number;
  bytes: number;
};

export function sortLruCandidates(candidates: LruCandidate[]) {
  return [...candidates].sort(
    (left, right) => left.lastAccessedAt - right.lastAccessedAt,
  );
}
