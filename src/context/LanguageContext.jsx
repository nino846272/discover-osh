import React, { createContext, useContext, useState, useEffect } from 'react'
import ru from '../locales/ru.json'
import en from '../locales/en.json'

const translations = { ru, en }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  // Load initial language from localStorage if available, default to 'ru'
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('app_lang')
    return saved === 'en' || saved === 'ru' ? saved : 'ru'
  })

  const setLang = (newLang) => {
    if (newLang === 'en' || newLang === 'ru') {
      setLangState(newLang)
      localStorage.setItem('app_lang', newLang)
    }
  }

  // Translation helper
  const t = (path) => { 
    const keys = path.split('.')
    let current = translations[lang]
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key]
      } else {
        // Fallback to Russian translation if key is missing in English
        let fallback = translations['ru']
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey]
          } else {
            return path
          }
        }
        return fallback
      }
    }
    return current
  }

  // Place fields: current language only, then fallback from places.js (never RU when EN is on)
  const tPlace = (placeId, field, fallback = '') => {
    const id = String(placeId)
    const value = translations[lang]?.places?.[id]?.[field]
    return value !== undefined ? value : fallback
  }

  // Pluralization translation helper
  const tPlural = (count, keyPrefix) => {
    if (lang === 'ru') {
      const mod10 = count % 10
      const mod100 = count % 100
      let form = 'many'
      if (mod100 >= 11 && mod100 <= 19) {
        form = 'many'
      } else if (mod10 === 1) {
        form = 'one'
      } else if (mod10 >= 2 && mod10 <= 4) {
        form = 'few'
      }
      return t(`${keyPrefix}.${form}`)
    } else {
      const form = count === 1 ? 'one' : 'other'
      return t(`${keyPrefix}.${form}`)
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tPlace, tPlural }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
