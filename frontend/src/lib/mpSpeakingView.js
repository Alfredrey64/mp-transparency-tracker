// What the Debates box says about an MP's speaking count (data/mpSpeaking.json). Pure and tested.

// How a count reads for the person looking at it: where they sit among sitting MPs, in words that do not judge. Null when there is nothing to compare with.
export function describeSpeaking(entry, file) {
  if (!entry || !file?.median) return null;
  const { count } = entry;
  const typical = file.median;
  let against = "about the same as the typical MP";
  if (count >= typical * 1.5) against = "more than the typical MP";
  else if (count <= typical * 0.5) against = "fewer than the typical MP";
  return { count, typical, against };
}
