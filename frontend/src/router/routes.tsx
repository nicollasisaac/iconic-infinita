// src/router/routes.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnalyticsObserver } from "@/components/AnalyticsObserver";
import { useAuth } from "@/contexts/AuthContext";

/* ───── páginas principais ───── */
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import EventDetail from "@/pages/EventDetail";
import QRCodeScreen from "@/pages/QRCodeScreen";
import ScannerScreen from "@/pages/ScannerScreen";

/* ───── live events (única página) ───── */
import LiveEventsPage from "@/pages/LiveEventsPage";

/* ───── gestão de eventos do owner ───── */
import MyEventsPage from "@/pages/MyEventsPage";
import CreateEditEventPage from "@/pages/CreateEditEventPage";

/* ───── utilitários ───── */
import TicketsPage from "@/pages/TicketsPage";
import IconicNetworkPage from "@/pages/IconicNetworkPage";
import Profile from "@/pages/Profile";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AnalyticsObserver />

      <Routes>
        {/* ------------- auth ------------- */}
        <Route path="/login" element={<Login />} />

        {/* ------------- home ------------- */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        {/* ------------- live events (lista + execução) ------------- */}
        <Route
          path="/live-events"
          element={
            <PrivateRoute>
              <LiveEventsPage />
            </PrivateRoute>
          }
        />

        {/* ------------- owner: meus eventos ------------- */}
        <Route
          path="/my-events"
          element={
            <PrivateRoute>
              <MyEventsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-events/new"
          element={
            <PrivateRoute>
              <CreateEditEventPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-events/:eventId"
          element={
            <PrivateRoute>
              <CreateEditEventPage />
            </PrivateRoute>
          }
        />

        {/* ------------- eventos gerais ------------- */}
        <Route
          path="/events/:id"
          element={
            <PrivateRoute>
              <EventDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:id/checkin"
          element={
            <PrivateRoute>
              <QRCodeScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:id/scan"
          element={
            <PrivateRoute>
              <ScannerScreen />
            </PrivateRoute>
          }
        />

        {/* ------------- util ------------- */}
        <Route
          path="/tickets"
          element={
            <PrivateRoute>
              <TicketsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/iconic-network"
          element={
            <PrivateRoute>
              <IconicNetworkPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* ------------- fallback ------------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
