// The Electoral Commission's party names ("Conservative and Unionist Party", "Scottish National Party (SNP)", "Plaid Cymru - The Party of Wales") matched to the names the leader and flag
// data use (data/partyLeaders.json, lib/partyFlags.js), so a party in the donations list can show its leader and flag. A party that is not matched (a small or new one) simply gets
// its colour and no portrait. Order matters: "Social Democratic and Labour" must be tried before "Labour".
const RULES = [
  [/social democratic\s*(&|and)\s*labour|\bsdlp\b/i, "Social Democratic & Labour Party"],
  [/^labour\b/i, "Labour Party"],
  [/conservative/i, "Conservative Party"],
  [/liberal democrat/i, "Liberal Democrats"],
  [/scottish national|\bsnp\b/i, "Scottish National Party"],
  [/^(the )?green party( of england( and wales)?)?$/i, "Green Party"],
  [/reform uk/i, "Reform UK"],
  [/plaid cymru/i, "Plaid Cymru"],
  [/democratic unionist|\bdup\b/i, "Democratic Unionist Party"],
  [/sinn f[eé]in/i, "Sinn Féin"],
  [/ulster unionist|\buup\b/i, "Ulster Unionist Party"],
  [/^alliance/i, "Alliance"],
];

export function canonicalParty(name) {
  const hit = RULES.find(([re]) => re.test(String(name ?? "")));
  return hit ? hit[1] : null;
}
