'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LMap, LayerGroup, Marker } from 'leaflet';

export interface VenuePin {
  id: string;
  name: string;
  type: string;
  priceLevel: string;
  area: string;
  featured: boolean;
  coords: [number, number];
  active: boolean;
}

interface Props {
  pins: VenuePin[];
  onPinClick?: (id: string) => void;
}

// ─── Brand tokens ───────────────────────────────────────────────────────────
const NAVY = '#0A1A33';
const GREEN = '#00B368';
const GREEN_DARK = '#0A6B45';
const CREAM = '#F5F1E8';
const AMBER = '#FFB22E';

export default function MapView({ pins, onPinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const sigRef = useRef('');
  const [ready, setReady] = useState(false);

  // ── Init once ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([51.505, -0.10], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setTimeout(() => map.invalidateSize(), 200);
      setReady(true); // signal the marker-draw effect once the async map exists
    });
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── Rebuild markers when the filtered pin set changes (or once map is ready) ──
  useEffect(() => {
    if (!ready || !mapRef.current || !layerRef.current) return;
    const sig = pins.map(p => p.id + (p.featured ? 'F' : '') + (p.active ? 'A' : '')).join(',');
    if (sig === sigRef.current) return;
    sigRef.current = sig;

    import('leaflet').then((L) => {
      if (!layerRef.current || !mapRef.current) return;
      layerRef.current.clearLayers();
      markersRef.current = {};
      const pts: [number, number][] = [];

      pins.forEach((p) => {
        const color = p.featured ? GREEN : NAVY;
        const scale = p.active ? 1.3 : 1;
        const ring = p.active
          ? `box-shadow:0 0 0 6px rgba(255,178,46,0.4),0 4px 10px rgba(0,0,0,0.35);`
          : `box-shadow:0 4px 10px rgba(10,26,51,0.35);`;
        const icon = L.divIcon({
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -26],
          html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg) scale(${scale});background:${color};border:2.5px solid #fff;${ring}transition:transform .15s"></div>`,
        });
        const mk = L.marker(p.coords, { icon }).addTo(layerRef.current!);
        const typeLabel = p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : '';
        const meta = [typeLabel, p.area, p.priceLevel].filter(Boolean).join(' · ');
        const pick = p.featured
          ? `<span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:800;color:${GREEN_DARK}">⭐ Our Pick</span><br/>`
          : '';
        mk.bindPopup(
          `<div style="font-family:inherit;min-width:150px">` +
          `<strong style="color:${NAVY};font-size:14px">${p.name}</strong><br/>` +
          `<span style="color:#5B6577;font-size:12px">${meta}</span><br/>` +
          pick +
          `<a href="/venues/${p.id}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:700;color:${GREEN};text-decoration:none">View venue →</a>` +
          `</div>`
        );
        if (onPinClick) mk.on('click', () => onPinClick(p.id));
        markersRef.current[p.id] = mk;
        pts.push(p.coords);
      });

      const activePin = pins.find(p => p.active);
      if (activePin) markersRef.current[activePin.id]?.openPopup();

      if (pts.length) {
        try { mapRef.current!.fitBounds(pts, { padding: [50, 50], maxZoom: 14 }); } catch {}
      } else {
        mapRef.current!.setView([51.505, -0.10], 12);
      }
    });
  }, [pins, onPinClick, ready]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(10,26,51,0.12)', boxShadow: '0 8px 24px rgba(10,26,51,0.06)' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: CREAM }} />

      {/* Count label */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 800, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(6px)', border: '1px solid rgba(10,26,51,0.1)', borderRadius: 11, padding: '8px 12px', boxShadow: '0 4px 14px rgba(10,26,51,0.12)' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: GREEN_DARK }}>London</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: NAVY }}>{pins.length} on map</div>
      </div>

      {/* Empty state */}
      {pins.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(10,26,51,0.1)', borderRadius: 12, padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#5B6577', boxShadow: '0 4px 14px rgba(10,26,51,0.12)' }}>
            No mapped venues for these filters.
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 800, display: 'flex', gap: 13, flexWrap: 'wrap', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(6px)', border: '1px solid rgba(10,26,51,0.1)', borderRadius: 11, padding: '8px 12px', boxShadow: '0 4px 14px rgba(10,26,51,0.12)' }}>
        {[[GREEN, 'Our Pick'], [NAVY, 'Venue'], [AMBER, 'Selected']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: NAVY, fontWeight: 600 }}>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: c, flexShrink: 0 }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}
