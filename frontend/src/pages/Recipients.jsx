import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import ShapeIcon from "../components/ShapeIcon.jsx";
import { FORMATS, fmtNum, totalVolume } from "../calc";

export default function Recipients() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listRecipients().then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!items) return <p className="muted">Carregando…</p>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>
          <h1>Seus recipientes</h1>
          <p className="subtitle">Selecione um para registrar leituras e calcular o conteúdo</p>
        </div>
        <div className="spacer" />
        <Link to="/new"><button>+ Novo recipiente</button></Link>
      </div>

      {items.length === 0 ? (
        <div className="card empty">
          Nenhum recipiente ainda. <Link to="/new">Cadastre o primeiro</Link>.
        </div>
      ) : (
        <div className="hub-grid">
          {items.map((r) => (
            <button
              key={r.id}
              className="hub-card"
              onClick={() => navigate(`/recipients/${r.id}`)}
            >
              <span className="badge hub-badge">
                {FORMATS[r.format]?.label || r.format}
              </span>
              <div className="hub-illu">
                <ShapeIcon
                  format={r.format}
                  size={88}
                  fill={r.last_fill_percent ?? null}
                />
              </div>
              <div className="hub-name">{r.name}</div>
              {r.last_fill_percent != null ? (
                <>
                  <div className="hub-fill accent">{fmtNum(r.last_fill_percent)}% cheio</div>
                  <div className="gauge" style={{ width: "100%", marginTop: 6 }}>
                    <div style={{ width: `${Math.min(Math.max(r.last_fill_percent, 0), 100)}%` }} />
                  </div>
                </>
              ) : (
                <div className="hub-meta muted">sem leitura ainda</div>
              )}
              <div className="hub-meta muted" style={{ marginTop: 6 }}>
                {fmtNum(totalVolume(r.format, r.dimensions))} cm³ total
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
