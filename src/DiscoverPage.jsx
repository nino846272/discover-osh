import { useState, useEffect, useRef } from 'react'
import { PLACES, CATEGORIES } from './data/places'

// Dynamic import of leaflet to avoid SSR issues
let L = null

const CATEGORY_COLORS = {
  food:     '#f97316', // orange-500
  shashlik: '#ef4444', // red-500
  samsa:    '#f59e0b', // amber-500
  pool:     '#0ea5e9', // sky-500
  bank:     '#10b981', // emerald-500
}

function getCategoryColor(place) {
  for (const cat of place.category) {
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat]
  }
  return '#eab308' // yellow-500
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

      // Using CartoDB dark matter for a premium dark map
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
        .on('click', () => setSelectedPlace(place))
      markersRef.current.push(marker)
    })
  }, [mapReady, activeCategory, filtered])

  // Pan to selected
  useEffect(() => {
    if (selectedPlace && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedPlace.lat, selectedPlace.lng], 16, { animate: true, duration: 1.5 })
    }
  }, [selectedPlace])

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Header */}
      <header className="flex-shrink-0 px-6 pt-5 pb-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60 shadow-lg z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-black leading-none text-4xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 drop-shadow-sm">
              OSH
            </h1>
            <p className="text-xs mt-1 text-slate-400 font-medium tracking-wide uppercase">Best places in the city</p>
          </div>
          <a
            href="#"
            className="text-xs px-4 py-2 rounded-full font-bold transition-all duration-300 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600 shadow-sm"
          >
            ← Tours in Kyrgyzstan
          </a>
        </div>

        {/* Category filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSelectedPlace(null) }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-out transform hover:-translate-y-0.5 ${
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
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar — place list */}
        <div className="w-[340px] flex-shrink-0 overflow-y-auto bg-slate-900/60 backdrop-blur-lg border-r border-slate-800/60 z-10 flex flex-col">
          <div className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 z-20">
            {filtered.length} place{filtered.length !== 1 ? 's' : ''} found
          </div>
          <div className="p-3 flex flex-col gap-2">
            {filtered.map(place => {
              const isSelected = selectedPlace?.id === place.id;
              const color = getCategoryColor(place);
              return (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/80 shadow-lg translate-x-1'
                      : 'bg-transparent hover:bg-slate-800/40'
                  }`}
                  style={isSelected ? { borderLeft: `4px solid ${color}` } : { borderLeft: '4px solid transparent' }}
                >
                  {isSelected && (
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}></div>
                  )}
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      {place.category.includes('pool') ? '🏊' :
                       place.category.includes('bank') ? '🏦' :
                       place.category.includes('shashlik') ? '🔥' :
                       place.category.includes('samsa') ? '🥟' : '🍽️'}
                    </div>
                    <div>
                      <p className={`font-bold text-[15px] leading-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>{place.name}</p>
                      <p className="text-xs mt-1.5 text-slate-400 line-clamp-2 leading-relaxed">{place.description}</p>
                      {place.hours && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-slate-500">
                          <span className="text-slate-400">🕒</span> {place.hours}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0 z-0" />
          
          {/* Subtle vignette over the map */}
          <div className="absolute inset-0 pointer-events-none z-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]"></div>

          {/* Selected place detail - Floating Card */}
          {selectedPlace && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-[1000] px-4 animate-in fade-in slide-in-from-bottom-8 duration-300">
              <div 
                className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${getCategoryColor(selectedPlace)}, transparent)` }}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-black text-xl leading-tight text-white mb-2">
                        {selectedPlace.name}
                      </h2>
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">{selectedPlace.description}</p>
                      
                      {selectedPlace.tip && (
                        <div className="mb-4 text-xs p-3 rounded-xl bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 flex items-start gap-2">
                          <span className="text-indigo-400 shrink-0">💡</span> 
                          <span>{selectedPlace.tip}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-slate-400">
                        {selectedPlace.hours && <div className="flex items-center gap-1.5"><span className="text-slate-500">🕒</span> {selectedPlace.hours}</div>}
                        {selectedPlace.address && <div className="flex items-center gap-1.5"><span className="text-slate-500">📍</span> {selectedPlace.address}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPlace(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-end">
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
