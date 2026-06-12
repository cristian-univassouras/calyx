import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth.jsx";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.register(form);
      await login(form.email, form.password);
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
        <h1>Criar conta</h1>
        <p className="subtitle">É rápido</p>

        <label>Nome</label>
        <input value={form.name} onChange={set("name")} required />

        <label>E-mail</label>
        <input type="email" value={form.email} onChange={set("email")} required />

        <label>Senha (mín. 6 caracteres)</label>
        <input
          type="password"
          value={form.password}
          onChange={set("password")}
          minLength={6}
          required
        />

        {error && <div className="error">{error}</div>}

        <div className="btn-row">
          <button type="submit" disabled={busy} style={{ flex: 1 }}>
            {busy ? "Criando…" : "Cadastrar"}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
