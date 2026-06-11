// mobile/app/recipients/[id]/index.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ShapeIcon from '../../../components/ShapeIcon';
import { api } from '../../../src/api';
import { theme } from '../../../src/theme';
import { totalVolume, totalHeight, filledVolume, fmtNum, FORMATS } from '../../../src/calc';

export default function RecipientDetail() {
  const { id } = useLocalSearchParams();
  const router  = useRouter();

  const [recipient,       setRecipient]       = useState(null);
  const [products,        setProducts]        = useState([]);
  const [live,            setLive]            = useState(null);
  const [distance,        setDistance]        = useState('');
  const [result,          setResult]          = useState(null);
  const [error,           setError]           = useState('');
  const [busy,            setBusy]            = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(false);
  const [copied,          setCopied]          = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    Promise.all([api.getRecipient(id), api.listProducts()])
      .then(([r, prods]) => { setRecipient(r); setProducts(prods); })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!recipient) return;
    let active = true;
    const poll = () =>
      api.currentFill(id)
        .then((f) => { if (active) setLive(f); })
        .catch(() => {});
    poll();
    const t = setInterval(poll, 5000);
    return () => { active = false; clearInterval(t); };
  }, [!!recipient, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); };
  }, []);

  const product = products.find((p) => p.id === recipient?.product_id) ?? null;

  const preview = useMemo(() => {
    if (!recipient || !distance) return null;
    const d = parseFloat(distance);
    if (isNaN(d) || d < 0) return null;
    const filled = filledVolume(recipient.format, recipient.dimensions, d);
    const total  = totalVolume(recipient.format, recipient.dimensions);
    const pct    = total > 0 ? (filled / total) * 100 : 0;
    const mass   = product ? filled * product.density : null;
    return { filled, total, pct, mass };
  }, [recipient, distance, product]);

  async function handleCopy() {
    await Clipboard.setStringAsync(recipient.device_token);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  async function handleMeasure() {
    if (!preview) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.createMeasurement(id, parseFloat(distance));
      setResult(res);
      setDistance('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setDeleting(true);
    setError('');
    try {
      await api.deleteRecipient(id);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
      setError(e.message ?? 'Erro ao excluir');
    }
  }

  if (!recipient) {
    return (
      <View style={s.center}>
        {error
          ? <Text style={s.error}>{error}</Text>
          : <ActivityIndicator size="large" color={theme.accent} />
        }
      </View>
    );
  }

  const maxH     = totalHeight(recipient.format, recipient.dimensions);
  const volTotal = totalVolume(recipient.format, recipient.dimensions);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{recipient.name}</Text>
          <Text style={s.subtitle}>
            {FORMATS[recipient.format]?.label ?? recipient.format}
            {product ? ` · ${product.icon ?? ''} ${product.name}` : ''}
          </Text>
        </View>
      </View>

      {/* Ações */}
      {!confirmDelete ? (
        <View style={s.btnRow}>
          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => router.push(`/recipients/${id}/edit`)}
          >
            <Text style={s.btnSecondaryText}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnDanger}
            onPress={() => setConfirmDelete(true)}
          >
            <Text style={s.btnDangerText}>🗑 Excluir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.confirmRow}>
          <Text style={s.confirmText}>Tem certeza?</Text>
          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setConfirmDelete(false)}>
              <Text style={s.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnDanger, deleting && { opacity: 0.5 }]}
              onPress={doDelete}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator size="small" color={theme.danger} />
                : <Text style={s.btnDangerText}>Confirmar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!!error && <Text style={s.error}>{error}</Text>}

      {/* Nível ao vivo */}
      <View style={s.card}>
        <Text style={s.cardLabel}>NÍVEL ATUAL (SENSOR)</Text>
        {live ? (
          <>
            <View style={s.liveRow}>
              <ShapeIcon format={recipient.format} fill={live.fill_percent} size={120} />
              <View style={s.statsGrid}>
                <View style={s.stat}>
                  <Text style={s.statVal}>{live.fill_percent?.toFixed(1)}%</Text>
                  <Text style={s.statKey}>preenchido</Text>
                </View>
                <View style={s.stat}>
                  <Text style={s.statVal}>{fmtNum(live.filled_volume_cm3, 0)} cm³</Text>
                  <Text style={s.statKey}>volume</Text>
                </View>
                {live.mass_g != null && (
                  <View style={s.stat}>
                    <Text style={s.statVal}>{fmtNum(live.mass_g, 0)} g</Text>
                    <Text style={s.statKey}>peso est.</Text>
                  </View>
                )}
                <View style={s.stat}>
                  <Text style={s.statVal}>{live.distance_from_lid} cm</Text>
                  <Text style={s.statKey}>distância</Text>
                </View>
              </View>
            </View>
            <View style={s.gauge}>
              <View style={[s.gaugeFill, { width: `${Math.min(live.fill_percent, 100)}%` }]} />
            </View>
          </>
        ) : (
          <Text style={s.muted}>Aguardando primeira leitura…</Text>
        )}
        <Text style={s.note}>Atualiza a cada 5s</Text>
      </View>

      {/* Token IoT */}
      <View style={s.card}>
        <Text style={s.cardLabel}>TOKEN DO SENSOR IoT</Text>
        <View style={s.tokenRow}>
          <Text style={s.token} numberOfLines={1}>{recipient.device_token}</Text>
          <TouchableOpacity style={s.copyBtn} onPress={handleCopy}>
            <Text style={s.copyBtnText}>{copied ? '✓ Copiado' : 'Copiar'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.code}>
          {`POST /ingest\nX-Device-Token: ${recipient.device_token}\n{ "distance_from_lid": 4.2 }`}
        </Text>
      </View>

      {/* Medidas */}
      <View style={s.card}>
        <Text style={s.cardLabel}>MEDIDAS</Text>
        <View style={s.statsGrid}>
          {Object.entries(recipient.dimensions).map(([k, v]) =>
            typeof v === 'number' ? (
              <View key={k} style={s.stat}>
                <Text style={s.statVal}>{v} cm</Text>
                <Text style={s.statKey}>{k}</Text>
              </View>
            ) : null
          )}
          <View style={s.stat}>
            <Text style={s.statVal}>{fmtNum(volTotal, 1)} cm³</Text>
            <Text style={s.statKey}>volume total</Text>
          </View>
        </View>
      </View>

      {/* Simulador */}
      <View style={s.card}>
        <Text style={s.cardLabel}>SIMULAR LEITURA</Text>
        <Text style={s.label}>Distância da tampa (cm, máx {maxH} cm)</Text>
        <TextInput
          style={s.input}
          value={distance}
          onChangeText={(t) => { setDistance(t); setResult(null); }}
          keyboardType="decimal-pad"
          placeholder={`0 – ${maxH}`}
          placeholderTextColor={theme.muted}
        />
        {preview && (
          <View style={s.liveRow}>
            <ShapeIcon format={recipient.format} fill={preview.pct} size={100} />
            <View style={s.statsGrid}>
              <View style={s.stat}>
                <Text style={s.statVal}>{preview.pct.toFixed(1)}%</Text>
                <Text style={s.statKey}>preenchido</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{fmtNum(preview.filled, 0)} cm³</Text>
                <Text style={s.statKey}>volume</Text>
              </View>
              {preview.mass != null && (
                <View style={s.stat}>
                  <Text style={s.statVal}>{fmtNum(preview.mass, 0)} g</Text>
                  <Text style={s.statKey}>peso est.</Text>
                </View>
              )}
              <View style={s.stat}>
                <Text style={[s.statVal, { color: result ? theme.accent : theme.muted }]}>
                  {result ? 'Salvo ✓' : 'Prévia'}
                </Text>
                <Text style={s.statKey}>status</Text>
              </View>
            </View>
          </View>
        )}
        {!product && (
          <Text style={s.muted}>Produto não vinculado — peso não calculado</Text>
        )}
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[s.btn, (!preview || busy) && s.btnDisabled]}
          onPress={handleMeasure}
          disabled={!preview || busy}
        >
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Registrar leitura</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: theme.bg },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  headerRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 50 },
  back:             { fontSize: 26, color: theme.accent },
  title:            { fontSize: 20, fontWeight: 'bold', color: theme.text },
  subtitle:         { fontSize: 13, color: theme.muted, marginTop: 2 },
  btnRow:           { flexDirection: 'row', gap: 10, flex: 1 },
  confirmRow:       { gap: 8 },
  confirmText:      { fontSize: 14, color: theme.danger, fontWeight: '600', textAlign: 'center' },
  btnSecondary:     { flex: 1, backgroundColor: theme.panel2, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  btnSecondaryText: { color: theme.text, fontWeight: '600' },
  btnDanger:        { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.danger },
  btnDangerText:    { color: theme.danger, fontWeight: '600' },
  card:             { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border, gap: 10 },
  cardLabel:        { fontSize: 11, fontWeight: '700', color: theme.muted, letterSpacing: 1 },
  liveRow:          { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statsGrid:        { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat:             { minWidth: '45%', backgroundColor: theme.panel2, borderRadius: 8, padding: 10 },
  statVal:          { fontSize: 15, fontWeight: 'bold', color: theme.text },
  statKey:          { fontSize: 11, color: theme.muted, marginTop: 2 },
  gauge:            { height: 8, backgroundColor: theme.panel2, borderRadius: 4, overflow: 'hidden' },
  gaugeFill:        { height: '100%', backgroundColor: theme.honey, borderRadius: 4 },
  note:             { fontSize: 11, color: theme.muted, textAlign: 'right' },
  tokenRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.panel2, borderRadius: 8, padding: 10 },
  token:            { flex: 1, fontFamily: 'monospace', fontSize: 12, color: theme.accent2 },
  copyBtn:          { backgroundColor: theme.accent, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  copyBtnText:      { color: '#fff', fontSize: 12, fontWeight: '600' },
  code:             { backgroundColor: theme.panel2, borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 11, color: theme.text },
  label:            { fontSize: 13, color: theme.muted },
  input:            { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 15, color: theme.text, backgroundColor: theme.panel },
  muted:            { color: theme.muted, fontSize: 13 },
  error:            { color: theme.danger, fontSize: 13 },
  btn:              { backgroundColor: theme.accent, borderRadius: 8, padding: 14, alignItems: 'center' },
  btnDisabled:      { opacity: 0.5 },
  btnText:          { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
