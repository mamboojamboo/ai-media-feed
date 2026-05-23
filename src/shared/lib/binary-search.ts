export function binarySearchLast<TItem>(
  items: TItem[],
  predicate: (item: TItem, index: number) => boolean,
) {
  let low = 0;
  let high = items.length - 1;
  let answer = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (predicate(items[mid], mid)) {
      answer = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return answer;
}
