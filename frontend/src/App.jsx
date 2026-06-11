import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Cabinets from "./pages/Cabinets.jsx";
import Products from "./pages/Products.jsx";
import NewRecipient from "./pages/NewRecipient.jsx";
import RecipientDetail from "./pages/RecipientDetail.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen muted">Carregando…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="topbar">
        <div className="brand">CA<span>LYX</span></div>
        <nav>
          <NavLink to="/" end>Armários</NavLink>
          <NavLink to="/products">Produtos</NavLink>
          <NavLink to="/new">Novo recipiente</NavLink>
          {user && (
            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
              Sair ({user.name})
            </a>
          )}
        </nav>
      </div>
      <div className="container">{children}</div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout><Cabinets /></Layout>
          </Protected>
        }
      />
      <Route
        path="/products"
        element={
          <Protected>
            <Layout><Products /></Layout>
          </Protected>
        }
      />
      <Route
        path="/new"
        element={
          <Protected>
            <Layout><NewRecipient /></Layout>
          </Protected>
        }
      />
      <Route
        path="/recipients/:id/edit"
        element={
          <Protected>
            <Layout><NewRecipient /></Layout>
          </Protected>
        }
      />
      <Route
        path="/recipients/:id"
        element={
          <Protected>
            <Layout><RecipientDetail /></Layout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
