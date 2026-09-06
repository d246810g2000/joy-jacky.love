import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles.css';
import App from './App';
import RSVPPage from './pages/RSVPPage';
import InvitationCardPage from './pages/InvitationCardPage';
import BingoPage from './pages/BingoPage';
import QuizPage from './pages/QuizPage';
import CheerPage from './pages/CheerPage';
import PlaylistPage from './pages/PlaylistPage';
import PhotoPage from './pages/PhotoPage';
import { VisitCounterProvider } from './components/VisitCounterProvider';
import { ALBUM_ROUTE } from './constants';

function LegacyPhotoRedirect() {
  const location = useLocation();
  return <Navigate to={`${ALBUM_ROUTE}${location.search}${location.hash}`} replace />;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <VisitCounterProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/rsvp" element={<RSVPPage />} />
          <Route path="/invitation" element={<InvitationCardPage />} />
          <Route path="/bingo" element={<BingoPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/cheer" element={<CheerPage />} />
          <Route path="/playlist" element={<PlaylistPage />} />
          <Route path={ALBUM_ROUTE} element={<PhotoPage />} />
          <Route path="/photo" element={<LegacyPhotoRedirect />} />
        </Routes>
      </BrowserRouter>
    </VisitCounterProvider>
  </React.StrictMode>
);