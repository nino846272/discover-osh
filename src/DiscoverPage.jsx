import { useState, useEffect, useRef } from 'react'
import { PLACES, CATEGORIES } from './data/places'

// Dynamic import of leaflet to avoid SSR issues
let L = null

const CATEGORY_COLORS = {
  food:     '#f97316',
  shashlik: '#ef4444',
  samsa:    '#f59e0b',
  pool:     '#0ea5e9',
  bank:     '#10b981',
}

function getCategoryColor(place) {
  for (const cat of place.category) {
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat]
  }
  return '#eab308'
}

function createMarkerIcon(color, leafletLib) {
  return leafletLib.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background: linear-gradient(135deg, ${color}, #00000040);
      border:3px solid #ffffff;
      transform:rotate(-45deg);
      box-shadow: 0 8px 16px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    "></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  })
}

export default function DiscoverPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const filtered = activeCategory === 'all'
    ? PLACES
    : PLACES.filter(p => p.category.includes(activeCategory))

  // Init map
  useEffect(() => {
    async function initMap() {
      const leaflet = await import('leaflet')
      L = leaflet.default

      if (mapInstanceRef.current || !mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [40.5283, 72.7985],
        zoom: 14,
        zoomControl: false,
      })

      L.control.zoom({ position: 'topright' }).addTo(map)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CartoDB',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
    }
    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when filter changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !L) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    filtered.forEach(place => {
      const color = getCategoryColor(place)
      const icon = createMarkerIcon(color, L)
      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(mapInstanceRef.current)
        .on('click', () => {
          setSelectedPlace(place)
          setSidebarOpen(false)
        })
      markersRef.current.push(marker)
    })
  }, [mapReady, activeCategory, filtered])

  // Fly to selected place
  useEffect(() => {
    if (selectedPlace && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedPlace.lat, selectedPlace.lng], 16, { animate: true, duration: 1.5 })
    }
  }, [selectedPlace])

  // Close drawer on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Shared sidebar list content (used in both desktop sidebar and mobile drawer)
  const SidebarContent = () => (
    <>
      <div className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50 z-20 flex items-center justify-between">
        <span>{filtered.length} place{filtered.length !== 1 ? 's' : ''} found</span>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden w-7 h-7 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>
      <div className="py-2 overflow-y-auto flex-1 min-h-0">
        {filtered.map(place => {
          const isSelected = selectedPlace?.id === place.id
          const color = getCategoryColor(place)
          return (
            <button
              key={place.id}
              onClick={() => {
                setSelectedPlace(place)
                setSidebarOpen(false)
              }}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${
                isSelected ? 'bg-slate-800/70' : 'hover:bg-slate-800/30'
              }`}
              style={isSelected
                ? { borderLeft: `3px solid ${color}`, paddingLeft: '13px' }
                : { borderLeft: '3px solid transparent', paddingLeft: '13px' }
              }
            >
              {/* Category color dot */}
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: color, boxShadow: isSelected ? `0 0 8px ${color}80` : 'none' }}
              />
              {/* Place name */}
              <span className={`flex-1 min-w-0 text-sm font-semibold truncate transition-colors ${
                isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
              }`}>
                {place.name}
              </span>
              {/* Open time */}
              {place.hours && (
                <span className="text-[11px] text-slate-500 flex-shrink-0 font-mono">
                  {place.hours.split('–')[0].trim()}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-amber-500/30 selection:text-amber-200">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60 shadow-lg z-10">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div>
            <h1 className="font-black leading-none text-3xl md:text-4xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
              OSH
            </h1>
            <p className="text-xs mt-1 text-slate-400 font-medium tracking-wide uppercase">My favorite places in Osh</p>
          </div>
          <a
            href="#"
            className="text-xs px-3 md:px-4 py-2 rounded-full font-bold transition-all duration-300 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600 shadow-sm"
          >
            ← Tours in Kyrgyzstan
          </a>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSelectedPlace(null) }}
                className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 ease-out transform hover:-translate-y-0.5 ${
                  isActive
                    ? 'shadow-lg scale-105'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                }`}
                style={isActive ? {
                  background: `${cat.color}20`,
                  color: cat.color,
                  border: `1px solid ${cat.color}50`,
                  boxShadow: `0 4px 12px ${cat.color}30`
                } : {}}
              >
                <span className="text-sm md:text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* DESKTOP: Sidebar always visible at md+ */}
        <div className="hidden md:flex w-[340px] flex-shrink-0 bg-slate-900/60 backdrop-blur-lg border-r border-slate-800/60 z-10 flex-col overflow-hidden">
          <SidebarContent />
        </div>

        {/* MOBILE: Backdrop overlay (dims the map when drawer is open) */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MOBILE: Slide-in drawer */}
        <div
          className="md:hidden fixed top-0 left-0 h-full z-40 flex flex-col bg-slate-900 border-r border-slate-800/60 shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden"
          style={{
            width: 'min(85vw, 340px)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          {/* Spacer so content clears the fixed app header height */}
          <div className="pt-[72px] flex flex-col flex-1 overflow-hidden">
            <SidebarContent />
          </div>
        </div>

        {/* ── MAP ── */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0 z-0" />

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none z-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]"></div>

          {/* MOBILE: Floating toggle button */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="md:hidden absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 text-slate-200 shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            aria-label="Toggle place list"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Places</span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: '#f97316' }}
            >
              {filtered.length}
            </span>
          </button>

          {/* Selected place detail — floating card (hidden while sidebar drawer is open) */}
          {selectedPlace && !sidebarOpen && (
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg z-[1000] px-3 md:px-4">
              <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${getCategoryColor(selectedPlace)}, transparent)` }}></div>
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-black text-lg md:text-xl leading-tight text-white mb-1.5">
                        {selectedPlace.name}
                      </h2>
                      <p className="text-sm text-slate-300 leading-relaxed mb-3">{selectedPlace.description}</p>

                      {selectedPlace.tip && (
                        <div className="mb-3 text-xs p-3 rounded-xl bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 flex items-start gap-2">
                          <span className="text-indigo-400 shrink-0">💡</span>
                          <span>{selectedPlace.tip}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-400">
                        {selectedPlace.hours && <div className="flex items-center gap-1.5"><span className="text-slate-500">🕒</span> {selectedPlace.hours}</div>}
                        {selectedPlace.address && <div className="flex items-center gap-1.5"><span className="text-slate-500">📍</span> {selectedPlace.address}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPlace(null)}
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-end">
                    <a
                      href={`https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full bg-slate-100 text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md"
                    >
                      Open in Google Maps ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
