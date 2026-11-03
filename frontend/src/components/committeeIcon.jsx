/** @jsxImportSource react */
import {
  IconCommittee, IconHouse, IconCoin, IconLedger, IconHealth, IconMortarboard, IconDefence, IconGlobe, IconShield, IconScales, IconTransport, IconLeaf, IconBolt,
  IconFactory, IconBroadcast, IconPension, IconGroup, IconBook, IconDevolved, IconMeeting, IconHeart,
} from "./icons";
import { IconCivilService, IconCourt, IconAudit, IconAid, IconSignal, IconWheat, IconPlanning } from "./newIcons";

// A small picture for what a select committee looks into, chosen from the words in its name (the first that matches wins), so a committee page or report card has
// something to recognise it by. A committee that matches nothing gets the plain committee icon.
const BY_WORD = [
  [/built environment|planning/i, (size) => <IconPlanning size={size} />],
  [/housing|communities|local government/i, (size) => <IconHouse size={size} />],
  [/treasury|financial|economic affairs|estimate/i, (size) => <IconCoin size={size} />],
  [/public accounts/i, (size) => <IconLedger size={size} />],
  [/health|autism/i, (size) => <IconHealth size={size} />],
  [/education|numeracy|social mobility/i, (size) => <IconMortarboard size={size} />],
  [/defence|national security/i, (size) => <IconDefence size={size} />],
  [/foreign|international relations|european|engagement with space/i, (size) => <IconGlobe size={size} />],
  [/international agreements/i, (size) => <IconBook size={size} />],
  [/international development/i, (size) => <IconAid size={size} />],
  [/home affairs|justice and home/i, (size) => <IconShield size={size} />],
  [/justice/i, (size) => <IconScales size={size} />],
  [/constitution|public administration/i, (size) => <IconCourt size={size} />],
  [/transport/i, (size) => <IconTransport size={size} />],
  [/environmental audit|environment|climate/i, (size) => <IconLeaf size={size} />],
  [/energy/i, (size) => <IconBolt size={size} />],
  [/food and rural|farming|agriculture/i, (size) => <IconWheat size={size} />],
  [/business|industry|trade|science/i, (size) => <IconFactory size={size} />],
  [/culture|media|sport/i, (size) => <IconBroadcast size={size} />],
  [/digital|communications/i, (size) => <IconSignal size={size} />],
  [/work and pensions|pension/i, (size) => <IconPension size={size} />],
  [/women|equalities|human rights/i, (size) => <IconGroup size={size} />],
  [/northern ireland|scottish|welsh/i, (size) => <IconDevolved size={size} />],
  [/liaison/i, (size) => <IconMeeting size={size} />],
  [/administration|modernisation|working|procedure/i, (size) => <IconCivilService size={size} />],
  [/public services/i, (size) => <IconHeart size={size} />],
  [/audit|regulat/i, (size) => <IconAudit size={size} />],
];

// The picture for a committee name; a committee that matches nothing gets the plain committee icon.
export function CommitteeIcon({ name, size = 26 }) {
  const hit = BY_WORD.find(([re]) => re.test(name ?? ""));
  return hit ? hit[1](size) : <IconCommittee size={size} />;
}
