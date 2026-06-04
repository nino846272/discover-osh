import { useState, useEffect, useRef } from 'react'
import { PLACES, CATEGORIES } from './data/places'
import {
  MapPin, UtensilsCrossed, Waves, DollarSign, X, Clock, Lightbulb, Phone, LocateFixed
} from 'lucide-react'
import { useLanguage } from './context/LanguageContext'

// Dynamic import of leaflet to avoid SSR issues
let L = null

const ICON_MAP = {
  MapPin: MapPin,
  UtensilsCrossed: UtensilsCrossed,
  Waves: Waves,
  DollarSign: DollarSign,
}

const CATEGORY_ICON_MAP = {
  pool: Waves,
  bank: DollarSign,
  food: UtensilsCrossed,
}

function getPlaceIcon(place) {
  for (const cat of place.category) {
    if (CATEGORY_ICON_MAP[cat]) return CATEGORY_ICON_MAP[cat]
  }
  return UtensilsCrossed
}

const CATEGORY_COLORS = {
  food: '#e85d20',
  pool: '#2980b9',
  bank: '#27ae60',
}

function getCategoryColor(place) {
  for (const cat of place.category) {
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat]
  }
  return '#e8a820'
}

function getPlaceField(place, field, tPlace) {
  return tPlace(place.id, field, place[field] ?? '')
}

function getMapLinkLabel(mapsUrl, t) {
  if (mapsUrl?.includes('2gis')) return t('ui.openIn2gis')
  if (mapsUrl?.includes('google') || mapsUrl?.includes('goo.gl')) return t('ui.openInGoogleMaps')
  return t('ui.openOnMap')
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

function createUserLocationIcon(leafletLib) {
  return leafletLib.divIcon({
    className: 'user-location-marker',
    html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function App() {
  const { lang, setLang, t, tPlace, tPlural } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [locating, setLocating] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const userCircleRef = useRef(null)
  const watchIdRef = useRef(null)

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

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  function locateUser() {
    if (!mapReady || !mapInstanceRef.current || !L) return

    if (!navigator.geolocation) {
      setLocationError('unavailable')
      return
    }

    setLocating(true)
    setLocationError(null)

    const onSuccess = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords
      const latlng = [latitude, longitude]
      const map = mapInstanceRef.current

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(latlng, {
          icon: createUserLocationIcon(L),
          zIndexOffset: 1000,
        }).addTo(map)
      } else {
        userMarkerRef.current.setLatLng(latlng)
      }

      if (userCircleRef.current) {
        userCircleRef.current.setLatLng(latlng).setRadius(accuracy)
      } else {
        userCircleRef.current = L.circle(latlng, {
          radius: accuracy,
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(map)
      }

      map.panTo(latlng, { animate: true })
      setLocating(false)
      setLocationError(null)
    }

    const onError = (err) => {
      setLocating(false)
      setLocationError(err.code === 1 ? 'denied' : 'unavailable')
    }

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    })
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ fontFamily: "'Nunito', sans-serif", background: '#1a1209' }}>

      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3" style={{ background: '#1a1209' }}>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h1 className="text-white font-black leading-none text-xl" style={{ fontFamily: "'Unbounded', sans-serif", letterSpacing: '-0.02em' }}>
              {t('ui.title')}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#e8a820' }}>{t('ui.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
              className="text-xs px-2.5 py-1 rounded-full font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: '#e8a820', color: '#e8a820', background: 'transparent' }}
            >
              {lang.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={{ background: '#e8a820', color: '#1a1209' }}
            >
              {t('ui.mobilePlacesButton')}
            </button>
            <a
              href="https://gastro-etno-tour.vercel.app"
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={{ background: '#e8a820', color: '#1a1209' }}
            >
              {t('ui.toursLink')}
            </a>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const IconComponent = ICON_MAP[cat.icon]
            return (
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
                {IconComponent && <IconComponent size={16} strokeWidth={2.5} />}
                <span>{t('categories.' + cat.id)}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden gap-0 md:flex-row flex-col">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[9999] bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — place list */}
        <div
          className={`fixed inset-y-0 left-0 z-[10000] w-72 transform overflow-y-auto bg-[#231608] border-r border-[#3d2e14] transition-transform duration-300 md:static md:translate-x-0 md:w-[300px] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between gap-2 p-3 border-b border-[#3d2e14] md:hidden">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7a5c2a' }}>
              {tPlural(filtered.length, 'ui.placesCount')}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: '#e8a820', color: '#1a1209' }}
            >
              {t('ui.close')}
            </button>
          </div>
          <div className="hidden p-3 text-xs font-semibold uppercase tracking-widest md:block" style={{ color: '#7a5c2a' }}>
            {tPlural(filtered.length, 'ui.placesCount')}
          </div>
          {filtered.map(place => (
            <button
              key={place.id}
              onClick={() => {
                setSelectedPlace(place)
                setSidebarOpen(false)
              }}
              className="w-full text-left px-4 py-3 transition-all"
              style={
                selectedPlace?.id === place.id
                  ? { background: '#3d2e14', borderLeft: `3px solid ${getCategoryColor(place)}` }
                  : { background: 'transparent', borderLeft: '3px solid transparent' }
              }
            >
              <div className="flex items-start gap-2">
                {(() => {
                  const IconComponent = getPlaceIcon(place)
                  return <IconComponent size={18} strokeWidth={2.5} className="text-current flex-shrink-0 mt-0.5" style={{ color: getCategoryColor(place) }} />
                })()}
                <div>
                  <p className="font-semibold text-sm leading-tight" style={{ color: '#f5e6c8' }}>{getPlaceField(place, 'name', tPlace)}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#7a5c2a' }}>{getPlaceField(place, 'description', tPlace)}</p>
                  {(getPlaceField(place, 'hours', tPlace) || place.hours) && (
                    <p className="text-xs mt-1" style={{ color: '#e8a820' }}>⏰ {getPlaceField(place, 'hours', tPlace) || place.hours}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map + detail panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div ref={mapRef} className="flex-1 relative z-0" />

          <div className="absolute left-3 bottom-24 z-[1000] flex flex-col items-start gap-2 md:bottom-3">
            <button
              type="button"
              onClick={locateUser}
              disabled={!mapReady || locating}
              title={t('ui.myLocation')}
              aria-label={t('ui.myLocation')}
              className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#fff', color: locating ? '#7a5c2a' : '#4285F4', border: '2px solid #e8a820' }}
            >
              <LocateFixed size={20} className={locating ? 'animate-pulse' : ''} />
            </button>
            {locationError && (
              <p
                className="max-w-[200px] text-xs px-2 py-1.5 rounded-lg shadow-md"
                style={{ background: '#231608', color: '#e8c87a', border: '1px solid #3d2e14' }}
              >
                {t(locationError === 'denied' ? 'ui.locationDenied' : 'ui.locationUnavailable')}
              </p>
            )}
          </div>

          {/* Selected place detail */}
          {selectedPlace && (
            <div
              className="flex-shrink-0 p-4"
              style={{ background: '#231608', borderTop: `3px solid ${getCategoryColor(selectedPlace)}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="font-black text-base leading-tight" style={{ fontFamily: "'Unbounded', sans-serif", color: '#f5e6c8', fontSize: '15px' }}>
                    {getPlaceField(selectedPlace, 'name', tPlace)}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#b89060' }}>{getPlaceField(selectedPlace, 'description', tPlace)}</p>
                  {(getPlaceField(selectedPlace, 'tip', tPlace) || selectedPlace.tip) && (
                    <div className="mt-2 text-xs px-2 py-1.5 rounded flex items-start gap-1.5" style={{ background: '#3d2e14', color: '#e8c87a' }}>
                      <Lightbulb size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{getPlaceField(selectedPlace, 'tip', tPlace) || selectedPlace.tip}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: '#7a5c2a' }}>
                    {(getPlaceField(selectedPlace, 'hours', tPlace) || selectedPlace.hours) && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="flex-shrink-0" />
                        {getPlaceField(selectedPlace, 'hours', tPlace) || selectedPlace.hours}
                      </span>
                    )}
                    {(getPlaceField(selectedPlace, 'address', tPlace) || selectedPlace.address) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="flex-shrink-0" />
                        {getPlaceField(selectedPlace, 'address', tPlace) || selectedPlace.address}
                      </span>
                    )}
                    {selectedPlace.phone && (
                      <a
                        href={`tel:+996${selectedPlace.phone.replace(/^0/, '')}`}
                        className="flex items-center gap-1 hover:opacity-80"
                        style={{ color: '#e8a820' }}
                      >
                        <Phone size={14} className="flex-shrink-0" />
                        {selectedPlace.phone}
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="text-sm p-1 rounded hover:opacity-75 transition-opacity"
                  style={{ color: '#7a5c2a', background: '#3d2e14' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedPlace.googleMapsUrl && (
                  <a
                    href={selectedPlace.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: '#e8a820', color: '#1a1209' }}
                  >
                    {t('ui.openInGoogleMaps')}
                  </a>
                )}
                {selectedPlace.mapsUrl && (
                  <a
                    href={selectedPlace.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={
                      selectedPlace.googleMapsUrl
                        ? { background: 'transparent', color: '#e8a820', border: '2px solid #e8a820' }
                        : { background: '#e8a820', color: '#1a1209' }
                    }
                  >
                    {getMapLinkLabel(selectedPlace.mapsUrl, t)}
                  </a>
                )}
                {!selectedPlace.googleMapsUrl && !selectedPlace.mapsUrl && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: '#e8a820', color: '#1a1209' }}
                  >
                    {t('ui.openOnMap')}
                  </a>
                )}
                {selectedPlace.website && (
                  <a
                    href={selectedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'transparent', color: '#e8a820', border: '2px solid #e8a820' }}
                  >
                    {t('ui.website')} →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
