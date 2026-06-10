import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, API_BASE } from "../api";
import ShapeIcon from "../components/ShapeIcon.jsx";
import {
  FORMATS,
  KEY_LABELS,
  filledVolume,
  fmtNum,
  totalHeight,
  totalVolume,
} from "../calc";

export default function RecipientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState(null);
  const [product, setProduct] = useState(null);
  const [distance, setDistance] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getRecipient(id).then(async (r) => {
      setRecipient(r);
      if (r.product_id) {
        const products = await api.listProducts().catch(() => []);
        setProduct(products.find((p) => p.id === r.product_id) || null);
      }
    }).catch((e) => setError(e.message));
  }, [id]);

  // Nivel atual ao vivo: consulta a ultima leitura do sensor a cada 5s
  useEffect(() => {
    let active = true;
    const poll = () =>
      api.currentFill(id)
        .then((f) => active && setLive(f))
        .catch(() => active && setLive(null));
    poll();
    const t = setInterval(poll, 5000);
    return () => { active = false; clearInterval(t); };
  }, [id]);

  // preview ao vivo enquanto digita a distancia (sem gravar)
  const preview = useMemo(() => {
    if (!recipient || distance === "") return null;
    const d = Number(distance);
    const total = totalVolume(recipient.format, recipient.dimensions);
    const filled = filledVolume(recipient.format, recipient.dimensions, d);
    const percent = total > 0 ? (filled / total) * 100 : 0;
    const mass = product ? filled * product.density : null;
    return { filled, total, percent, mass };
  }, [recipient, distance, product]);

  if (error) return <div className="error">{error}</div>;
  if (!recipient) return <p className="muted">Carregando…</p>;

  const hTotal = totalHeight(recipient.format, recipient.dimensions);

  const save = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await api.createMeasurement(id, Number(distance));
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Excluir este recipiente?")) return;
    await api.deleteRecipient(id).catch((e) => setError(e.message));
    navigate("/");
  };

  const shown = result || preview;
  const percent = result ? result.fill_percent : preview?.percent;
  const filled = result ? result.filled_volume_cm3 : preview?.filled;
  const mass = result ? result.mass_g : preview?.mass;

  return (
    <>
      <button className="link-btn" onClick={() => navigate("/")}>← Voltar</button>
      <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
        <div>
          <h1>{recipient.name}</h1>
          <p className="subtitle">
            {FORMATS[recipient.format]?.label} ·{" "}
            {product
              ? `${product.icon ? product.icon + " " : ""}${product.name} (${product.density} g/cm³)`
              : "sem produto"}
          </p>
        </div>
        <div className="spacer" />
        <button className="secondary" style={{ marginRight: 10 }}
          onClick={() => navigate(`/recipients/${id}/edit`)}>Editar</button>
        <button className="danger" onClick={remove}>Excluir</button>
      </div>

      <div className="card">
        <h2><span className="live-dot" />Nível atual (sensor)</h2>
        {live ? (
          <div className="fill-view" style={{ marginTop: 4 }}>
            <div className="fill-shape" style={{ color: "var(--accent)" }}>
              <ShapeIcon format={recipient.format} size={120} fill={live.fill_percent} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="gauge">
                <div style={{ width: `${Math.min(Math.max(live.fill_percent, 0), 100)}%` }} />
              </div>
              <div className="stat-grid">
                <div className="stat">
                  <div className="label">Preenchido</div>
                  <div className="value accent">{fmtNum(live.fill_percent)}%</div>
                </div>
                <div className="stat">
                  <div className="label">Conteúdo</div>
                  <div className="value">{fmtNum(live.filled_volume_cm3)} cm³</div>
                </div>
                <div className="stat">
                  <div className="label">Peso estimado</div>
                  <div className="value accent">
                    {live.mass_g != null ? `${fmtNum(live.mass_g)} g` : "—"}
                  </div>
                </div>
                <div className="stat">
                  <div className="label">Distância lida</div>
                  <div className="value">{fmtNum(live.distance_from_lid)} cm</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted">Aguardando a primeira leitura do sensor…</p>
        )}
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          Atualiza automaticamente a cada 5s conforme o sensor envia dados.
        </p>
      </div>

      <div className="card">
        <h2>Sensor IoT (dispositivo)</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Configure seu leitor para enviar a distância para o endpoint abaixo, usando
          este token. A resposta traz o % cheio.
        </p>
        <label>Token do dispositivo</label>
        <div className="token-box">
          <span style={{ flex: 1 }}>{recipient.device_token}</span>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              navigator.clipboard?.writeText(recipient.device_token);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "✓ copiado" : "copiar"}
          </button>
        </div>
        <div className="code-block">{`POST ${API_BASE}/ingest
X-Device-Token: ${recipient.device_token}
Content-Type: application/json

{ "distance_from_lid": 4.2 }`}</div>
      </div>

      <div className="card">
        <h2>Medidas</h2>
        <div className="stat-grid">
          {FORMATS[recipient.format].keys.map((k) => (
            <div className="stat" key={k}>
              <div className="label">{KEY_LABELS[k] || k}</div>
              <div className="value">{recipient.dimensions[k]}</div>
            </div>
          ))}
          <div className="stat">
            <div className="label">Volume total</div>
            <div className="value">
              {fmtNum(totalVolume(recipient.format, recipient.dimensions))} cm³
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Simular leitura (teste manual)</h2>
        <label>Distância da tampa até o conteúdo (cm) — máx. {fmtNum(hTotal)}</label>
        <input
          type="number" min="0" step="any" max={hTotal}
          value={distance}
          onChange={(e) => { setDistance(e.target.value); setResult(null); }}
          placeholder="Ex: 4"
        />

        {shown && distance !== "" && (
          <>
            <div className="fill-view">
              <div className="fill-shape" style={{ color: "var(--accent)" }}>
                <ShapeIcon format={recipient.format} size={140} fill={percent} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="gauge">
                  <div style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
                </div>
                <div className="stat-grid">
              <div className="stat">
                <div className="label">Preenchido</div>
                <div className="value accent">{fmtNum(percent)}%</div>
              </div>
              <div className="stat">
                <div className="label">Volume do conteúdo</div>
                <div className="value">{fmtNum(filled)} cm³</div>
              </div>
              <div className="stat">
                <div className="label">Peso estimado</div>
                <div className="value accent">
                  {mass != null ? `${fmtNum(mass)} g` : "—"}
                </div>
              </div>
              <div className="stat">
                <div className="label">Status</div>
                <div className="value" style={{ fontSize: 15 }}>
                  {result ? "✓ leitura salva" : "prévia (não salva)"}
                </div>
              </div>
                </div>
              </div>
            </div>
            {mass == null && (
              <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                Vincule um produto a este recipiente para estimar o peso.
              </p>
            )}
          </>
        )}

        {error && <div className="error">{error}</div>}

        <div className="btn-row">
          <button onClick={save} disabled={busy || distance === ""}>
            {busy ? "Salvando…" : "Registrar leitura"}
          </button>
        </div>
      </div>
    </>
  );
}
