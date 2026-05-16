import { useState, useEffect, useRef } from 'react'
import { PLACES, CATEGORIES } from './data/places'

// Dynamic import of leaflet to avoid SSR issues
let L = null

const CATEGORY_COLORS = {
  food:     '#e85d20',
  shashlik: '#c0392b',
  samsa:    '#d35400',
  pool:     '#2980b9',
  bank:     '#27ae60',
}

function getCategoryColor(place) {
  for (const cat of place.category) {
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat]
  }
  return '#e8a820'
}

function createMarkerIcon(color, leafletLib) {
  return leafletLib.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid #fff;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
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

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
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
      mapInstanceRef.current.panTo([selectedPlace.lat, selectedPlace.lng], { animate: true })
    }
  }, [selectedPlace])

  return (
    <div className="h-screen w-screen flex flex-col" style={{ fontFamily: "'Nunito', sans-serif", background: '#1a1209' }}>

      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3" style={{ background: '#1a1209' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-white font-black leading-none text-xl" style={{ fontFamily: "'Unbounded', sans-serif", letterSpacing: '-0.02em' }}>
              ОШ
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#e8a820' }}>Лучшие места города</p>
          </div>
          <a
            href="#"
            className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={{ background: '#e8a820', color: '#1a1209' }}
          >
            ← Туры в Кыргызстан
          </a>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSelectedPlace(null) }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                activeCategory === cat.id
                  ? { background: cat.color, color: '#fff', border: `2px solid ${cat.color}` }
                  : { background: 'transparent', color: '#ccc', border: '2px solid #3d2e14' }
              }
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* Sidebar — place list */}
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{
            width: '300px',
            background: '#231608',
            borderRight: '1px solid #3d2e14',
          }}
        >
          <div className="p-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#7a5c2a' }}>
            {filtered.length} мест{filtered.length === 1 ? 'о' : filtered.length < 5 ? 'а' : ''}
          </div>
          {filtered.map(place => (
            <button
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className="w-full text-left px-4 py-3 transition-all"
              style={
                selectedPlace?.id === place.id
                  ? { background: '#3d2e14', borderLeft: `3px solid ${getCategoryColor(place)}` }
                  : { background: 'transparent', borderLeft: '3px solid transparent' }
              }
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">
                  {place.category.includes('pool') ? '🏊' :
                   place.category.includes('bank') ? '🏦' :
                   place.category.includes('shashlik') ? '🔥' :
                   place.category.includes('samsa') ? '🥟' : '🍽️'}
                </span>
                <div>
                  <p className="font-semibold text-sm leading-tight" style={{ color: '#f5e6c8' }}>{place.name}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#7a5c2a' }}>{place.description}</p>
                  {place.hours && (
                    <p className="text-xs mt-1" style={{ color: '#e8a820' }}>⏰ {place.hours}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map + detail panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div ref={mapRef} className="flex-1" />

          {/* Selected place detail */}
          {selectedPlace && (
            <div
              className="flex-shrink-0 p-4"
              style={{ background: '#231608', borderTop: `3px solid ${getCategoryColor(selectedPlace)}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="font-black text-base leading-tight" style={{ fontFamily: "'Unbounded', sans-serif", color: '#f5e6c8', fontSize: '15px' }}>
                    {selectedPlace.name}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#b89060' }}>{selectedPlace.description}</p>
                  {selectedPlace.tip && (
                    <div className="mt-2 text-xs px-2 py-1.5 rounded" style={{ background: '#3d2e14', color: '#e8c87a' }}>
                      💡 {selectedPlace.tip}
                    </div>
                  )}
                  <div className="flex gap-3 mt-2 text-xs" style={{ color: '#7a5c2a' }}>
                    {selectedPlace.hours && <span>⏰ {selectedPlace.hours}</span>}
                    {selectedPlace.address && <span>📍 {selectedPlace.address}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="text-sm px-2 py-1 rounded"
                  style={{ color: '#7a5c2a', background: '#3d2e14' }}
                >
                  ✕
                </button>
              </div>
              <a
                href={`https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#e8a820', color: '#1a1209' }}
              >
                Открыть в Google Maps →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
