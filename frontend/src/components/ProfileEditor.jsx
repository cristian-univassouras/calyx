// Editor da curva de calibracao do formato "custom".
// O usuario mede: a cada altura (cm) do conteudo, qual o volume acumulado (cm3).
// A primeira linha (0, 0) e fixa (recipiente vazio).

export default function ProfileEditor({ value, onChange }) {
  const rows = value && value.length ? value : [{ h: 0, v: 0 }];

  const update = (i, key) => (e) => {
    const val = e.target.value;
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [key]: val === "" ? undefined : Number(val) } : r
    );
    onChange(next);
  };

  const addRow = () => onChange([...rows, { h: undefined, v: undefined }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="profile-editor">
      <div className="profile-row profile-head">
        <span>Altura do conteúdo (cm)</span>
        <span>Volume acumulado (cm³)</span>
        <span />
      </div>

      {rows.map((r, i) => {
        const base = i === 0;
        return (
          <div className="profile-row" key={i}>
            <input
              type="number" min="0" step="any"
              value={r.h ?? ""}
              onChange={update(i, "h")}
              disabled={base}
              placeholder={base ? "0 (vazio)" : "ex: 5"}
            />
            <input
              type="number" min="0" step="any"
              value={r.v ?? ""}
              onChange={update(i, "v")}
              disabled={base}
              placeholder={base ? "0" : "ex: 250"}
            />
            {base ? (
              <span className="profile-base muted">base</span>
            ) : (
              <button type="button" className="profile-del" onClick={() => removeRow(i)}>
                ✕
              </button>
            )}
          </div>
        );
      })}

      <button type="button" className="secondary" style={{ marginTop: 10 }} onClick={addRow}>
        + Adicionar ponto
      </button>
      <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
        Dica: encha o recipiente aos poucos (ex: 100 ml por vez), e anote a altura
        que o conteúdo atinge. O último ponto define a capacidade total.
      </p>
    </div>
  );
}
