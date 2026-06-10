import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { theme } from '../../src/theme';
import ShapeIcon from '../../components/ShapeIcon';

function fillColor(pct) {
  if (pct == null) return theme.muted;
  if (pct > 60) return '#4caf50';
  if (pct > 25) return '#ff9800';
  return '#f44336';
}

function timeSince(dateStr) {
  if (!dateStr) return null;
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  return `${Math.round(diff / 3600)}h`;
}

function RecipientCard({ item, onPress }) {
  const pct = item._fill?.fill_percent ?? null;
  const weight = item._fill?.estimated_weight_g ?? null;
  const lastAt = item._fill?.measured_at ?? null;
  const color = fillColor(pct);

  return (
    <TouchableOpacity style={s.card} onPress={onPress}>
      <View style={s.iconWrap}>
        <ShapeIcon format={item.format} fill={pct} size={72} />
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <View style={s.gaugeTrack}>
          <View style={[s.gaugeFill, { width: `${pct ?? 0}%`, backgroundColor: color }]} />
        </View>
        <View style={s.statsRow}>
          <Text style={[s.pct, { color }]}>
            {pct != null ? `${pct.toFixed(1)}%` : '—'}
          </Text>
          {weight != null && (
            <Text style={s.stat}>{(weight / 1000).toFixed(2)} kg</Text>
          )}
          {lastAt && (
            <Text style={s.statMuted}>há {timeSince(lastAt)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipientesTab() {
  const router = useRouter();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecipients = useCallback(async () => {
    try {
      const list = await api.listRecipients();
      const withFill = await Promise.all(
        list.map(async (r) => {
          try {
            const fill = await api.currentFill(r.id);
            return { ...r, _fill: fill };
          } catch {
            return { ...r, _fill: null };
          }
        })
      );
      setRecipients(withFill);
    } catch {
      // keep previous state on error
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRecipients().finally(() => setLoading(false));
    }, [loadRecipients])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadRecipients();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <FlatList
        data={recipients}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <RecipientCard
            item={item}
            onPress={() => router.push(`/recipients/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>Nenhum recipiente cadastrado.</Text>
            <Text style={s.emptyHint}>Toque no + para adicionar.</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={() => router.push('/recipients/new')}>
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: theme.bg },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  list:       { padding: 16, gap: 12, paddingBottom: 80 },
  card:       { flexDirection: 'row', backgroundColor: theme.panel, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.border, padding: 12, alignItems: 'center', gap: 12 },
  iconWrap:   { width: 72 },
  info:       { flex: 1, gap: 6 },
  name:       { fontSize: 15, fontWeight: '700', color: theme.text },
  gaugeTrack: { height: 6, borderRadius: 3, backgroundColor: theme.panel2, overflow: 'hidden' },
  gaugeFill:  { height: 6, borderRadius: 3 },
  statsRow:   { flexDirection: 'row', gap: 10, alignItems: 'center' },
  pct:        { fontSize: 13, fontWeight: '700' },
  stat:       { fontSize: 12, color: theme.muted },
  statMuted:  { fontSize: 11, color: theme.muted, marginLeft: 'auto' },
  empty:      { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText:  { fontSize: 16, color: theme.muted },
  emptyHint:  { fontSize: 13, color: theme.muted },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabIcon:    { color: '#fff', fontSize: 28, lineHeight: 32, textAlign: 'center' },
});
