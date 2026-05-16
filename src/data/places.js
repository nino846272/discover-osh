// All places in Osh
// Coordinates are approximate
// Center of Osh: 40.5283, 72.7985

export const CATEGORIES = [
  { id: 'all',      label: 'All Places',   emoji: '📍', color: '#e8a820' },
  { id: 'food',     label: 'Cafe / Food',  emoji: '🍽️', color: '#e85d20' },
  { id: 'shashlik', label: 'Shashlik',     emoji: '🔥', color: '#c0392b' },
  { id: 'samsa',    label: 'Samsa / Pilaf',emoji: '🥟', color: '#d35400' },
  { id: 'pool',     label: 'Pool',         emoji: '🏊', color: '#2980b9' },
  { id: 'bank',     label: 'Bank / Exch.', emoji: '🏦', color: '#27ae60' },
  { id: 'shop',     label: 'Shops',        emoji: '🛍️', color: '#8b5cf6' },
];

export const PLACES = [
  // ── SHOPS / OUTDOOR ──────────────────────────────────────────────
  {
    id: 15,
    name: 'Kyrgyz Mergen',
    description: 'Hunting knives, camping & tourism gear. #1 knife store in Kyrgyzstan. Lowest prices in KR.',
    category: ['shop'],
    lat: 40.529697,
    lng: 72.805711,
    address: 'Prospekt Absamata Masalieva 76/1, basement floor, Osh',
    hours: 'Mon–Sun 10:00 – 18:00',
    tip: 'Installment plans available via M+',
    phone: '+996 555 98 99 97',
    instagram: 'kyrgyz_mergen_',
    //added
  },

  // ── RESTAURANTS ──────────────────────────────────────────────────
  {
    id: 16,
    name: 'Uluk Ata',
    description: 'Ethno-restaurant with traditional Kyrgyz cuisine. Cozy atmosphere, open early till late.',
    category: ['food'],
    lat: 40.520308,
    lng: 72.812258,
    address: 'Ulitsa Askar Shakirov 132, 1–2 floor, Osh',
    hours: 'Daily 06:00 – 23:50',
    tip: 'Great spot for traditional Kyrgyz breakfast — opens at 6am',
    phone: '+996 997 10 10 10',
    instagram: 'ulukatarestoran',
    //added
  },
  {
    id: 17,
    name: 'Semeyniy',
    description: 'Popular 2-floor cafe on Askar Shakirov. Big menu, open from early morning until late night.',
    category: ['food'],
    lat: 40.520311,
    lng: 72.811915,
    address: 'Ulitsa Askar Shakirov 123, 2 floors, Osh',
    hours: 'Daily 06:00 – 02:00',
    tip: 'Busiest around 19:00 — come earlier or later to avoid the crowd',
    phone: '+996 505 79 03 06',
    website: 'https://semeyniy.com',
    //added
  },
  {
    id: 18,
    name: 'Jyldyz',
    description: 'Traditional Kyrgyz canteen. Home-style national dishes, simple and filling. Weekdays only.',
    category: ['food'],
    lat: 40.517775,
    lng: 72.801960,
    address: 'Osh',
    hours: 'Mon–Fri 07:00 – 16:00 (Sat–Sun closed)',
    tip: 'Come early — popular dishes sell out by noon',
    //added
  },
  {
    id: 19,
    name: 'Almaz Canteen',
    description: 'Beloved local canteen with traditional Kyrgyz home cooking. Basement floor, great value.',
    category: ['food'],
    lat: 40.521951,
    lng: 72.801594,
    address: 'Ulitsa Alymbekа Datka 272/1, basement floor, Osh',
    hours: 'Mon–Fri 07:30 – 17:00 (Sat–Sun closed)',
    tip: 'Rating 4.7 ⭐ — one of the highest rated canteens in Osh',
    phone: '+996 709 03 75 97',
    //added
  },
  {
    id: 20,
    name: 'Na uglyakh (On Coals)',
    description: 'Shashlik cafe open late. Real charcoal grill, 1 floor. Popular evening spot.',
    category: ['shashlik', 'food'],
    lat: 40.531421,
    lng: 72.793922,
    address: 'Ulitsa Kurmanzhana Datka 245, Osh',
    hours: 'Daily 10:00 – 02:00',
    tip: 'Great for late-night shashlik — open until 2am',
    phone: '+996 708 14 94 80',
    //added
  },
  {
    id: 21,
    name: 'Oybek Mantykanaasy',
    description: 'Specializes in mayda manti — small manti filled with potato, made with traditional manti dough (not regular dumpling dough). Unique local dish.',
    category: ['food'],
    lat: 40.541740,
    lng: 72.789297,
    address: 'Osh',
    hours: 'Daily 08:00 – 19:00',
    tip: 'Mayda manti = potato filling + manti dough. Softer and juicier than regular manti — a must try!',
    phone: '+996 550 75 00 63',
    //added
  },
  {
    id: 22,
    name: 'Messto Coffee House',
    description: 'Cozy coffee house with soups. Good spot for a quiet coffee break or a warm bowl of soup.',
    category: ['food'],
    lat: 40.518204,
    lng: 72.799329,
    address: 'Ulitsa Alieva 104, 1st floor, Frunze district, Osh',
    hours: 'Mon–Fri 09:00 – 23:00 / Sat–Sun 10:00 – 23:00',
    tip: 'Rare combo — coffee + soups under one roof. Great for a working lunch',
    phone: '+996 997 52 05 20',
    //added
  },
];
