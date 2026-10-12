// Every UK government since the 1945 general election, with how it took office and a short list of the main things that changed while it was in power.
//
// Written by hand from well-documented events and kept to what can be checked: Acts of Parliament, treaties, referendums, and events with a
// date. It describes what happened, not whether it was a good idea, and it does not try to say which government "caused" a trend. Dates are
// when the Prime Minister took and left office. Where one Prime Minister led two governments (Wilson, Cameron) each gets its own entry.
//
// `party` is the group used in the election data: "l" Labour, "c" Conservative, "lc" for the Conservative-Liberal Democrat coalition.
// `elections` are the general elections that put this government in power or kept it there (ids as in electionsHistory.json).

export const GOVERNMENTS = [
  {
    id: "attlee", pm: "Clement Attlee", party: "l", from: "1945-07-26", to: "1951-10-26", elections: ["1945", "1950"],
    took: "Labour won the 1945 election by a landslide just after the war ended in Europe, then held on in 1950 with a majority of five.",
    changes: [
      "The National Health Service began on 5 July 1948, free to everyone when they needed it.",
      "The coal industry, the railways, electricity, gas and the Bank of England were taken into public ownership.",
      "The National Insurance Act 1946 set up benefits for sickness, unemployment and retirement, the core of the welfare state.",
      "India and Pakistan became independent in 1947, followed by Burma and Ceylon in 1948.",
      "Britain joined the new NATO alliance in 1949, and the pound was devalued from $4.03 to $2.80 the same year.",
    ],
  },
  {
    id: "churchill", pm: "Winston Churchill", party: "c", from: "1951-10-26", to: "1955-04-06", elections: ["1951"],
    took: "The Conservatives won more seats in 1951 even though Labour won more votes.",
    changes: [
      "Rationing ended: sweets in 1953, sugar in 1953 and meat and all other food in 1954.",
      "Housing was a priority, and 300,000 homes a year were built by 1953, meeting the party's pledge.",
      "The steel industry was returned to private ownership in 1953.",
      "Most of Labour's welfare state, including the NHS, was kept in place.",
      "Elizabeth II was crowned in June 1953.",
    ],
  },
  {
    id: "eden", pm: "Anthony Eden", party: "c", from: "1955-04-06", to: "1957-01-10", elections: ["1955"],
    took: "Eden succeeded Churchill, then won the May 1955 election with a majority of 60.",
    changes: [
      "Britain, France and Israel took military action against Egypt in the Suez Crisis of October and November 1956, then withdrew under pressure from the United States.",
      "The Clean Air Act 1956, a response to the 1952 London smog, began to cut smoke pollution in cities.",
      "Sudan became independent in January 1956.",
      "Eden resigned in January 1957, citing ill health.",
    ],
  },
  {
    id: "macmillan", pm: "Harold Macmillan", party: "c", from: "1957-01-10", to: "1963-10-19", elections: ["1959"],
    took: "Macmillan succeeded Eden and won the 1959 election with a majority of 100.",
    changes: [
      "Ghana became independent in 1957, the first of many African colonies to do so; Macmillan's 1960 \"wind of change\" speech signalled the shift.",
      "The Life Peerages Act 1958 let people be made peers for their own lifetime, bringing women into the House of Lords for the first time.",
      "Britain's first application to join the European Economic Community was vetoed by France in January 1963.",
      "The Commonwealth Immigrants Act 1962 introduced the first controls on migration from the Commonwealth.",
      "The Profumo affair, a scandal involving a minister, damaged the government in 1963.",
    ],
  },
  {
    id: "douglashome", pm: "Alec Douglas-Home", party: "c", from: "1963-10-19", to: "1964-10-16", elections: [],
    took: "Douglas-Home gave up his peerage to become Prime Minister when Macmillan resigned, and led the party into the 1964 election.",
    changes: [
      "He was the last Prime Minister to have been a member of the House of Lords when appointed, and the second shortest-serving of the period.",
      "The Resale Prices Act 1964 ended the right of manufacturers to fix shop prices.",
      "The Conservatives lost the October 1964 election narrowly, by four seats.",
    ],
  },
  {
    id: "wilson1", pm: "Harold Wilson", party: "l", from: "1964-10-16", to: "1970-06-19", elections: ["1964", "1966"],
    took: "Labour won narrowly in 1964, then increased its majority in 1966.",
    changes: [
      "The death penalty for murder was abolished in Great Britain in 1965, and made permanent in 1969.",
      "The Abortion Act 1967 and the Sexual Offences Act 1967 changed the law on abortion and on sex between men in England and Wales.",
      "The Race Relations Acts of 1965 and 1968 outlawed discrimination in public places, then in housing and employment.",
      "The Open University was founded in 1969, and the voting age was lowered from 21 to 18 the same year.",
      "The pound was devalued by 14% in November 1967, and Britain's second bid to join the EEC was vetoed.",
    ],
  },
  {
    id: "heath", pm: "Edward Heath", party: "c", from: "1970-06-19", to: "1974-03-04", elections: ["1970"],
    took: "The Conservatives won an unexpected majority of 30 in June 1970.",
    changes: [
      "Britain joined the European Economic Community on 1 January 1973.",
      "The currency was decimalised on 15 February 1971, and VAT replaced purchase tax in April 1973.",
      "Direct rule from London began in Northern Ireland in 1972, after Bloody Sunday in January.",
      "The school leaving age was raised from 15 to 16 in 1972.",
      "A miners' strike and an oil price shock led to the three-day working week in early 1974, and Heath called an election.",
    ],
  },
  {
    id: "wilson2", pm: "Harold Wilson", party: "l", from: "1974-03-04", to: "1976-04-05", elections: ["1974a", "1974b"],
    took: "The February 1974 election gave no party a majority. Labour governed as a minority, then won a majority of three in October.",
    changes: [
      "The 1975 referendum on staying in the European Communities was won by 67% to 33%.",
      "The Health and Safety at Work Act 1974 and the Sex Discrimination Act 1975 became law.",
      "The miners' dispute was settled and the three-day week ended within weeks.",
      "Inflation rose above 20% in 1975, and the government agreed a pay restraint deal with the trade unions.",
      "Oil from the North Sea began to flow ashore in 1975.",
    ],
  },
  {
    id: "callaghan", pm: "James Callaghan", party: "l", from: "1976-04-05", to: "1979-05-04", elections: [],
    took: "Callaghan took over when Wilson resigned. A majority of three was lost to by-elections, and the Liberals backed the government from 1977 to 1978.",
    changes: [
      "The government agreed a loan of about £2.3 billion ($3.9 billion) from the International Monetary Fund in 1976, with spending cuts as a condition.",
      "The 1979 referendums on devolution did not lead to change: Wales voted against and Scotland's yes vote fell short of the required 40% of the electorate.",
      "The Race Relations Act 1976 widened the law against discrimination.",
      "Strikes in the winter of 1978-79, known as the Winter of Discontent, damaged the government's standing.",
      "It lost a vote of no confidence by one vote in March 1979, which forced an election.",
    ],
  },
  {
    id: "thatcher", pm: "Margaret Thatcher", party: "c", from: "1979-05-04", to: "1990-11-28", elections: ["1979", "1983", "1987"],
    took: "The Conservatives won in 1979 under Britain's first woman Prime Minister, then won larger majorities in 1983 and 1987.",
    changes: [
      "State-owned industries were privatised, including British Telecom in 1984, British Gas in 1986 and the water companies in 1989.",
      "The Housing Act 1980 gave council tenants the right to buy their homes.",
      "Britain recaptured the Falkland Islands in 1982 after Argentina invaded.",
      "The miners' strike of 1984 to 1985 ended in defeat for the union, and a series of laws limited the power of trade unions.",
      "The financial markets were deregulated in the \"Big Bang\" of 1986, and the top rate of income tax was cut from 83% to 60% in 1979 and to 40% in 1988.",
      "The Community Charge, or poll tax, replaced local rates in Scotland in 1989 and in England and Wales in 1990. Opposition to it helped to end her time in office.",
    ],
  },
  {
    id: "major", pm: "John Major", party: "c", from: "1990-11-28", to: "1997-05-02", elections: ["1992"],
    took: "Major was chosen by the Conservative Party when Thatcher resigned, then won the 1992 election with a majority of 21.",
    changes: [
      "Britain left the Exchange Rate Mechanism on 16 September 1992 (\"Black Wednesday\") after the pound came under pressure.",
      "The Maastricht Treaty was ratified in 1993 with Britain opting out of the euro and the social chapter.",
      "The poll tax was replaced by the council tax in 1993, and the National Lottery began in 1994.",
      "The Channel Tunnel opened in 1994, and British Rail was privatised between 1994 and 1997.",
      "The Downing Street Declaration in 1993 and the IRA ceasefire in 1994 began the peace process in Northern Ireland.",
    ],
  },
  {
    id: "blair", pm: "Tony Blair", party: "l", from: "1997-05-02", to: "2007-06-27", elections: ["1997", "2001", "2005"],
    took: "Labour won by a landslide in 1997 and won again in 2001 and 2005, the first time the party had won three elections in a row.",
    changes: [
      "The Bank of England was given the power to set interest rates in 1997, and a national minimum wage began in April 1999.",
      "The Scottish Parliament and the Welsh Assembly were set up in 1999 after referendums in 1997, and the Northern Ireland Assembly followed the 1998 Good Friday Agreement.",
      "The Human Rights Act 1998 and the Freedom of Information Act 2000 became law, and most hereditary peers lost their seats in the Lords in 1999.",
      "NHS spending rose sharply from 2000 onwards, and Sure Start children's centres opened.",
      "Britain took part in the war in Afghanistan from 2001 and the invasion of Iraq in 2003.",
      "Tuition fees were introduced in 1998 and raised by the Higher Education Act 2004, and civil partnerships became possible in 2005.",
    ],
  },
  {
    id: "brown", pm: "Gordon Brown", party: "l", from: "2007-06-27", to: "2010-05-11", elections: [],
    took: "Brown took over when Blair resigned, and led Labour into the 2010 election, when the party lost its majority.",
    changes: [
      "The 2008 financial crisis led to Northern Rock being taken into public ownership, and the government bought large shares in RBS and Lloyds.",
      "Bank Rate was cut from 5.75% in 2007 to a record low of 0.5% in March 2009, and VAT was cut temporarily to 15%.",
      "The Climate Change Act 2008 gave Britain a legally binding framework to cut greenhouse gas emissions, the first of its kind in the world.",
      "The Equality Act 2010 brought most discrimination law into one Act.",
      "The expenses scandal of 2009 led to a new independent body to set MPs' pay and expenses, and the Speaker resigned.",
    ],
  },
  {
    id: "coalition", pm: "David Cameron and Nick Clegg", party: "lc", from: "2010-05-11", to: "2015-05-12", elections: ["2010"],
    took: "The 2010 election produced no majority. The Conservatives and Liberal Democrats formed the first coalition government since 1945.",
    changes: [
      "The government set out to cut the deficit with spending cuts and tax rises, and VAT went up from 17.5% to 20% in January 2011.",
      "The Fixed-term Parliaments Act 2011 set five-year terms. A referendum in 2011 rejected changing the voting system to the alternative vote by 68% to 32%.",
      "University tuition fees in England were raised to up to £9,000 a year from 2012.",
      "The personal allowance for income tax rose from £6,475 to £10,600, and the main rate of corporation tax was cut from 28% to 20%.",
      "Scotland voted against independence in September 2014 by 55% to 45%, and same-sex marriage became legal in England and Wales in 2014.",
      "Automatic enrolment into workplace pensions began in 2012, and Universal Credit started to replace older benefits.",
    ],
  },
  {
    id: "cameron", pm: "David Cameron", party: "c", from: "2015-05-12", to: "2016-07-13", elections: ["2015"],
    took: "The Conservatives won a majority of 12 in 2015, a result few polls had predicted.",
    changes: [
      "The EU referendum on 23 June 2016 was won by Leave with 51.9% on a 72% turnout, and Cameron resigned.",
      "The National Living Wage began in April 2016 for workers aged 25 and over.",
      "Parliament voted in December 2015 to extend air strikes against Islamic State to Syria.",
      "Britain helped to agree the Paris climate agreement in December 2015.",
    ],
  },
  {
    id: "may", pm: "Theresa May", party: "c", from: "2016-07-13", to: "2019-07-24", elections: ["2017"],
    took: "May became Prime Minister after the referendum and called an early election in 2017, which cost her majority. She governed with the DUP's support.",
    changes: [
      "Article 50 was triggered on 29 March 2017 to start the process of leaving the EU.",
      "The Commons rejected the withdrawal agreement three times, in January and March 2019, and the leaving date was delayed twice.",
      "The Grenfell Tower fire in June 2017 killed 72 people and led to changes in building safety.",
      "The target of net zero greenhouse gas emissions by 2050 was written into law in June 2019.",
      "May announced her resignation in May 2019 after failing to get the agreement through.",
    ],
  },
  {
    id: "johnson", pm: "Boris Johnson", party: "c", from: "2019-07-24", to: "2022-09-06", elections: ["2019"],
    took: "Johnson became Prime Minister when May resigned, then won a majority of 80 in December 2019.",
    changes: [
      "The UK left the EU on 31 January 2020, and a trade deal with the EU was agreed on 24 December 2020.",
      "The first national lockdown began on 23 March 2020 in response to Covid-19, and the vaccine rollout began on 8 December 2020.",
      "The furlough scheme paid up to 80% of wages for millions of employees during the pandemic.",
      "The UK hosted the COP26 climate summit in Glasgow in November 2021.",
      "The Elections Act 2022 introduced photo ID for voting in person.",
      "Johnson announced his resignation in July 2022 after ministers resigned over his handling of a scandal.",
    ],
  },
  {
    id: "truss", pm: "Liz Truss", party: "c", from: "2022-09-06", to: "2022-10-25", elections: [],
    took: "Truss won the Conservative leadership contest and became Prime Minister two days before the Queen died.",
    changes: [
      "She served 49 days, the shortest time of any UK Prime Minister.",
      "An Energy Price Guarantee, announced on 8 September, capped what households paid for gas and electricity.",
      "The mini-budget on 23 September announced large tax cuts without a forecast from the official budget watchdog. Borrowing costs rose sharply and the Bank of England stepped in to buy government bonds.",
      "Most of the tax cuts were reversed within weeks, the Chancellor was dismissed, and she resigned on 20 October.",
    ],
  },
  {
    id: "sunak", pm: "Rishi Sunak", party: "c", from: "2022-10-25", to: "2024-07-05", elections: [],
    took: "Sunak became Prime Minister after the Conservatives chose him following Truss's resignation. He called the 2024 election, which Labour won.",
    changes: [
      "Inflation fell from a peak of 11.1% in October 2022 to 2.0% in May 2024.",
      "Bank Rate rose to 5.25% in August 2023, the highest since 2008.",
      "The Windsor Framework in February 2023 changed how the Brexit rules apply to Northern Ireland.",
      "The Illegal Migration Act 2023 and the Safety of Rwanda Act 2024 were passed. No one was sent to Rwanda before the election.",
      "Employee National Insurance was cut in two steps, in January and April 2024.",
    ],
  },
  {
    id: "starmer", pm: "Keir Starmer", party: "l", from: "2024-07-05", to: "2026-07-20", elections: ["2024"],
    took: "Labour won a majority of 174 in July 2024, with the lowest share of the vote of any party that has won a majority. Starmer announced on 22 June 2026 that he would step down, and left office on 20 July 2026.",
    changes: [
      "Train operators began to be taken into public ownership under the Passenger Railway Services (Public Ownership) Act 2024.",
      "The first Budget, in October 2024, raised employers' National Insurance and the minimum wage.",
      "The Great British Energy Act (May 2025), the Renters' Rights Act (October 2025) and the Employment Rights Act (December 2025) became law.",
      "Trade agreements were reached with India and the United States in 2025.",
      "The House of Lords (Hereditary Peers) Act 2026 ended the right of hereditary peers to sit in the Lords from 29 April 2026.",
    ],
  },
  {
    id: "burnham", pm: "Andy Burnham", party: "l", from: "2026-07-20", to: null, elections: [],
    took: "Burnham won the Makerfield by-election on 18 June 2026 to get a seat in the Commons. He was the only candidate to reach the nomination threshold for the Labour leadership, and he took office as Prime Minister on 20 July 2026. There has been no general election since 2024.",
    changes: [
      "A new Cabinet was appointed, with John Healey as Chancellor of the Exchequer and Ed Miliband as Foreign Secretary.",
      "Burnham is the first Labour Prime Minister who is also a member of the Co-operative Party.",
    ],
  },
];

export const governmentOn = (iso) => GOVERNMENTS.find((g) => g.from <= iso && (!g.to || iso < g.to)) ?? null;
