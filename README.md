# Ош — Лучшие Места 🗺️

Сайт с интерактивной картой лучших мест Оша для туристов.

## Как запустить локально

```bash
npm install
npm run dev
```

Открыть: http://localhost:5173

## Как залить на Vercel

### Способ 1 — через GitHub (рекомендую)
1. Создай репозиторий на github.com
2. Загрузи все файлы
3. Зайди на vercel.com → "New Project" → выбери репозиторий
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Нажми Deploy — всё!

### Способ 2 — через Vercel CLI
```bash
npm install -g vercel
vercel
```

## Как добавить точные координаты мест

Сейчас координаты примерные. Чтобы поставить точные:
1. Открой Google Maps
2. Найди место
3. Нажми правую кнопку → "Что здесь?" (What's here?)
4. Внизу появятся координаты, например: `40.528312, 72.798541`
5. Открой файл `src/data/places.js`
6. Найди нужное место и замени `lat` и `lng`

## Как добавить новое место

В файле `src/data/places.js` добавь в массив PLACES:

```js
{
  id: 15,                          // уникальный номер
  name: 'Название места',
  description: 'Описание',
  category: ['food'],              // food / shashlik / samsa / pool / bank
  lat: 40.5283,                    // широта из Google Maps
  lng: 72.7985,                    // долгота из Google Maps
  address: 'Адрес',
  hours: '09:00 – 21:00',
  tip: 'Совет туристам',
},
```

## Структура проекта

```
src/
  data/
    places.js    ← все места (редактируй здесь)
  App.jsx        ← главный компонент (карта + список + фильтры)
  main.jsx       ← точка входа
  index.css      ← стили
```

## Технологии
- React 18 + Vite
- Tailwind CSS
- Leaflet + OpenStreetMap (бесплатно, без API ключа)
