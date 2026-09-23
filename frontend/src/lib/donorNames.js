// The Electoral Commission's own donations register isn't consistent about
// how it spells an individual donor's name from one donation to the next —
// with or without a title, with or without a middle name, sometimes in ALL
// CAPS. Left as-is, that splits one person's giving across several
// look-alike entries (e.g. "Ben Delo" and "Mr Ben Peter Delo" showing up as
// two different donors). This reduces a name to "first name + surname" so
// those variants group together as one donor.
//
// Deliberately scoped to donors the Electoral Commission itself classifies
// as DonorStatus "Individual" — company names should never go through this,
// since chopping a company name down to two words risks merging two
// unrelated organisations that happen to share a word.
const TITLE_PREFIX = /^(mr|mrs|ms|miss|mx|dr|sir|dame|lord|lady|baron|baroness|prof|rt hon|the rt hon)\.?\s+/i;

function fixCase(word) {
  if (word.length > 1 && word === word.toUpperCase()) {
    return word[0] + word.slice(1).toLowerCase();
  }
  return word;
}

export function normaliseIndividualDonorName(rawName) {
  const stripped = rawName.replace(TITLE_PREFIX, "").trim().replace(/\s+/g, " ");
  const words = stripped.split(" ").filter(Boolean);
  const kept = words.length > 2 ? [words[0], words[words.length - 1]] : words;
  return kept.map(fixCase).join(" ");
}
