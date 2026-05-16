import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DiscoverPage from './DiscoverPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<DiscoverPage/>} />
      </Routes>
    </BrowserRouter>
  )
}
