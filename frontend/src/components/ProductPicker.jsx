// Paleta para o avatar do produto (cor derivada do nome)
const COLORS = ["#3fb950", "#58a6ff", "#d29922", "#bc8cff", "#f778ba", "#39c5cf"];

function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

export default function ProductPicker({ products, value, onChange }) {
  return (
    <div className="pick-grid">
      <button
        type="button"
        className={`pick-card ${value === "" ? "selected" : ""}`}
        onClick={() => onChange("")}
      >
        <div className="pick-avatar" style={{ background: "#2e3a4f" }}>∅</div>
        <div className="pick-title">Sem produto</div>
        <div className="pick-sub">só volume</div>
      </button>

      {products.map((p) => {
        const sel = String(p.id) === String(value);
        return (
          <button
            type="button"
            key={p.id}
            className={`pick-card ${sel ? "selected" : ""}`}
            onClick={() => onChange(String(p.id))}
          >
            {p.icon ? (
              <div className="pick-emoji">{p.icon}</div>
            ) : (
              <div className="pick-avatar" style={{ background: colorFor(p.name) }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="pick-title">{p.name}</div>
            <div className="pick-sub">{p.density} g/cm³</div>
          </button>
        );
      })}
    </div>
  );
}
