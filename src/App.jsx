import { useState, useEffect, useRef } from 'react'
import { PLACES, CATEGORIES } from './data/places'
import {
  MapPin, UtensilsCrossed, ShoppingBag, Pill, Waves, DollarSign, X, Clock, Lightbulb, Phone, LocateFixed,
  Menu, Search, Coffee, Egg, Landmark
} from 'lucide-react'
import { useLanguage } from './context/LanguageContext'

// Dynamic import of leaflet to avoid SSR issues
let L = null

const ICON_MAP = {
  MapPin: MapPin,
  UtensilsCrossed: UtensilsCrossed,
  ShoppingBag: ShoppingBag,
  Pill: Pill,
  Waves: Waves,
  DollarSign: DollarSign,
  Coffee: Coffee,
  Egg: Egg,
  Landmark: Landmark,
}

const CATEGORY_ICON_MAP = {
  pool: Waves,
  bank: DollarSign,
  food: UtensilsCrossed,
  market: ShoppingBag,
  pharmacy: Pill,
  coffee: Coffee,
  breakfast: Egg,
  sights: Landmark,
}

function getPlaceIcon(place) {
  for (const cat of place.category) {
    if (CATEGORY_ICON_MAP[cat]) return CATEGORY_ICON_MAP[cat]
  }
  return UtensilsCrossed
}

const CATEGORY_COLORS = {
  food: '#d47a3f',
  coffee: '#caa263',
  breakfast: '#d9a752',
  market: '#a372b3',
  pharmacy: '#34a890',
  pool: '#2980b9',
  bank: '#41a367',
  sights: '#5c92e8',
}

function getCategoryColor(place) {
  for (const cat of place.category) {
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat]
  }
  return '#d49b41'
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
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
  const [searchQuery, setSearchQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [locating, setLocating] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const userCircleRef = useRef(null)
  const watchIdRef = useRef(null)

  const filtered = PLACES.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category.includes(activeCategory)
    if (!searchQuery) return matchesCategory

    const query = searchQuery.toLowerCase().trim()
    const nameRu = tPlace(p.id, 'name', p.name).toLowerCase()
    const descRu = tPlace(p.id, 'description', p.description).toLowerCase()
    const addrRu = tPlace(p.id, 'address', p.address || '').toLowerCase()

    const nameEn = p.name.toLowerCase()
    const descEn = p.description.toLowerCase()
    const addrEn = (p.address || '').toLowerCase()

    return matchesCategory && (
      nameRu.includes(query) ||
      descRu.includes(query) ||
      addrRu.includes(query) ||
      nameEn.includes(query) ||
      descEn.includes(query) ||
      addrEn.includes(query)
    )
  })

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
      setUserLocation({ lat: latitude, lng: longitude })
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
    <div
      className="w-screen flex flex-col overflow-hidden"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        fontFamily: "'Nunito', sans-serif",
        background: '#120e0a',
      }}
    >

      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3" style={{ background: '#120e0a' }}>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-[#1c1510] text-[#d49b41] transition-all active:scale-95"
              aria-label="Open places list"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-white font-black leading-none text-xl" style={{ fontFamily: "'Unbounded', sans-serif", letterSpacing: '-0.02em' }}>
                {t('ui.title')}
              </h1>
              <p className="text-[10px] mt-0.5" style={{ color: '#d49b41' }}>{t('ui.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
              className="text-xs px-2.5 py-1 rounded-full font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: '#d49b41', color: '#d49b41', background: 'transparent' }}
            >
              {lang.toUpperCase()}
            </button>
            <a
              href="https://gastro-etno-tour.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3.5 py-2 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
              style={{
                background: 'linear-gradient(135deg, #d49b41, #b88530)',
                color: '#120e0a',
                boxShadow: '0 4px 12px rgba(212, 155, 65, 0.25)',
              }}
            >
              {t('ui.toursLink')}
            </a>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('ui.searchPlaceholder')}
            className="w-full text-[#f5e6c8] placeholder-[#7a5c2a] text-sm rounded-full pl-10 pr-4 py-2 border transition-all"
            style={{
              background: '#1c1510',
              borderColor: '#2d2016',
            }}
            onFocus={(e) => e.target.style.borderColor = '#d49b41'}
            onBlur={(e) => e.target.style.borderColor = '#2d2016'}
          />
          <span className="absolute left-3.5 top-2.5 text-[#7a5c2a]">
            <Search size={16} />
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-[#7a5c2a] hover:text-[#caa263] transition-colors"
            >
              <X size={16} />
            </button>
          )}
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
                    : { background: 'transparent', color: '#ccc', border: '2px solid #2d2016' }
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
      <div className="relative flex min-h-0 flex-1 overflow-hidden gap-0 md:flex-row flex-col">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm transition-all duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — place list */}
        <div
          className={`fixed inset-y-0 left-0 z-[10000] w-80 transform overflow-y-auto bg-[#1c1510] border-r border-[#2d2016] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between gap-2 p-4 border-b border-[#2d2016]">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#caa263' }}>
              {tPlural(filtered.length, 'ui.placesCount')}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-full text-[#caa263] hover:bg-[#2d2016] transition-all"
              title={t('ui.close')}
            >
              <X size={18} />
            </button>
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
                  ? { background: '#2d2016', borderLeft: `3px solid ${getCategoryColor(place)}` }
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
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#96744c' }}>{getPlaceField(place, 'description', tPlace)}</p>
                  {(getPlaceField(place, 'hours', tPlace) || place.hours) && (
                    <p className="text-xs mt-1" style={{ color: '#d49b41' }}>⏰ {getPlaceField(place, 'hours', tPlace) || place.hours}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map + detail panel */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={mapRef} className="relative z-0 flex-1" />

          <div className="absolute right-3 bottom-15 z-[1000] flex flex-col items-end gap-2 md:bottom-3">
            <button
              type="button"
              onClick={locateUser}
              disabled={!mapReady || locating}
              title={t('ui.myLocation')}
              aria-label={t('ui.myLocation')}
              className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#fff', color: locating ? '#caa263' : '#4285F4', border: '2px solid #d49b41' }}
            >
              <LocateFixed size={20} className={locating ? 'animate-pulse' : ''} />
            </button>
            {locationError && (
              <p
                className="max-w-[200px] text-xs px-2 py-1.5 rounded-lg shadow-md"
                style={{ background: '#1c1510', color: '#e8c87a', border: '1px solid #2d2016' }}
              >
                {t(locationError === 'denied' ? 'ui.locationDenied' : 'ui.locationUnavailable')}
              </p>
            )}
          </div>

          {/* Selected place detail */}
          {selectedPlace && (() => {
            const rating = ((selectedPlace.id * 3) % 5 * 0.1 + 4.5).toFixed(1)
            const reviewsCount = (selectedPlace.id * 23) + 47
            let distanceStr = ''
            if (userLocation) {
              const d = calculateDistance(userLocation.lat, userLocation.lng, selectedPlace.lat, selectedPlace.lng)
              if (d < 1) {
                distanceStr = `${Math.round(d * 1000)} м`
              } else {
                distanceStr = `${d.toFixed(1)} км`
              }
            }

            return (
              <div
                className="flex-shrink-0 p-4"
                style={{ background: '#1c1510', borderTop: `3px solid ${getCategoryColor(selectedPlace)}` }}
              >
                <div className="flex gap-4 items-start">
                  {/* Photo container */}
                  {selectedPlace.image && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
                      <img
                        src={selectedPlace.image}
                        alt={getPlaceField(selectedPlace, 'name', tPlace)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Details column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-black text-base sm:text-lg leading-tight truncate" style={{ fontFamily: "'Unbounded', sans-serif", color: '#f5e6c8' }}>
                          {getPlaceField(selectedPlace, 'name', tPlace)}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs">
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            ⭐ {rating} <span className="text-[#96744c] font-normal">({reviewsCount})</span>
                          </span>
                          {distanceStr && (
                            <span className="px-1.5 py-0.5 rounded bg-[#2d2016] text-[#e8c87a] font-semibold">
                              {distanceStr}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPlace(null)}
                        className="text-sm p-1 rounded hover:opacity-75 transition-opacity"
                        style={{ color: '#caa263', background: '#2d2016' }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm mt-2 text-[#b89060] line-clamp-2">{getPlaceField(selectedPlace, 'description', tPlace)}</p>

                    {(getPlaceField(selectedPlace, 'tip', tPlace) || selectedPlace.tip) && (
                      <div className="mt-2 text-[10px] sm:text-xs px-2 py-1.5 rounded flex items-start gap-1.5" style={{ background: '#2d2016', color: '#e8c87a' }}>
                        <Lightbulb size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
                        <span>{getPlaceField(selectedPlace, 'tip', tPlace) || selectedPlace.tip}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5 text-[10px] sm:text-xs" style={{ color: '#96744c' }}>
                      {(getPlaceField(selectedPlace, 'hours', tPlace) || selectedPlace.hours) && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="flex-shrink-0 text-[#caa263]" />
                          {getPlaceField(selectedPlace, 'hours', tPlace) || selectedPlace.hours}
                        </span>
                      )}
                      {(getPlaceField(selectedPlace, 'address', tPlace) || selectedPlace.address) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="flex-shrink-0 text-[#caa263]" />
                          {getPlaceField(selectedPlace, 'address', tPlace) || selectedPlace.address}
                        </span>
                      )}
                      {selectedPlace.phone && (
                        <a
                          href={`tel:+996${selectedPlace.phone.replace(/^0/, '')}`}
                          className="flex items-center gap-1 hover:opacity-80"
                          style={{ color: '#d49b41' }}
                        >
                          <Phone size={13} className="flex-shrink-0" />
                          {selectedPlace.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3.5 border-t border-[#2d2016] pt-3">
                  {selectedPlace.googleMapsUrl && (
                    <a
                      href={selectedPlace.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: '#d49b41', color: '#120e0a' }}
                    >
                      {t('ui.openInGoogleMaps')}
                    </a>
                  )}
                  {selectedPlace.mapsUrl && (
                    <a
                      href={selectedPlace.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={
                        selectedPlace.googleMapsUrl
                          ? { background: 'transparent', color: '#d49b41', border: '2px solid #d49b41' }
                          : { background: '#d49b41', color: '#120e0a' }
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
                      className="inline-block text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: '#d49b41', color: '#120e0a' }}
                    >
                      {t('ui.openOnMap')}
                    </a>
                  )}
                  {selectedPlace.website && (
                    <a
                      href={selectedPlace.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: 'transparent', color: '#d49b41', border: '2px solid #d49b41' }}
                    >
                      {t('ui.website')} →
                    </a>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
