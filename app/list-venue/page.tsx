'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  green: '#00B368',
  darkGreen: '#0A6B45',
  lightGreen: '#DDF4E8',
  midGreen: '#66D1A4',
  navy: '#0A1A33',
  border: '#E7E9E4',
  borderMid: '#F0F1EE',
  bg: '#F6F7F4',
  white: '#fff',
  textMuted: '#5B6577',
  textFaint: '#9AA3B0',
  error: '#C0392B',
};
const FM = "'IBM Plex Mono', monospace";
const FB = "'Inter', sans-serif";

// ── Static data ────────────────────────────────────────────────────────────────
const VENUE_DB = [
  { name: 'The Pitch Side', address: '42 Rivington St, Shoreditch, EC2A 3AY', area: 'Shoreditch', phone: '020 7946 0123', email: 'hello@pitchside.co.uk', website: 'pitchside.co.uk', rating: '4.6', reviews: '1,240' },
  { name: 'The Crown & Anchor', address: '18 Camberwell Rd, Camberwell, SE5 0EN', area: 'Camberwell', phone: '020 7701 0456', email: 'bookings@crownanchor.co.uk', website: 'crownanchorse5.co.uk', rating: '4.4', reviews: '820' },
  { name: 'Floodlights', address: '7 Greek St, Soho, W1D 4DG', area: 'Soho', phone: '020 7287 0789', email: 'soho@floodlightsbar.com', website: 'floodlightsbar.com', rating: '4.7', reviews: '980' },
  { name: 'The Terrace', address: '90 Rye Lane, Peckham, SE15 4RZ', area: 'Peckham', phone: '020 7639 0234', email: 'roof@theterracepeckham.com', website: 'theterracepeckham.com', rating: '4.9', reviews: '2,104' },
  { name: 'Brixton Social', address: '11 Atlantic Rd, Brixton, SW9 8HX', area: 'Brixton', phone: '020 7274 0567', email: 'hi@brixtonsocial.co.uk', website: 'brixtonsocial.co.uk', rating: '4.6', reviews: '1,560' },
  { name: 'Camden Tap', address: '3 Kentish Town Rd, Camden, NW1 8NH', area: 'Camden', phone: '020 7485 0890', email: 'pour@camdentap.co.uk', website: 'camdentap.co.uk', rating: '4.5', reviews: '760' },
];

const VENUE_TYPES = [
  { label: 'Pub', emoji: '🍺' }, { label: 'Sports bar', emoji: '📺' },
  { label: 'Bar', emoji: '🍸' }, { label: 'Restaurant', emoji: '🍽️' },
  { label: 'Gastropub', emoji: '🍴' }, { label: 'Café-bar', emoji: '☕' },
  { label: 'Event space', emoji: '🎪' }, { label: 'Other', emoji: '➕' },
];

const TYPE_EMOJI_PRESETS = ['🍻', '🍷', '🎬', '🎤', '🏟️', '🎳', '🎯', '🕺', '🍕'];
const TYPE_EMOJI_ALL = ['🍺', '🍻', '🍷', '🍸', '🍹', '🥂', '🍾', '☕', '🍵', '🍴', '🍽️', '🍕', '🍔', '🌮', '🥘', '🥪', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺', '🎯', '🎱', '🎳', '🕺', '💃', '🏟️', '🏆', '⚽', '🏉', '🏏', '🎾', '🥊', '🏎️', '🔥', '✨', '🌃', '🎉', '🎪', '🎲'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type Day = typeof DAYS[number];

const DEFAULT_HOURS: Record<Day, { open: string; close: string; closed: boolean }> = {
  Mon: { open: '12:00', close: '23:00', closed: false },
  Tue: { open: '12:00', close: '23:00', closed: false },
  Wed: { open: '12:00', close: '23:00', closed: false },
  Thu: { open: '12:00', close: '23:00', closed: false },
  Fri: { open: '12:00', close: '01:00', closed: false },
  Sat: { open: '12:00', close: '01:00', closed: false },
  Sun: { open: '12:00', close: '22:30', closed: false },
};

const SETUP_TAGS = ['Outdoor screen', 'Big screen / projector', 'Multiple screens', 'Food', 'Small bites', 'Drinks', 'Bring your own bottle', 'Walk-ins welcome', 'Bookings taken', 'Table service', 'Family friendly', 'Step-free access'];

const SPORTS_LIST = ['Football', 'Cricket', 'Formula 1', 'Rugby Union', 'Rugby League', 'Tennis', 'Golf', 'Boxing', 'Athletics', 'UFC', 'Other'];
const TEAM_SPORTS = ['Football', 'Rugby Union', 'Rugby League', 'Cricket'];
const WORLD_CUP_FIXTURES = ['All fixtures within operating hours'];

const BOOK_METHODS = ['Walk-ins only', 'By phone', 'Website', 'Email', 'Other'];
const TICKETING = ['No, free entry', 'Sometimes, big fixtures only', 'Yes, regularly'];

const DIAL_CODES = [
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { country: 'Ireland', code: '+353', flag: '🇮🇪' },
  { country: 'United States / Canada', code: '+1', flag: '🇺🇸' },
  { country: 'France', code: '+33', flag: '🇫🇷' },
  { country: 'Germany', code: '+49', flag: '🇩🇪' },
  { country: 'Spain', code: '+34', flag: '🇪🇸' },
  { country: 'Italy', code: '+39', flag: '🇮🇹' },
  { country: 'Portugal', code: '+351', flag: '🇵🇹' },
  { country: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { country: 'Belgium', code: '+32', flag: '🇧🇪' },
  { country: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { country: 'Austria', code: '+43', flag: '🇦🇹' },
  { country: 'Denmark', code: '+45', flag: '🇩🇰' },
  { country: 'Sweden', code: '+46', flag: '🇸🇪' },
  { country: 'Norway', code: '+47', flag: '🇳🇴' },
  { country: 'Poland', code: '+48', flag: '🇵🇱' },
  { country: 'Czechia', code: '+420', flag: '🇨🇿' },
  { country: 'Greece', code: '+30', flag: '🇬🇷' },
  { country: 'Türkiye', code: '+90', flag: '🇹🇷' },
  { country: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { country: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { country: 'Ghana', code: '+233', flag: '🇬🇭' },
  { country: 'South Africa', code: '+27', flag: '🇿🇦' },
  { country: 'India', code: '+91', flag: '🇮🇳' },
  { country: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { country: 'China', code: '+86', flag: '🇨🇳' },
  { country: 'Japan', code: '+81', flag: '🇯🇵' },
  { country: 'Australia', code: '+61', flag: '🇦🇺' },
  { country: 'New Zealand', code: '+64', flag: '🇳🇿' },
];

const BENEFITS = [
  { emoji: '🔍', title: 'Get found before kickoff' },
  { emoji: '💸', title: 'No commission, ever' },
  { emoji: '📈', title: 'Fill the quiet nights, pack the big ones' },
  { emoji: '⚙️', title: 'Update fixtures, hours and matchday offers in seconds' },
];

const STEP_NAMES = ['', 'Find your venue', 'Venue type', 'About you', 'Your setup', "What you're showing"];
const STEP_PCT = [0, 20, 40, 60, 80, 100];

// ── Validation ────────────────────────────────────────────────────────────────
const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isMobileValid = (v: string) => v.replace(/\D/g, '').length >= 7;

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`,
  borderRadius: 12, padding: '13px 14px', fontFamily: FB, fontSize: 15,
  color: C.navy, background: C.white, outline: 'none',
};

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    border: `1.5px solid ${selected ? C.green : C.border}`,
    borderRadius: 999, padding: '8px 14px', fontFamily: FB, fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
    background: selected ? C.lightGreen : C.white,
    color: selected ? C.darkGreen : C.navy,
    transition: 'all .12s',
  };
}

function optionRowStyle(selected: boolean): React.CSSProperties {
  return {
    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
    gap: 12, padding: '13px 15px',
    border: `1.5px solid ${selected ? C.green : C.border}`,
    borderRadius: 12, cursor: 'pointer', fontFamily: FB,
    background: selected ? C.lightGreen : C.white,
    color: selected ? C.darkGreen : C.navy,
    transition: 'all .12s',
  };
}

function radioDotStyle(selected: boolean): React.CSSProperties {
  return {
    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: C.white,
    border: selected ? `5px solid ${C.green}` : `2px solid #C7CCD3`,
    transition: 'border .12s',
  };
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    border: 'none', borderRadius: 12, padding: '13px 26px', fontFamily: FB,
    fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s',
  };
  return disabled
    ? { ...base, background: '#D5DAE0', color: C.white }
    : { ...base, background: C.green, color: C.white, boxShadow: '0 6px 16px rgba(0,179,104,0.28)' };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ListVenuePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1
  const [venueQuery, setVenueQuery] = useState('');
  const [detailsRevealed, setDetailsRevealed] = useState(false);
  const [dName, setDName] = useState('');
  const [dAddress, setDAddress] = useState('');
  const [dArea, setDArea] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dEmail, setDEmail] = useState('');
  const [dWebsite, setDWebsite] = useState('');
  const [dRating, setDRating] = useState('');
  const [dReviews, setDReviews] = useState('');
  const [hours, setHours] = useState(() => structuredClone(DEFAULT_HOURS) as typeof DEFAULT_HOURS);

  // Step 2
  const [venueType, setVenueType] = useState('');
  const [showTypeComposer, setShowTypeComposer] = useState(false);
  const [customTypeLabel, setCustomTypeLabel] = useState('');
  const [customTypeEmoji, setCustomTypeEmoji] = useState('🍻');
  const [emojiPopupOpen, setEmojiPopupOpen] = useState(false);

  // Step 3
  const [cFirst, setCFirst] = useState('');
  const [cLast, setCLast] = useState('');
  const [cRole, setCRole] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cMobile, setCMobile] = useState('');
  const [dialCode, setDialCode] = useState('+44');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedMobile, setTouchedMobile] = useState(false);

  // Step 4
  const [setupTags, setSetupTags] = useState<Record<string, boolean>>({});
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [screens, setScreens] = useState('');
  const [capacity, setCapacity] = useState('');
  const [foodUntil, setFoodUntil] = useState('');
  const [drinksUntil, setDrinksUntil] = useState('');

  // Step 5
  const [sports, setSports] = useState<Record<string, boolean>>({});
  const [customSports, setCustomSports] = useState<string[]>([]);
  const [customSportInput, setCustomSportInput] = useState('');
  const [fixtures, setFixtures] = useState<Record<string, boolean>>({});
  const [crowdTeam, setCrowdTeam] = useState('');
  const [bookMethods, setBookMethods] = useState<string[]>([]);
  const [bookOther, setBookOther] = useState('');
  const [ticketing, setTicketing] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');

  // ── Derived state ────────────────────────────────────────────────────────────
  const isBenefits = step === 0;
  const isDone = step === 6;
  const isWizard = step >= 1 && step <= 5;

  const emailValid = isEmailValid(cEmail);
  const mobileValid = !cMobile.trim() || isMobileValid(cMobile);
  const emailError = touchedEmail && !!cEmail.trim() && !emailValid;
  const mobileError = touchedMobile && !!cMobile.trim() && !mobileValid;

  const showFoodUntil = !!setupTags['Food'] || !!setupTags['Small bites'];
  const showDrinksUntil = !!setupTags['Drinks'];
  const showCrowd = TEAM_SPORTS.some(sp => sports[sp]);

  const selectedSportCount = Object.keys(sports).filter(k => k !== 'Other' && sports[k]).length;
  const canContinue =
    step === 1 ? (detailsRevealed && !!dName.trim() && !!dAddress.trim()) :
    step === 2 ? !!venueType :
    step === 3 ? (!!cFirst.trim() && !!cLast.trim() && emailValid && mobileValid) :
    step === 5 ? (selectedSportCount > 0 || customSports.length > 0) :
    true;

  const primaryLabel = isBenefits ? "Let's go" : step === 5 ? 'List my venue' : 'Continue';

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const suggestions = venueQuery.trim().length >= 2
    ? VENUE_DB.filter(v =>
        v.name.toLowerCase().includes(venueQuery.toLowerCase()) ||
        v.address.toLowerCase().includes(venueQuery.toLowerCase())
      )
    : [];

  const pickVenue = (v: typeof VENUE_DB[0]) => {
    setDName(v.name); setDAddress(v.address); setDArea(v.area);
    setDPhone(v.phone); setDEmail(v.email); setDWebsite(v.website);
    setDRating(v.rating); setDReviews(v.reviews);
    setDetailsRevealed(true);
    setVenueQuery(v.name);
  };

  const changeVenue = () => {
    setDetailsRevealed(false);
    setVenueQuery('');
    setDName(''); setDAddress(''); setDArea('');
    setDPhone(''); setDEmail(''); setDWebsite('');
    setDRating(''); setDReviews('');
  };

  const toggleHour = (day: Day) => {
    setHours(h => ({ ...h, [day]: { ...h[day], closed: !h[day].closed } }));
  };

  const toggleSetupTag = (tag: string) => {
    setSetupTags(t => ({ ...t, [tag]: !t[tag] }));
  };

  const addCustomTag = () => {
    const t = customTagInput.trim();
    if (t && !customTags.includes(t)) setCustomTags(ts => [...ts, t]);
    setCustomTagInput('');
  };

  const removeCustomTag = (i: number) => setCustomTags(ts => ts.filter((_, idx) => idx !== i));

  const toggleSport = (sp: string) => {
    setSports(s => ({ ...s, [sp]: !s[sp] }));
  };

  const addCustomSport = () => {
    const t = customSportInput.trim();
    if (t && !customSports.includes(t)) setCustomSports(cs => [...cs, t]);
    setCustomSportInput('');
  };

  const removeCustomSport = (i: number) => setCustomSports(cs => cs.filter((_, idx) => idx !== i));

  const toggleFixture = (fx: string) => {
    setFixtures(f => ({ ...f, [fx]: !f[fx] }));
  };

  const selectType = (label: string) => {
    if (label === 'Other') {
      setShowTypeComposer(true);
      setVenueType('');
    } else {
      setVenueType(label);
      setShowTypeComposer(false);
    }
  };

  const saveCustomType = () => {
    const label = customTypeLabel.trim();
    if (!label) return;
    setVenueType(`${customTypeEmoji} ${label}`);
  };

  const next = () => {
    setStep(s => s + 1);
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  const toggleBookMethod = (method: string) => {
    setBookMethods(bm => bm.includes(method) ? bm.filter(m => m !== method) : [...bm, method]);
  };

  const submit = async () => {
    try {
      const allSetupTags = [...SETUP_TAGS.filter(t => setupTags[t]), ...customTags];
      const allSports = [...SPORTS_LIST.filter(sp => sports[sp] && sp !== 'Other'), ...customSports];
      const selectedFixtures = WORLD_CUP_FIXTURES.filter(x => fixtures[x]);
      const resolvedMethods = bookMethods.map(m => m === 'Other' ? (bookOther.trim() || 'Other') : m);

      await supabase.from('venue_submissions').insert([{
        venue_name: dName,
        address: dAddress,
        area: dArea,
        phone: dPhone,
        email: dEmail,
        website: dWebsite,
        venue_type: venueType,
        opening_hours: hours,
        setup_tags: allSetupTags,
        screens_approx: screens || null,
        capacity_approx: capacity || null,
        sports_shown: allSports,
        world_cup_fixtures: selectedFixtures,
        booking_methods: resolvedMethods,
        ticketed: ticketing || null,
        crowd_team: crowdTeam.trim() || null,
        contact_name: `${cFirst} ${cLast}`.trim(),
        contact_email: cEmail,
        contact_mobile: cMobile ? `${dialCode} ${cMobile}` : null,
        additional_comments: additionalComments.trim() || null,
      }]);

      await fetch('/api/notify-venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_name: dName, area: dArea, venue_type: venueType,
          contact_name: `${cFirst} ${cLast}`.trim(), contact_email: cEmail,
          sports: allSports, booking_methods: resolvedMethods,
          additional_comments: additionalComments.trim() || null,
        }),
      });
    } catch {
      // Redirect regardless of errors
    }
    router.push(`/submitted?email=${encodeURIComponent(cEmail)}`);
  };

  // ── Summary data ─────────────────────────────────────────────────────────────
  const featureTags = [...SETUP_TAGS.filter(t => setupTags[t]), ...customTags];
  if (!featureTags.length) featureTags.push('Not set');

  const showingLines = [
    ...SPORTS_LIST.filter(sp => sports[sp] && sp !== 'Other').map(sp => {
      if (sp === 'Football') {
        const fx = WORLD_CUP_FIXTURES.filter(x => fixtures[x]);
        return sp + (fx.length ? ' → ' + fx.join(', ') : '');
      }
      return sp;
    }),
    ...customSports,
  ];
  if (!showingLines.length) showingLines.push('Not set');

  const bookingVal = bookMethods.length === 0 ? 'Not set' : bookMethods.map(m => m === 'Other' ? (bookOther.trim() || 'Other') : m).join(', ');

  const summaryTop = [
    { label: 'Venue', value: dName || 'Not set' },
    { label: 'Area', value: dArea || 'Not set' },
    { label: 'Address', value: dAddress || 'Not set' },
    { label: 'Type', value: venueType || 'Not set' },
    { label: 'Phone', value: dPhone || 'Not set' },
    { label: 'Website', value: dWebsite || 'Not set' },
    ...(showFoodUntil && foodUntil ? [{ label: 'Food until', value: foodUntil }] : []),
    ...(showDrinksUntil && drinksUntil ? [{ label: 'Drinks until', value: drinksUntil }] : []),
  ];

  const summaryBottom = [
    ...(showCrowd && crowdTeam.trim() ? [{ label: 'Crowd backs', value: crowdTeam }] : []),
    { label: 'Bookings', value: bookingVal },
    { label: 'Ticketed', value: ticketing || 'Not set' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FB, color: C.navy, display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: C.green, boxShadow: '0 0 0 4px rgba(0,179,104,0.18)' }} />
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy }}>Where To <span style={{ color: C.green }}>Watch</span></span>
          </Link>
          <div style={{ flex: 1 }} />
          <button style={{ background: 'transparent', border: 'none', fontFamily: FB, fontSize: 13, fontWeight: 600, color: C.textMuted, cursor: 'pointer' }}>Need help?</button>
        </div>

        {/* Progress bar */}
        {isWizard && (
          <div style={{ maxWidth: 660, margin: '0 auto', padding: '0 20px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>Step {step} of 5 · {STEP_NAMES[step]}</span>
              <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 600, color: C.textFaint }}>{STEP_PCT[step]}%</span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: C.green, borderRadius: 999, width: `${STEP_PCT[step]}%`, transition: 'width .3s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Main ── */}
      <main style={{ flex: 1, width: '100%', maxWidth: 660, margin: '0 auto', padding: '34px 20px 150px', boxSizing: 'border-box' }}>

        {/* Step 0: Benefits */}
        {isBenefits && (
          <div>
            <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.darkGreen }}>For venues · List with Where We Watch</div>
            <h1 style={{ fontFamily: FB, fontWeight: 700, fontSize: 'clamp(26px,5vw,34px)', lineHeight: 1.18, margin: '16px 0 0', letterSpacing: '-0.01em' }}>
              Join <span style={{ color: C.green }}>Where We Watch</span>, the UK&apos;s largest sports-viewing directory, in just three minutes
            </h1>
            <p style={{ fontSize: 16, color: C.textMuted, margin: '20px 0 0', fontWeight: 600 }}>With Where We Watch you&apos;ll be able to:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              {BENEFITS.map(b => (
                <div key={b.emoji} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 13, background: C.lightGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{b.emoji}</div>
                  <span style={{ fontSize: 16.5, fontWeight: 600, color: C.navy }}>{b.title}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 15, color: C.textFaint, margin: '18px 0 0', fontWeight: 500 }}>…and much more.</p>
          </div>
        )}

        {/* Step 1: Find your venue */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: FB, fontWeight: 700, fontSize: 26, margin: 0, letterSpacing: '-0.01em' }}>Find your venue</h2>
            <p style={{ fontSize: 15, color: C.textMuted, margin: '8px 0 0' }}>Type your venue name to get started.</p>

            <div style={{ marginTop: 20 }}>
              <input
                className="wtw-input"
                value={venueQuery}
                onChange={e => setVenueQuery(e.target.value)}
                placeholder="Search your venue name"
                style={inputStyle}
              />
            </div>

            {suggestions.length > 0 && (
              <div style={{ marginTop: 8, background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 30px rgba(10,26,51,0.08)' }}>
                {suggestions.map(v => (
                  <button key={v.name} onClick={() => pickVenue(v)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 15px', background: C.white, border: 'none', borderBottom: `1px solid ${C.borderMid}`, cursor: 'pointer', fontFamily: FB }}>
                    <svg width="14" height="18" viewBox="0 0 24 32" style={{ marginTop: 2, flexShrink: 0 }}>
                      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill={C.green} />
                      <circle cx="12" cy="12" r="4.6" fill={C.white} />
                    </svg>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: C.navy }}>{v.name}</span>
                      <span style={{ fontSize: 13, color: C.textFaint }}>{v.address}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {venueQuery.trim().length >= 2 && suggestions.length === 0 && !detailsRevealed && (
              <button onClick={() => { setDetailsRevealed(true); setVenueQuery(''); }} style={{ marginTop: 14, background: 'transparent', border: 'none', fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.navy, cursor: 'pointer', padding: 0 }}>
                Can&apos;t find your business? <span style={{ color: C.green, fontWeight: 700 }}>Add it manually</span>
              </button>
            )}

            {venueQuery.trim().length === 0 && !detailsRevealed && (
              <button onClick={() => { setDetailsRevealed(true); }} style={{ marginTop: 14, background: 'transparent', border: 'none', fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.navy, cursor: 'pointer', padding: 0 }}>
                Can&apos;t find your business? <span style={{ color: C.green, fontWeight: 700 }}>Add it manually</span>
              </button>
            )}

            {detailsRevealed && (
              <div style={{ marginTop: 22, background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: '0 8px 24px rgba(10,26,51,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  {dRating && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF0D1', borderRadius: 999, padding: '5px 11px' }}>
                      <span style={{ color: '#FFB22E', fontSize: 13 }}>★</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#8A5A00' }}>{dRating} · {dReviews} reviews</span>
                    </div>
                  )}
                  <div style={{ flex: 1 }} />
                  <button onClick={changeVenue} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, padding: '7px 13px', fontFamily: FB, fontSize: 13, fontWeight: 700, color: C.navy, cursor: 'pointer' }}>Search a different venue</button>
                </div>

                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 7px', display: 'block' }}>Venue name</label>
                <input className="wtw-input" value={dName} onChange={e => setDName(e.target.value)} placeholder="Your venue name" style={inputStyle} />

                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Address</label>
                <input className="wtw-input" value={dAddress} onChange={e => setDAddress(e.target.value)} placeholder="Street, postcode" style={inputStyle} />

                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Area / neighbourhood</label>
                <input className="wtw-input" value={dArea} onChange={e => setDArea(e.target.value)} placeholder="e.g. Shoreditch" style={inputStyle} />

                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '18px 0 10px', display: 'block' }}>Opening hours</label>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: '4px 14px' }}>
                  {DAYS.map((day, i) => {
                    const h = hours[day];
                    const isOpen = !h.closed;
                    return (
                      <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 6 ? `1px solid ${C.borderMid}` : 'none' }}>
                        <span style={{ fontFamily: FM, fontSize: 13, fontWeight: 600, width: 42, color: C.navy, flexShrink: 0 }}>{day}</span>
                        {isOpen ? (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="time" className="wtw-time" value={h.open} onChange={e => setHours(hs => ({ ...hs, [day]: { ...hs[day], open: e.target.value } }))} style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '7px 9px', fontFamily: FM, fontSize: 13, color: C.navy, background: C.white, outline: 'none' }} />
                            <span style={{ color: C.textFaint }}>–</span>
                            <input type="time" className="wtw-time" value={h.close} onChange={e => setHours(hs => ({ ...hs, [day]: { ...hs[day], close: e.target.value } }))} style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '7px 9px', fontFamily: FM, fontSize: 13, color: C.navy, background: C.white, outline: 'none' }} />
                          </div>
                        ) : (
                          <span style={{ flex: 1, fontSize: 14, color: C.textFaint }}>Closed</span>
                        )}
                        <button onClick={() => toggleHour(day)} style={{ background: isOpen ? 'transparent' : C.lightGreen, border: isOpen ? 'none' : `1px solid ${C.midGreen}`, borderRadius: 8, fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: isOpen ? C.textFaint : C.darkGreen, padding: '5px 8px', flexShrink: 0 }}>
                          {isOpen ? 'Closed' : 'Open'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Phone</label>
                    <input className="wtw-input" value={dPhone} onChange={e => setDPhone(e.target.value)} placeholder="020 0000 0000" style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Venue email</label>
                    <input className="wtw-input" value={dEmail} onChange={e => setDEmail(e.target.value)} placeholder="hello@yourvenue.co.uk" style={inputStyle} />
                  </div>
                </div>

                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Website</label>
                <input className="wtw-input" value={dWebsite} onChange={e => setDWebsite(e.target.value)} placeholder="yourvenue.co.uk" style={inputStyle} />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Venue type */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: FB, fontWeight: 700, fontSize: 26, margin: 0, letterSpacing: '-0.01em' }}>What kind of venue is it?</h2>
            <p style={{ fontSize: 15, color: C.textMuted, margin: '8px 0 0' }}>Pick the closest match.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 20 }}>
              {VENUE_TYPES.map(t => {
                const isSelected = t.label === 'Other' ? showTypeComposer : venueType === t.label;
                return (
                  <button key={t.label} onClick={() => selectType(t.label)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${isSelected ? C.green : C.border}`, background: isSelected ? C.lightGreen : C.white, color: isSelected ? C.darkGreen : C.navy, cursor: 'pointer', fontFamily: FB, transition: 'all .12s' }}>
                    <span style={{ fontSize: 22 }}>{t.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {showTypeComposer && (
              <div style={{ marginTop: 14, background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {TYPE_EMOJI_PRESETS.map(e => (
                    <button key={e} onClick={() => setCustomTypeEmoji(e)} style={{ height: 44, width: 44, borderRadius: 12, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${customTypeEmoji === e ? C.green : C.border}`, background: customTypeEmoji === e ? C.lightGreen : C.white }}>{e}</button>
                  ))}
                  <button onClick={() => setEmojiPopupOpen(o => !o)} style={{ height: 44, width: 44, borderRadius: 12, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${emojiPopupOpen ? C.green : C.border}`, background: emojiPopupOpen ? C.lightGreen : C.white }}>+</button>
                </div>

                {emojiPopupOpen && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 12, padding: 12, background: C.bg, borderRadius: 12, maxHeight: 184, overflowY: 'auto' }}>
                    {TYPE_EMOJI_ALL.map(e => (
                      <button key={e} onClick={() => { setCustomTypeEmoji(e); setEmojiPopupOpen(false); }} style={{ height: 38, borderRadius: 9, fontSize: 19, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${customTypeEmoji === e ? C.green : 'transparent'}`, background: customTypeEmoji === e ? C.lightGreen : C.white }}>{e}</button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="wtw-input" value={customTypeLabel} onChange={e => setCustomTypeLabel(e.target.value)} placeholder="Tell us what kind" style={{ ...inputStyle, flex: 1, padding: '12px 14px', fontSize: 15 }} />
                  <button onClick={saveCustomType} disabled={!customTypeLabel.trim()} style={{ border: 'none', borderRadius: 12, padding: '0 18px', fontFamily: FB, fontSize: 14, fontWeight: 700, cursor: customTypeLabel.trim() ? 'pointer' : 'not-allowed', background: customTypeLabel.trim() ? C.green : '#D5DAE0', color: C.white }}>Add</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: About you */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: FB, fontWeight: 700, fontSize: 26, margin: 0, letterSpacing: '-0.01em' }}>About you</h2>
            <p style={{ fontSize: 15, color: C.textMuted, margin: '8px 0 0' }}>This isn&apos;t shown publicly. We&apos;ll only use it to contact you.</p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '22px 0 7px', display: 'block' }}>First name</label>
                <input className="wtw-input" value={cFirst} onChange={e => setCFirst(e.target.value)} placeholder="First name" style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '22px 0 7px', display: 'block' }}>Last name</label>
                <input className="wtw-input" value={cLast} onChange={e => setCLast(e.target.value)} placeholder="Last name" style={inputStyle} />
              </div>
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Your role <span style={{ color: C.textFaint, fontWeight: 500 }}>(optional)</span></label>
            <input className="wtw-input" value={cRole} onChange={e => setCRole(e.target.value)} placeholder="Owner / Manager" style={inputStyle} />

            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Your email</label>
            <input className="wtw-input" value={cEmail} onChange={e => setCEmail(e.target.value)} onBlur={() => setTouchedEmail(true)} placeholder="you@email.com" style={{ ...inputStyle, borderColor: emailError ? C.error : C.border }} />
            {emailError && <p style={{ fontSize: 12.5, color: C.error, fontWeight: 600, margin: '6px 0 0' }}>Please enter a valid email address.</p>}

            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 7px', display: 'block' }}>Mobile</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="wtw-select" value={dialCode} onChange={e => setDialCode(e.target.value)} style={{ boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '13px 10px', fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.navy, background: C.white, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
                {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.flag} {d.code}</option>)}
              </select>
              <input className="wtw-input" value={cMobile} onChange={e => setCMobile(e.target.value)} onBlur={() => setTouchedMobile(true)} inputMode="tel" placeholder="7700 900000" style={{ ...inputStyle, flex: 1, minWidth: 0, borderColor: mobileError ? C.error : C.border }} />
            </div>
            {mobileError && <p style={{ fontSize: 12.5, color: C.error, fontWeight: 600, margin: '6px 0 0' }}>Please enter a valid mobile number.</p>}
          </div>
        )}

        {/* Step 4: Your setup */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: FB, fontWeight: 700, fontSize: 26, margin: 0, letterSpacing: '-0.01em' }}>Your setup</h2>
            <p style={{ fontSize: 15, color: C.textMuted, margin: '8px 0 0' }}>Tap everything that applies.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
              {SETUP_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleSetupTag(tag)} style={chipStyle(!!setupTags[tag])}>{tag}</button>
              ))}
              {customTags.map((tag, i) => (
                <button key={tag} onClick={() => removeCustomTag(i)} style={chipStyle(true)}>{tag} ✕</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
              <input className="wtw-input" value={customTagInput} onChange={e => setCustomTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomTag()} placeholder="Add your own tag" style={{ ...inputStyle, flex: 1, padding: '11px 14px', fontSize: 14 }} />
              <button onClick={addCustomTag} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 12, padding: '0 18px', fontFamily: FB, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '22px 0 7px', display: 'block' }}>Screens <span style={{ color: C.textFaint, fontWeight: 500 }}>(approx)</span></label>
                <input className="wtw-input" value={screens} onChange={e => setScreens(e.target.value)} inputMode="numeric" placeholder="e.g. 6" style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '22px 0 7px', display: 'block' }}>Capacity <span style={{ color: C.textFaint, fontWeight: 500 }}>(approx)</span></label>
                <input className="wtw-input" value={capacity} onChange={e => setCapacity(e.target.value)} inputMode="numeric" placeholder="e.g. 120" style={inputStyle} />
              </div>
            </div>

            {(showFoodUntil || showDrinksUntil) && (
              <div style={{ marginTop: 22, background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Last orders on match nights</div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                  {showFoodUntil && (
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, margin: '10px 0 7px', display: 'block' }}>Food until</label>
                      <input type="time" className="wtw-time" value={foodUntil} onChange={e => setFoodUntil(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontFamily: FM, fontSize: 15, color: C.navy, background: C.white, outline: 'none' }} />
                    </div>
                  )}
                  {showDrinksUntil && (
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, margin: '10px 0 7px', display: 'block' }}>Drinks until</label>
                      <input type="time" className="wtw-time" value={drinksUntil} onChange={e => setDrinksUntil(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontFamily: FM, fontSize: 15, color: C.navy, background: C.white, outline: 'none' }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: What you're showing */}
        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: FB, fontWeight: 700, fontSize: 26, margin: 0, letterSpacing: '-0.01em' }}>What you&apos;re showing</h2>

            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '22px 0 10px' }}>Which sports do you show?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {SPORTS_LIST.map(sp => (
                <button key={sp} onClick={() => toggleSport(sp)} style={chipStyle(!!sports[sp])}>{sp}</button>
              ))}
              {customSports.map((sp, i) => (
                <button key={sp} onClick={() => removeCustomSport(i)} style={chipStyle(true)}>{sp} ✕</button>
              ))}
            </div>

            {sports['Other'] && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input className="wtw-input" value={customSportInput} onChange={e => setCustomSportInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomSport()} placeholder="Add a sport, e.g. Basketball, Darts" style={{ ...inputStyle, flex: 1, padding: '12px 14px' }} />
                <button onClick={addCustomSport} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 12, padding: '0 18px', fontFamily: FB, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
              </div>
            )}

            {sports['Football'] && (
              <div style={{ marginTop: 18, borderLeft: `2px solid ${C.midGreen}`, paddingLeft: 15 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.darkGreen, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>World Cup fixtures</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {WORLD_CUP_FIXTURES.map(fx => (
                    <button key={fx} onClick={() => toggleFixture(fx)} style={chipStyle(!!fixtures[fx])}>{fx}</button>
                  ))}
                </div>
              </div>
            )}

            {showCrowd && (
              <div style={{ marginTop: 26 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 7px', display: 'block' }}>Does your crowd back a team? <span style={{ color: C.textFaint, fontWeight: 500 }}>(optional)</span></label>
                <input className="wtw-input" value={crowdTeam} onChange={e => setCrowdTeam(e.target.value)} placeholder="e.g. England, Chelsea, Arsenal" style={inputStyle} />
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '26px 0 10px' }}>How can fans book or reach you?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {BOOK_METHODS.map(o => {
                const isSelected = bookMethods.includes(o);
                return (
                  <button key={o} onClick={() => toggleBookMethod(o)} style={optionRowStyle(isSelected)}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: isSelected ? C.green : C.white, border: isSelected ? 'none' : '2px solid #C7CCD3', transition: 'all .12s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 11, fontWeight: 800 }}>{isSelected ? '✓' : ''}</span>
                    <span style={{ fontSize: 14.5, fontWeight: 600 }}>{o}</span>
                  </button>
                );
              })}
            </div>
            {bookMethods.includes('Other') && (
              <input className="wtw-input" value={bookOther} onChange={e => setBookOther(e.target.value)} placeholder="Tell us how" style={{ ...inputStyle, marginTop: 10 }} />
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '24px 0 10px' }}>Do you ticket entry for big games?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {TICKETING.map(o => (
                <button key={o} onClick={() => setTicketing(o)} style={optionRowStyle(ticketing === o)}>
                  <span style={radioDotStyle(ticketing === o)} />
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{o}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review */}
        {isDone && (
          <div>
            <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.darkGreen }}>Review your listing</div>
            <h2 style={{ fontFamily: FB, fontWeight: 700, fontSize: 'clamp(28px,5vw,36px)', letterSpacing: '-0.01em', margin: '10px 0 0', lineHeight: 1.1 }}>Check the details</h2>

            <div style={{ marginTop: 20, background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: '0 8px 24px rgba(10,26,51,0.05)' }}>
              {summaryTop.map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: `1px solid ${C.borderMid}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textFaint, flexShrink: 0 }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.navy, textAlign: 'right' }}>{r.value}</span>
                </div>
              ))}
              <div style={{ padding: '11px 0', borderBottom: `1px solid ${C.borderMid}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textFaint, marginBottom: 9 }}>Features</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'flex-end' }}>
                  {featureTags.map((t, i) => (
                    <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: C.darkGreen, background: C.lightGreen, borderRadius: 8, padding: '4px 9px' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: '11px 0', borderBottom: `1px solid ${C.borderMid}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textFaint, marginBottom: 8 }}>Showing</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {showingLines.map((l, i) => (
                    <span key={i} style={{ fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.4, textAlign: 'right' }}>{l}</span>
                  ))}
                </div>
              </div>
              {summaryBottom.map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: `1px solid ${C.borderMid}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textFaint, flexShrink: 0 }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.navy, textAlign: 'right' }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 7, display: 'block' }}>Anything else to add? <span style={{ color: C.textFaint, fontWeight: 500 }}>(optional)</span></label>
              <textarea
                value={additionalComments}
                onChange={e => setAdditionalComments(e.target.value)}
                placeholder="e.g. matchday offers, specific fixtures you're planning to show..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
          </div>
        )}

      </main>

      {/* ── Bottom nav ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: C.white, borderTop: `1px solid ${C.border}`, boxShadow: '0 -6px 24px rgba(10,26,51,0.06)' }}>
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {isWizard && (
              <button onClick={back} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 20px', fontFamily: FB, fontSize: 14, fontWeight: 700, color: C.navy, cursor: 'pointer' }}>Back</button>
            )}
            {isDone && (
              <button onClick={() => setStep(5)} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 20px', fontFamily: FB, fontSize: 14, fontWeight: 700, color: C.navy, cursor: 'pointer' }}>Edit listing</button>
            )}
          </div>
          <div>
            {isDone ? (
              <button onClick={submit} style={{ border: 'none', background: C.green, color: C.white, borderRadius: 12, padding: '13px 24px', fontFamily: FB, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,179,104,0.28)' }}>Submit listing →</button>
            ) : (
              <button onClick={next} disabled={isWizard && !canContinue} style={primaryBtnStyle(isWizard && !canContinue)}>{primaryLabel}</button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
