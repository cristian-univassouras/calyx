import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../src/theme';
import { FORMATS, KEY_LABELS, normalizeProfile, totalVolume, dimensionsReady, fmtNum } from '../src/calc';
import ShapeIcon from './ShapeIcon';
import ProductPicker from './ProductPicker';
import ProfileEditor from './ProfileEditor';

export default function RecipientForm({ initial = {}, products = [], onSubmit, submitLabel = 'Salvar' }) {
  const theme = useAppTheme();
  const s = getStyles(theme);
  const [name, setName] = useState(initial.name || '');
  const [format, setFormat] = useState(initial.format || 'cilindric');
  const [dims, setDims] = useState(initial.dimensions || {});
  const [profile, setProfile] = useState(normalizeProfile(initial.calibration_profile || []));
  const [productId, setProductId] = useState(String(initial.product_id || ''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fmt = FORMATS[format] || FORMATS.cilindric;
  const keys = fmt.keys;
  const vol = dimensionsReady(format, dims) ? totalVolume(format, dims, profile) : null;

  async function handleSubmit() {
    if (!name.trim()) { setError('Informe o nome do recipiente'); return; }
    if (!dimensionsReady(format, dims)) { setError('Preencha todas as dimensões'); return; }
    setError('');
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        format,
        dimensions: Object.fromEntries(keys.map((k) => [k, dims[k]])),
        calibration_profile: format === 'custom' ? profile : [],
        product_id: productId ? parseInt(productId, 10) : null,
      });
    } catch (e) {
      setError(e.message || 'Erro ao salvar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      {/* Nome */}
      <Text style={s.label}>Nome</Text>
      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Pote de açúcar"
        placeholderTextColor={theme.muted}
      />

      {/* Formato */}
      <Text style={s.label}>Formato</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
          {Object.keys(FORMATS).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.fmtCard, format === f && s.fmtCardSelected]}
              onPress={() => setFormat(f)}
            >
              <ShapeIcon format={f} size={48} />
              <Text style={[s.fmtLabel, format === f && s.fmtLabelSelected]}>
                {FORMATS[f].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Dimensões */}
      <Text style={s.label}>Dimensões</Text>
      {keys.map((k) => (
        <View key={k} style={s.dimRow}>
          <Text style={s.dimLabel}>{KEY_LABELS[k]}</Text>
          <TextInput
            style={[s.input, s.dimInput]}
            value={dims[k] != null ? String(dims[k]) : ''}
            onChangeText={(t) => setDims((d) => ({ ...d, [k]: parseFloat(t) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.muted}
          />
        </View>
      ))}

      {/* Perfil de calibração (somente para custom) */}
      {format === 'custom' && (
        <>
          <Text style={s.label}>Curva de calibração</Text>
          <ProfileEditor value={profile} onChange={setProfile} />
        </>
      )}

      {/* Produto */}
      <Text style={s.label}>Produto</Text>
      <ProductPicker products={products} value={productId} onChange={setProductId} />

      {/* Preview */}
      <View style={s.preview}>
        <ShapeIcon format={format} fill={100} size={72} />
        <View style={{ gap: 2 }}>
          <Text style={s.previewTitle}>{name || 'Prévia'}</Text>
          {vol != null && (
            <Text style={s.previewSub}>Volume total: {fmtNum(vol)} cm³</Text>
          )}
        </View>
      </View>

      {/* Erro */}
      {!!error && <Text style={s.error}>{error}</Text>}

      {/* Botão */}
      <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{submitLabel}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container:      { padding: 16, gap: 4, paddingBottom: 48 },
  label:          { fontSize: 13, color: theme.muted, fontWeight: '600', marginTop: 14, marginBottom: 4 },
  input:          { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 15, color: theme.text, backgroundColor: theme.panel },
  dimRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  dimLabel:       { flex: 1, fontSize: 13, color: theme.text },
  dimInput:       { flex: 0, width: 90, textAlign: 'center' },
  fmtCard:        { alignItems: 'center', gap: 4, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: theme.border, backgroundColor: theme.panel, width: 80 },
  fmtCardSelected:{ borderColor: theme.accent2, backgroundColor: theme.accentSoft },
  fmtLabel:       { fontSize: 11, color: theme.muted, textAlign: 'center' },
  fmtLabelSelected:{ color: theme.accent2, fontWeight: '700' },
  preview:        { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: theme.panel, borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: theme.border },
  previewTitle:   { fontSize: 15, fontWeight: '700', color: theme.text },
  previewSub:     { fontSize: 13, color: theme.muted },
  error:          { color: theme.danger, fontSize: 13, marginTop: 8 },
  btn:            { backgroundColor: theme.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
});
