// mobile/app/(tabs)/categorias.jsx
import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { theme } from '../../src/theme';

function CategoryProductsModal({ category, products, onClose }) {
  const filtered = products.filter((p) => p.content_category === category?.id);

  return (
    <Modal visible={!!category} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={ms.screen}>
        <View style={ms.header}>
          <Text style={ms.title}>{category?.name}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={ms.close}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={ms.content}>
          {filtered.length === 0 ? (
            <Text style={ms.empty}>Nenhum produto nesta categoria</Text>
          ) : (
            filtered.map((p) => (
              <View key={p.id} style={ms.row}>
                <Text style={ms.emoji}>{p.icon || '🧪'}</Text>
                <View style={ms.info}>
                  <Text style={ms.name}>{p.name}</Text>
                  <Text style={ms.meta}>{p.density} g/cm³</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function Categorias() {
  const [categories,    setCategories]    = useState([]);
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedCat,   setSelectedCat]   = useState(null);

  async function load() {
    try {
      const [cats, prods] = await Promise.all([
        api.listCategories(),
        api.listProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch {}
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []));

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Categorias</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
          const count = products.filter((p) => p.content_category === item.id).length;
          return (
            <TouchableOpacity style={s.row} onPress={() => setSelectedCat(item)}>
              <View style={s.info}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.meta}>{item.method || '—'}</Text>
              </View>
              <Text style={s.count}>{count} produto{count !== 1 ? 's' : ''} →</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>Nenhuma categoria cadastrada</Text>}
      />

      <CategoryProductsModal
        category={selectedCat}
        products={products}
        onClose={() => setSelectedCat(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: theme.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  header:  { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:   { fontSize: 22, fontWeight: 'bold', color: theme.text },
  row:     { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  info:    { flex: 1 },
  name:    { fontSize: 15, fontWeight: '600', color: theme.text },
  meta:    { fontSize: 12, color: theme.muted, marginTop: 2 },
  count:   { fontSize: 12, color: theme.accent, fontWeight: '600' },
  empty:   { textAlign: 'center', color: theme.muted, marginTop: 40 },
});

const ms = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: theme.bg },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:   { fontSize: 18, fontWeight: 'bold', color: theme.text },
  close:   { fontSize: 20, color: theme.muted },
  content: { padding: 16, gap: 10 },
  empty:   { textAlign: 'center', color: theme.muted, marginTop: 40 },
  row:     { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border },
  emoji:   { fontSize: 22, width: 32, textAlign: 'center' },
  info:    { flex: 1 },
  name:    { fontSize: 15, fontWeight: '600', color: theme.text },
  meta:    { fontSize: 12, color: theme.muted },
});
