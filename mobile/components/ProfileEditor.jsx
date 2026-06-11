import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { useAppTheme } from '../src/theme';

let _rowId = 0;

export default function ProfileEditor({ value = [[0, 0]], onChange }) {
  const theme = useAppTheme();
  const s = getStyles(theme);
  const rows = value.length > 0 ? value : [[0, 0]];
  const idsRef = React.useRef(rows.map(() => ++_rowId));

  function updateRow(idx, col, val) {
    const next = rows.map((r) => [...r]);
    next[idx][col] = parseFloat(val) || 0;
    onChange(next);
  }

  function addRow() {
    idsRef.current = [...idsRef.current, ++_rowId];
    onChange([...rows, [0, 0]]);
  }

  function removeRow(idx) {
    if (idx === 0) return;
    idsRef.current = idsRef.current.filter((_, i) => i !== idx);
    onChange(rows.filter((_, i) => i !== idx));
  }

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={[s.col, s.colLabel]}>Altura (cm)</Text>
        <Text style={[s.col, s.colLabel]}>Volume (cm³)</Text>
        <View style={s.removeCol} />
      </View>

      {rows.map((row, i) => (
        <View key={idsRef.current[i]} style={s.row}>
          <TextInput
            style={[s.input, s.col, i === 0 && s.disabled]}
            value={String(row[0])}
            onChangeText={(t) => updateRow(i, 0, t)}
            keyboardType="decimal-pad"
            editable={i !== 0}
          />
          <TextInput
            style={[s.input, s.col, i === 0 && s.disabled]}
            value={String(row[1])}
            onChangeText={(t) => updateRow(i, 1, t)}
            keyboardType="decimal-pad"
            editable={i !== 0}
          />
          <TouchableOpacity style={s.removeCol} onPress={() => removeRow(i)} disabled={i === 0}>
            <Text style={[s.removeText, i === 0 && { opacity: 0 }]}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={s.addBtn} onPress={addRow}>
        <Text style={s.addBtnText}>+ Adicionar ponto</Text>
      </TouchableOpacity>
      <Text style={s.hint}>
        Meça o volume de água despejado a cada altura marcada no recipiente.
      </Text>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container:  { gap: 6 },
  headerRow:  { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  row:        { flexDirection: 'row', gap: 8, alignItems: 'center' },
  col:        { flex: 1 },
  colLabel:   { fontSize: 12, color: theme.muted, fontWeight: '600' },
  input:      { borderWidth: 1, borderColor: theme.border, borderRadius: 6, padding: 8, fontSize: 14, color: theme.text, backgroundColor: theme.panel, textAlign: 'center' },
  disabled:   { backgroundColor: theme.panel2, color: theme.muted },
  removeCol:  { width: 32, alignItems: 'center' },
  removeText: { color: theme.danger, fontSize: 16 },
  addBtn:     { borderWidth: 1, borderColor: theme.accent, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: theme.accent, fontWeight: '600', fontSize: 13 },
  hint:       { fontSize: 11, color: theme.muted, marginTop: 4 },
});
