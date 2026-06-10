import { useEffect, useState } from "react";
import { api } from "../api";

const EMPTY = { name: "", density: "", icon: "", content_category: "" };

export default function Products() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | product object
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([api.listProducts(), api.listCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const catName = (id) => categories.find((c) => c.id === id)?.name || "—";

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (p) => {
    setForm({
      name: p.name,
      density: String(p.density),
      icon: p.icon || "",
      content_category: p.content_category ? String(p.content_category) : "",
    });
    setEditing(p);
  };
  const close = () => { setEditing(null); setError(""); };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      name: form.name,
      density: Number(form.density),
      icon: form.icon || null,
      content_category: form.content_category ? Number(form.content_category) : null,
    };
    try {
      if (editing === "new") await api.createProduct(payload);
      else await api.updateProduct(editing.id, payload);
      close();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Excluir "${p.name}"? Os recipientes que o usam ficam sem produto.`)) return;
    try { await api.deleteProduct(p.id); await load(); }
    catch (err) { setError(err.message); }
  };

  if (!products) return <p className="muted">Carregando…</p>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>
          <h1>Produtos</h1>
          <p className="subtitle">Os materiais e suas densidades (g/cm³) para o cálculo de peso</p>
        </div>
        <div className="spacer" />
        <button onClick={openNew}>+ Novo produto</button>
      </div>

      {error && !editing && <div className="error">{error}</div>}

      <div className="card">
        {products.length === 0 ? (
          <div className="empty">Nenhum produto. Cadastre o primeiro.</div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="prod-row">
              <div className="prod-emoji">{p.icon || "📦"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="prod-name">{p.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {p.density} g/cm³ · {catName(p.content_category)}
                </div>
              </div>
              <button className="secondary" onClick={() => openEdit(p)}>Editar</button>
              <button className="danger" onClick={() => remove(p)}>Excluir</button>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={close}>
          <form className="modal" style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2 style={{ margin: 0 }}>{editing === "new" ? "Novo produto" : "Editar produto"}</h2>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginTop: 8 }}>
              <div style={{ width: 80 }}>
                <label>Ícone</label>
                <input value={form.icon} onChange={set("icon")} maxLength={4}
                  style={{ textAlign: "center", fontSize: 20 }} placeholder="🍚" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Nome</label>
                <input value={form.name} onChange={set("name")} required autoFocus />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label>Densidade (g/cm³)</label>
                <input type="number" min="0" step="any" value={form.density}
                  onChange={set("density")} required placeholder="0.85" />
              </div>
              <div>
                <label>Categoria</label>
                <select value={form.content_category} onChange={set("content_category")}>
                  <option value="">— sem categoria —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="btn-row">
              <button type="submit" disabled={busy || !form.name || !form.density}>
                {busy ? "Salvando…" : "Salvar"}
              </button>
              <button type="button" className="secondary" onClick={close}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
