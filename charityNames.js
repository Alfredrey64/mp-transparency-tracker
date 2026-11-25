// charityNames.js
//
// The think tanks on the Who funds think tanks page that are registered charities, with the name each is registered under at the Charity Commission. `key` is the name the page
// uses (frontend/src/components/ThinkTankFunding.jsx), so a card finds its charity entry by it. These are names, not numbers: fetch-charities.js looks the number up on the register
// and only uses an entry when exactly one live charity has that exact name. A think tank that is not on the register under its own name (the Adam Smith Institute, the TaxPayers' Alliance and the Centre for Policy Studies are not registered charities) is not listed.
export const CHARITY_NAMES = [
  { key: "Institute of Economic Affairs", name: "Institute of Economic Affairs Limited" },
  { key: "Institute for Public Policy Research (IPPR)", name: "Institute for Public Policy Research" },
  { key: "Resolution Foundation", name: "Resolution Foundation" },
  { key: "Institute for Fiscal Studies (IFS)", name: "Institute for Fiscal Studies" },
];
