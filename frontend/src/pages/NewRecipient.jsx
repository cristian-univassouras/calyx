import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import ShapeIcon from "../components/ShapeIcon.jsx";
import ProductPicker from "../components/ProductPicker.jsx";
import ProfileEditor from "../components/ProfileEditor.jsx";
import { FORMATS, KEY_LABELS, dimensionsReady, fmtNum, totalVolume } from "../calc";

export default function NewRecipient() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { id } = useParams();            // presente => modo edicao
  const isEdit = Boolean(id);
  const [name, setName] = useState("");
  const [format, setFormat] = useState("cilindric");
  const [dims, setDims] = useState({});
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState([]);
  const [cabinets, setCabinets] = useState([]);
  const [cabinetId, setCabinetId] = useState(params.get("cabinet") || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listProducts().then(setProducts).catch(() => {});
    api.listCabinets().then(setCabinets).catch(() => {});
  }, []);

  // modo edicao: carrega o recipiente e preenche o formulario
  useEffect(() => {
    if (!isEdit) return;
    api.getRecipient(id).then((r) => {
      setName(r.name);
      setFormat(r.format);
      setDims(r.dimensions);
      setProductId(r.product_id ? String(r.product_id) : "");
      setCabinetId(r.cabinet_id ? String(r.cabinet_id) : "");
    }).catch((e) => setError(e.message));
  }, [id, isEdit]);

  const keys = FORMATS[format].keys;

  // ao trocar de formato, mantem so as chaves validas
  const changeFormat = (f) => {
    setFormat(f);
    if (f === "custom") {
      setDims({ profile: [{ h: 0, v: 0 }, { h: undefined, v: undefined }] });
      return;
    }
    setDims((prev) => {
      const next = {};
      FORMATS[f].keys.forEach((k) => { if (prev[k] != null) next[k] = prev[k]; });
      return next;
    });
  };

  const setDim = (k) => (e) => {
    const v = e.target.value;
    setDims({ ...dims, [k]: v === "" ? undefined : Number(v) });
  };

  const ready = dimensionsReady(format, dims);
  const volume = useMemo(
    () => (ready ? totalVolume(format, dims) : null),
    [ready, format, dims]
  );

  const selectedProduct = products.find((p) => String(p.id) === productId);
  const estMass =
    volume != null && selectedProduct ? volume * selectedProduct.density : null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      name,
      format,
      dimensions: dims,
      product_id: productId ? Number(productId) : null,
      cabinet_id: cabinetId ? Number(cabinetId) : null,
    };
    try {
      const saved = isEdit
        ? await api.updateRecipient(id, payload)
        : await api.createRecipient(payload);
      navigate(`/recipients/${saved.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>{isEdit ? "Editar recipiente" : "Novo recipiente"}</h1>
      <p className="subtitle">Defina o formato e as medidas internas (em cm)</p>

      <form onSubmit={submit}>
        <div className="card">
          <label>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="Ex: Pote de arroz da cozinha" />

          <label style={{ marginTop: 18 }}>Armário</label>
          <div className="pick-grid">
            <button
              type="button"
              className={`pick-card ${cabinetId === "" ? "selected" : ""}`}
              onClick={() => setCabinetId("")}
            >
              <div className="pick-emoji">📦</div>
              <div className="pick-title">Sem armário</div>
            </button>
            {cabinets.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`pick-card ${String(c.id) === String(cabinetId) ? "selected" : ""}`}
                onClick={() => setCabinetId(String(c.id))}
              >
                <div className="pick-emoji">{c.icon || "🗄️"}</div>
                <div className="pick-title">{c.name}</div>
              </button>
            ))}
          </div>

          <label style={{ marginTop: 18 }}>Formato</label>
          <div className="pick-grid">
            {Object.entries(FORMATS).map(([k, v]) => (
              <button
                type="button"
                key={k}
                className={`pick-card ${format === k ? "selected" : ""}`}
                onClick={() => changeFormat(k)}
              >
                <div className="pick-illu"><ShapeIcon format={k} size={56} /></div>
                <div className="pick-title">{v.label}</div>
              </button>
            ))}
          </div>

          <label style={{ marginTop: 20 }}>
            {format === "custom" ? "Curva de calibração" : "Medidas"}
          </label>
          {format === "custom" ? (
            <ProfileEditor
              value={dims.profile}
              onChange={(profile) => setDims({ profile })}
            />
          ) : (
            <div className="grid-2">
              {keys.map((k) => (
                <div key={k}>
                  <label>{KEY_LABELS[k] || k}</label>
                  <input
                    type="number" min="0" step="any"
                    value={dims[k] ?? ""}
                    onChange={setDim(k)}
                    required
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Produto (conteúdo)</h2>
          <ProductPicker products={products} value={productId} onChange={setProductId} />
        </div>

        <div className="card">
          <h2>Prévia</h2>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ color: "var(--accent)" }}>
              <ShapeIcon format={format} size={96} fill={ready ? 100 : null} />
            </div>
            <div className="stat-grid" style={{ flex: 1 }}>
              <div className="stat">
                <div className="label">Volume total</div>
                <div className="value accent">
                  {volume != null ? `${fmtNum(volume)} cm³` : "—"}
                </div>
              </div>
              <div className="stat">
                <div className="label">Peso quando cheio</div>
                <div className="value">
                  {estMass != null ? `${fmtNum(estMass)} g` : "—"}
                </div>
              </div>
            </div>
          </div>
          {!selectedProduct && (
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              Selecione um produto acima para estimar o peso.
            </p>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="btn-row">
          <button type="submit" disabled={busy || !ready || !name}>
            {busy ? "Salvando…" : isEdit ? "Salvar alterações" : "Cadastrar recipiente"}
          </button>
          <button type="button" className="secondary"
            onClick={() => navigate(isEdit ? `/recipients/${id}` : "/")}>
            Cancelar
          </button>
        </div>
      </form>
    </>
  );
}
