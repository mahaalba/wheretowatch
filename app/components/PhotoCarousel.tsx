'use client';

import { useCallback, useRef, useState } from 'react';

const FONT_MONO = "'IBM Plex Mono', monospace";

interface Props {
  photos: string[];
  venueName: string;
  height?: number;
  grayscale?: boolean;
}

export default function PhotoCarousel({ photos, venueName, height = 188, grayscale = false }: Props) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setCurrent(i);
  }, []);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  // ── Placeholder ──────────────────────────────────────────────────────────────
  if (photos.length === 0) {
    return (
      <div style={{
        height,
        background: 'linear-gradient(160deg, #060F1F 0%, #0E2244 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: grayscale ? 'grayscale(1)' : undefined,
      }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)' }}>
          venue photo
        </span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', filter: grayscale ? 'grayscale(1)' : undefined }}>

      {/* Scroll track — scroll-snap container */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="wtw-carousel"
        style={{
          display: 'flex',
          height: '100%',
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        {photos.map((url, i) => (
          <img
            key={url + i}
            src={url}
            alt={`${venueName} photo ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            draggable={false}
            style={{
              flexShrink: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              scrollSnapAlign: 'start',
            }}
          />
        ))}
      </div>

      {/* Prev arrow */}
      {current > 0 && (
        <button
          onClick={e => { e.stopPropagation(); scrollTo(current - 1); }}
          aria-label="Previous photo"
          style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            zIndex: 5, background: 'rgba(255,255,255,0.88)', border: 'none',
            borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.22)', fontSize: 18, lineHeight: 1,
            color: '#0A1A33', fontFamily: 'system-ui',
          }}
        >‹</button>
      )}

      {/* Next arrow */}
      {current < photos.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); scrollTo(current + 1); }}
          aria-label="Next photo"
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            zIndex: 5, background: 'rgba(255,255,255,0.88)', border: 'none',
            borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.22)', fontSize: 18, lineHeight: 1,
            color: '#0A1A33', fontFamily: 'system-ui',
          }}
        >›</button>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 8, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 4, zIndex: 5,
        }}>
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); scrollTo(i); }}
              aria-label={`Photo ${i + 1} of ${photos.length}`}
              style={{
                width: i === current ? 14 : 5, height: 5,
                borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer',
                background: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
