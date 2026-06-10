import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card" style={{ width: 380 }} onSubmit={submit}>
        <div className="brand" style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          CA<span style={{ color: "var(--accent)" }}>LYX</span>
        </div>
        <p className="subtitle">Entre para gerenciar seus recipientes</p>

        <label>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          required
        />

        <label>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="error">{error}</div>}

        <div className="btn-row">
          <button type="submit" disabled={busy} style={{ flex: 1 }}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
