import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ShapeIcon from "../components/ShapeIcon.jsx";
import { FORMATS, fmtNum, totalVolume } from "../calc";

export default function Cabinets() {
  const navigate = useNavigate();
  const [cabinets, setCabinets] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🗄️");
  const [open, setOpen] = useState(null);        // armario aberto no modal
  const [dropTarget, setDropTarget] = useState(null); // alvo do drag (id | "loose")

  const load = () =>
    Promise.all([api.listCabinets(), api.listRecipients()])
      .then(([cabs, recs]) => { setCabinets(cabs); setRecipients(recs); })
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const loose = recipients.filter((r) => r.cabinet_id == null);
  const openItems = open ? recipients.filter((r) => r.cabinet_id === open.id) : [];

  const createCabinet = async (e) => {
    e.preventDefault();
    try {
      const c = await api.createCabinet({ name, icon: icon || null });
      setName(""); setCreating(false);
      await load();
      setOpen(c);
    } catch (err) { setError(err.message); }
  };

  // ----- drag & drop -----
  const onDragStart = (e, recipientId) => {
    e.dataTransfer.setData("text/plain", String(recipientId));
    e.dataTransfer.effectAllowed = "move";
  };
  const moveTo = async (e, cabinetId) => {
    e.preventDefault();
    setDropTarget(null);
    const rid = Number(e.dataTransfer.getData("text/plain"));
    if (!rid) return;
    const current = recipients.find((r) => r.id === rid);
    if (!current || current.cabinet_id === cabinetId) return;
    try {
      await api.updateRecipient(rid, { cabinet_id: cabinetId });
      await load();
    } catch (err) { setError(err.message); }
  };
  const allowDrop = (e, target) => { e.preventDefault(); setDropTarget(target); };

  if (error) return <div className="error">{error}</div>;
  if (!cabinets) return <p className="muted">Carregando…</p>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>
          <h1>Meus armários</h1>
          <p className="subtitle">Arraste itens avulsos para dentro de um armário · clique para abrir</p>
        </div>
        <div className="spacer" />
        <button onClick={() => setCreating((v) => !v)}>+ Novo armário</button>
      </div>

      {creating && (
        <form className="card" onSubmit={createCabinet}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ width: 80 }}>
              <label>Ícone</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4}
                style={{ textAlign: "center", fontSize: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Nome do armário</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Despensa" required autoFocus />
            </div>
            <button type="submit">Criar</button>
          </div>
        </form>
      )}

      <div className="layout-cols">
        {/* Menu lateral: itens avulsos (arrastaveis) e zona de soltura */}
        <aside
          className={`sidebar card ${dropTarget === "loose" ? "drag-over" : ""}`}
          onDragOver={(e) => allowDrop(e, "loose")}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => moveTo(e, null)}
        >
          <h2 style={{ fontSize: 15 }}>📦 Itens avulsos</h2>
          {loose.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              Nada aqui. Arraste um recipiente para cá para tirá-lo do armário.
            </p>
          ) : (
            loose.map((r) => (
              <div
                key={r.id}
                className="loose-item"
                draggable
                onDragStart={(e) => onDragStart(e, r.id)}
                onClick={() => navigate(`/recipients/${r.id}`)}
                title="Arraste para um armário"
              >
                <span style={{ color: "var(--accent)" }}>
                  <ShapeIcon format={r.format} size={30} fill={r.last_fill_percent ?? null} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="loose-name">{r.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {r.last_fill_percent != null ? `${fmtNum(r.last_fill_percent)}% cheio` : "sem leitura"}
                  </div>
                </div>
              </div>
            ))
          )}
        </aside>

        {/* Estante de armarios (drop targets) */}
        <div className="main-col">
          <div className="cabinet-grid">
            {cabinets.map((c) => (
              <button
                key={c.id}
                className={`cabinet-card drop-target ${dropTarget === c.id ? "drag-over" : ""}`}
                onClick={() => setOpen(c)}
                onDragOver={(e) => allowDrop(e, c.id)}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => moveTo(e, c.id)}
              >
                <div className="cabinet-doors">
                  <div className="door door-l"><span className="knob" /></div>
                  <div className="door door-r"><span className="knob" /></div>
                  <div className="cabinet-emoji">{c.icon || "🗄️"}</div>
                </div>
                <div className="cabinet-name">{c.name}</div>
                <div className="cabinet-count">
                  {c.recipient_count} {c.recipient_count === 1 ? "recipiente" : "recipientes"}
                </div>
              </button>
            ))}
          </div>
          {cabinets.length === 0 && (
            <div className="card empty">Nenhum armário ainda. Crie o primeiro acima.</div>
          )}
        </div>
      </div>

      {/* Popup do armario aberto */}
      {open && (
        <CabinetModal
          cabinet={open}
          items={openItems}
          onClose={() => setOpen(null)}
          onDragStart={onDragStart}
          onDropInside={(e) => moveTo(e, open.id)}
          onAllowDrop={(e) => allowDrop(e, open.id)}
          dragOver={dropTarget === open.id}
          onPick={(rid) => navigate(`/recipients/${rid}`)}
          onAdd={() => navigate(`/new?cabinet=${open.id}`)}
          onSave={async (patch) => {
            try {
              const updated = await api.updateCabinet(open.id, patch);
              setOpen(updated);
              await load();
            } catch (e) { setError(e.message); }
          }}
          onDelete={async () => {
            if (!confirm("Excluir este armário? Os recipientes ficam sem armário (não são apagados).")) return;
            await api.deleteCabinet(open.id).catch((e) => setError(e.message));
            setOpen(null);
            load();
          }}
        />
      )}
    </>
  );
}

function CabinetModal({
  cabinet, items, onClose, onDragStart, onDropInside, onAllowDrop, dragOver,
  onPick, onAdd, onSave, onDelete,
}) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(cabinet.name);
  const [icon, setIcon] = useState(cabinet.icon || "");

  const save = async (e) => {
    e.preventDefault();
    await onSave({ name, icon: icon || null });
    setEdit(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal ${dragOver ? "drag-over" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={onAllowDrop}
        onDrop={onDropInside}
      >
        <div className="modal-head">
          {edit ? (
            <form onSubmit={save} style={{ display: "flex", gap: 8, flex: 1 }}>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4}
                style={{ width: 56, textAlign: "center", fontSize: 18 }} />
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
                style={{ flex: 1 }} required />
              <button type="submit">Salvar</button>
              <button type="button" className="secondary" onClick={() => setEdit(false)}>✕</button>
            </form>
          ) : (
            <>
              <h2 style={{ margin: 0 }}>{cabinet.icon || "🗄️"} {cabinet.name}</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                · {items.length} {items.length === 1 ? "recipiente" : "recipientes"}
              </span>
              <button className="link-btn" style={{ marginLeft: 8 }}
                onClick={() => { setName(cabinet.name); setIcon(cabinet.icon || ""); setEdit(true); }}>
                editar
              </button>
              <div className="spacer" />
              <button className="secondary" onClick={onClose}>Fechar ✕</button>
            </>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty">
            Armário vazio. Arraste itens avulsos para cá ou adicione um novo.
          </div>
        ) : (
          <div className="hub-grid" style={{ marginTop: 16 }}>
            {items.map((r) => (
              <div
                key={r.id}
                className="hub-card"
                draggable
                onDragStart={(e) => onDragStart(e, r.id)}
                onClick={() => onPick(r.id)}
                style={{ cursor: "pointer" }}
              >
                <span className="badge hub-badge">{FORMATS[r.format]?.label || r.format}</span>
                <div className="hub-illu">
                  <ShapeIcon format={r.format} size={80} fill={r.last_fill_percent ?? null} />
                </div>
                <div className="hub-name">{r.name}</div>
                {r.last_fill_percent != null ? (
                  <>
                    <div className="hub-fill">{fmtNum(r.last_fill_percent)}% cheio</div>
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
              </div>
            ))}
          </div>
        )}

        <div className="btn-row">
          <button onClick={onAdd}>+ Novo recipiente aqui</button>
          <button className="danger" onClick={onDelete}>Excluir armário</button>
        </div>
      </div>
    </div>
  );
}
