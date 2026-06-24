/**
 * TEAM_FLAGS — flag emoji for every nation likely to appear in fixtures data.
 *
 * Two sources of truth in one place so page.tsx and venues/[id]/page.tsx
 * both stay in sync.  Add variants freely — all lookups fall back to 🏳️.
 */

export const TEAM_FLAGS: Record<string, string> = {
  // ── British Isles (regional flags) ──────────────────────────────────────────
  'England':          '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland':         '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales':            '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Northern Ireland': '🇬🇧',
  'Republic of Ireland': '🇮🇪',
  'Ireland':          '🇮🇪',

  // ── UEFA — Western Europe ────────────────────────────────────────────────────
  'France':           '🇫🇷',
  'Germany':          '🇩🇪',
  'Spain':            '🇪🇸',
  'Portugal':         '🇵🇹',
  'Italy':            '🇮🇹',
  'Netherlands':      '🇳🇱',
  'Belgium':          '🇧🇪',
  'Switzerland':      '🇨🇭',
  'Austria':          '🇦🇹',
  'Luxembourg':       '🇱🇺',
  'Andorra':          '🇦🇩',
  'Liechtenstein':    '🇱🇮',
  'Malta':            '🇲🇹',
  'Gibraltar':        '🇬🇮',
  'San Marino':       '🇸🇲',

  // ── UEFA — Scandinavia & Northern Europe ─────────────────────────────────────
  'Norway':           '🇳🇴',
  'Denmark':          '🇩🇰',
  'Sweden':           '🇸🇪',
  'Finland':          '🇫🇮',
  'Iceland':          '🇮🇸',
  'Faroe Islands':    '🇫🇴',

  // ── UEFA — Central & Eastern Europe ─────────────────────────────────────────
  'Poland':           '🇵🇱',
  'Czech Republic':   '🇨🇿',
  'Slovakia':         '🇸🇰',
  'Hungary':          '🇭🇺',
  'Romania':          '🇷🇴',
  'Bulgaria':         '🇧🇬',
  'Moldova':          '🇲🇩',
  'Belarus':          '🇧🇾',
  'Ukraine':          '🇺🇦',
  'Russia':           '🇷🇺',
  'Lithuania':        '🇱🇹',
  'Latvia':           '🇱🇻',
  'Estonia':          '🇪🇪',
  'Georgia':          '🇬🇪',
  'Armenia':          '🇦🇲',
  'Azerbaijan':       '🇦🇿',

  // ── UEFA — Balkans & Mediterranean ──────────────────────────────────────────
  'Croatia':          '🇭🇷',
  'Serbia':           '🇷🇸',
  'Slovenia':         '🇸🇮',
  'Bosnia & Herzegovina': '🇧🇦',
  'Bosnia':           '🇧🇦',
  'Montenegro':       '🇲🇪',
  'North Macedonia':  '🇲🇰',
  'Albania':          '🇦🇱',
  'Kosovo':           '🇽🇰',
  'Greece':           '🇬🇷',
  'Turkey':           '🇹🇷',
  'Cyprus':           '🇨🇾',
  'Israel':           '🇮🇱',

  // ── CONMEBOL ─────────────────────────────────────────────────────────────────
  'Brazil':           '🇧🇷',
  'Argentina':        '🇦🇷',
  'Colombia':         '🇨🇴',
  'Uruguay':          '🇺🇾',
  'Chile':            '🇨🇱',
  'Ecuador':          '🇪🇨',
  'Peru':             '🇵🇪',
  'Bolivia':          '🇧🇴',
  'Venezuela':        '🇻🇪',
  'Paraguay':         '🇵🇾',

  // ── CONCACAF ─────────────────────────────────────────────────────────────────
  'USA':              '🇺🇸',
  'United States':    '🇺🇸',   // common API variant
  'Canada':           '🇨🇦',
  'Mexico':           '🇲🇽',
  'Costa Rica':       '🇨🇷',
  'Honduras':         '🇭🇳',
  'Panama':           '🇵🇦',
  'El Salvador':      '🇸🇻',
  'Guatemala':        '🇬🇹',
  'Jamaica':          '🇯🇲',
  'Trinidad & Tobago': '🇹🇹',
  'Trinidad and Tobago': '🇹🇹',
  'Haiti':            '🇭🇹',
  'Cuba':             '🇨🇺',
  'Nicaragua':        '🇳🇮',
  'Curacao':          '🇨🇼',
  'Belize':           '🇧🇿',
  'Barbados':         '🇧🇧',
  'Bermuda':          '🇧🇲',

  // ── CAF — North Africa ───────────────────────────────────────────────────────
  'Morocco':          '🇲🇦',
  'Algeria':          '🇩🇿',
  'Tunisia':          '🇹🇳',
  'Egypt':            '🇪🇬',
  'Libya':            '🇱🇾',
  'Sudan':            '🇸🇩',
  'Mauritania':       '🇲🇷',

  // ── CAF — West Africa ────────────────────────────────────────────────────────
  'Senegal':          '🇸🇳',
  'Nigeria':          '🇳🇬',
  'Ghana':            '🇬🇭',
  'Ivory Coast':      '🇨🇮',
  "Côte d'Ivoire":    '🇨🇮',   // FIFA official name
  'Cameroon':         '🇨🇲',
  'Mali':             '🇲🇱',
  'Guinea':           '🇬🇳',
  'Burkina Faso':     '🇧🇫',
  'Cape Verde':       '🇨🇻',
  'Gambia':           '🇬🇲',
  'Benin':            '🇧🇯',
  'Equatorial Guinea': '🇬🇶',
  'Togo':             '🇹🇬',
  'Sierra Leone':     '🇸🇱',
  'Liberia':          '🇱🇷',
  'Guinea-Bissau':    '🇬🇼',
  'Niger':            '🇳🇪',

  // ── CAF — East & Central Africa ──────────────────────────────────────────────
  'South Africa':     '🇿🇦',
  'DR Congo':         '🇨🇩',
  'Congo DR':         '🇨🇩',
  'Congo':            '🇨🇬',
  'Zambia':           '🇿🇲',
  'Zimbabwe':         '🇿🇼',
  'Uganda':           '🇺🇬',
  'Tanzania':         '🇹🇿',
  'Kenya':            '🇰🇪',
  'Angola':           '🇦🇴',
  'Mozambique':       '🇲🇿',
  'Namibia':          '🇳🇦',
  'Ethiopia':         '🇪🇹',
  'Somalia':          '🇸🇴',
  'Rwanda':           '🇷🇼',
  'Madagascar':       '🇲🇬',
  'Gabon':            '🇬🇦',

  // ── AFC — East Asia ──────────────────────────────────────────────────────────
  'Japan':            '🇯🇵',
  'South Korea':      '🇰🇷',
  'Korea Republic':   '🇰🇷',   // FIFA official name
  'China PR':         '🇨🇳',
  'China':            '🇨🇳',
  'North Korea':      '🇰🇵',
  'Chinese Taipei':   '🇹🇼',
  'Hong Kong':        '🇭🇰',
  'Mongolia':         '🇲🇳',

  // ── AFC — Southeast Asia ─────────────────────────────────────────────────────
  'Australia':        '🇦🇺',
  'Indonesia':        '🇮🇩',
  'Thailand':         '🇹🇭',
  'Vietnam':          '🇻🇳',
  'Philippines':      '🇵🇭',
  'Malaysia':         '🇲🇾',
  'Myanmar':          '🇲🇲',
  'Singapore':        '🇸🇬',
  'Cambodia':         '🇰🇭',
  'Laos':             '🇱🇦',
  'Timor-Leste':      '🇹🇱',

  // ── AFC — South Asia ─────────────────────────────────────────────────────────
  'India':            '🇮🇳',
  'Pakistan':         '🇵🇰',
  'Bangladesh':       '🇧🇩',
  'Sri Lanka':        '🇱🇰',
  'Nepal':            '🇳🇵',
  'Bhutan':           '🇧🇹',
  'Maldives':         '🇲🇻',

  // ── AFC — Central Asia ───────────────────────────────────────────────────────
  'Uzbekistan':       '🇺🇿',
  'Kazakhstan':       '🇰🇿',
  'Kyrgyzstan':       '🇰🇬',
  'Tajikistan':       '🇹🇯',
  'Turkmenistan':     '🇹🇲',
  'Afghanistan':      '🇦🇫',

  // ── AFC — West Asia / Middle East ────────────────────────────────────────────
  'Saudi Arabia':     '🇸🇦',
  'Iran':             '🇮🇷',
  'Iraq':             '🇮🇶',
  'Qatar':            '🇶🇦',
  'UAE':              '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'Jordan':           '🇯🇴',
  'Bahrain':          '🇧🇭',
  'Kuwait':           '🇰🇼',
  'Oman':             '🇴🇲',
  'Syria':            '🇸🇾',
  'Palestine':        '🇵🇸',
  'Lebanon':          '🇱🇧',
  'Yemen':            '🇾🇪',

  // ── OFC — Oceania ────────────────────────────────────────────────────────────
  'New Zealand':      '🇳🇿',
  'Papua New Guinea': '🇵🇬',
  'Fiji':             '🇫🇯',
  'Solomon Islands':  '🇸🇧',
  'Vanuatu':          '🇻🇺',
  'New Caledonia':    '🇳🇨',
  'Tahiti':           '🇵🇫',
  'Samoa':            '🇼🇸',
  'Tonga':            '🇹🇴',
};

export const flagFor = (team: string): string => TEAM_FLAGS[team] ?? '🏳️';
