'use client';

import { useEffect, useRef } from 'react';
import type { Map as LMap, LayerGroup } from 'leaflet';

export interface VenuePin {
  id: string;
  name: string;
  space: 'now' | 'filling' | 'full';
  kickoff: string;
  coords: [number, number];
  active: boolean;
}

interface Props {
  pins: VenuePin[];
  onPinClick: (id: string) => void;
}

const SPACE_COLOR: Record<string, string> = {
  now: '#00B368',
  filling: '#E0922A',
  full: '#9AA3B0',
};
const SPACE_LABEL: Record<string, string> = {
  now: 'Space now',
  filling: 'Filling up',
  full: 'Full tonight',
};

export default function MapView({ pins, onPinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const sigRef = useRef('');

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
    });
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    const sig = pins.map(p => p.id + p.space + p.active).join(',');
    if (sig === sigRef.current) return;
    sigRef.current = sig;

    import('leaflet').then((L) => {
      if (!layerRef.current || !mapRef.current) return;
      layerRef.current.clearLayers();
      const pts: [number, number][] = [];

      pins.forEach((p) => {
        const color = SPACE_COLOR[p.space] || '#00B368';
        const scale = p.active ? 1.3 : 1;
        const ring = p.active ? `box-shadow:0 0 0 6px rgba(255,178,46,0.35),0 4px 10px rgba(0,0,0,0.35);` : `box-shadow:0 4px 10px rgba(0,0,0,0.35);`;
        const icon = L.divIcon({
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -26],
          html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg) scale(${scale});background:${color};border:2.5px solid #fff;${ring}transition:transform .15s"></div>`,
        });
        const mk = L.marker(p.coords, { icon }).addTo(layerRef.current!);
        mk.bindPopup(`<strong>${p.name}</strong><br>${SPACE_LABEL[p.space]} · ${p.kickoff}`);
        mk.on('click', () => onPinClick(p.id));
        pts.push(p.coords);
      });

      if (pts.length) {
        try { mapRef.current!.fitBounds(pts, { padding: [50, 50], maxZoom: 14 }); } catch {}
      }
    });
  }, [pins, onPinClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(10,26,51,0.12)', boxShadow: '0 8px 24px rgba(10,26,51,0.06)' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#E8EBE6' }} />
      {/* Map overlay: count label */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 800, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(6px)', border: '1px solid rgba(10,26,51,0.1)', borderRadius: 11, padding: '8px 12px', boxShadow: '0 4px 14px rgba(10,26,51,0.12)' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#0A6B45' }}>London · live</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: '#0A1A33' }}>{pins.length} venues</div>
      </div>
      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 800, display: 'flex', gap: 13, flexWrap: 'wrap', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(6px)', border: '1px solid rgba(10,26,51,0.1)', borderRadius: 11, padding: '8px 12px', boxShadow: '0 4px 14px rgba(10,26,51,0.12)' }}>
        {[['#00B368','Space now'],['#E0922A','Filling up'],['#9AA3B0','Full']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0A1A33', fontWeight: 600 }}>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: c, flexShrink: 0 }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}
