// mobile/app/(tabs)/produtos.jsx
import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { useAppTheme } from '../../src/theme';

function ProductModal({ visible, product, categories, onClose, onSaved }) {
  const theme = useAppTheme();
  const ms = getModalStyles(theme);
  const isNew = product === 'new';
  const [form, setForm] = useState({ name: '', density: '', icon: '', content_category: '' });
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!isNew && product) {
      setForm({
        name:             product.name,
        density:          String(product.density),
        icon:             product.icon || '',
        content_category: product.content_category ? String(product.content_category) : '',
      });
    } else {
      setForm({ name: '', density: '', icon: '', content_category: '' });
    }
    setError('');
  }, [visible, product]);

  function set(field) {
    return (value) => setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.name || !form.density) { setError('Nome e densidade são obrigatórios'); return; }
    const d = parseFloat(form.density);
    if (isNaN(d) || d <= 0) { setError('Densidade deve ser um número maior que 0'); return; }
    setBusy(true);
    setError('');
    const payload = {
      name:             form.name.trim(),
      density:          d,
      icon:             form.icon || undefined,
      content_category: form.content_category ? parseInt(form.content_category) : undefined,
    };
    try {
      if (!isNew && product) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={ms.screen}>
        <View style={ms.header}>
          <Text style={ms.title}>{isNew ? 'Novo produto' : 'Editar produto'}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={ms.close}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={ms.form}>
          <Text style={ms.label}>Emoji</Text>
          <TextInput
            style={[ms.input, { fontSize: 24, textAlign: 'center', width: 64 }]}
            value={form.icon}
            onChangeText={set('icon')}
            placeholder="🧪"
            placeholderTextColor={theme.muted}
          />

          <Text style={ms.label}>Nome *</Text>
          <TextInput
            style={ms.input}
            value={form.name}
            onChangeText={set('name')}
            placeholder="Ex: Arroz"
            placeholderTextColor={theme.muted}
          />

          <Text style={ms.label}>Densidade (g/cm³) *</Text>
          <TextInput
            style={ms.input}
            value={form.density}
            onChangeText={set('density')}
            keyboardType="decimal-pad"
            placeholder="0.85"
            placeholderTextColor={theme.muted}
          />

          <Text style={ms.label}>Categoria</Text>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[ms.catOption, form.content_category === String(c.id) && ms.catSelected]}
              onPress={() => set('content_category')(String(c.id))}
            >
              <Text style={[ms.catText, form.content_category === String(c.id) && ms.catTextSelected]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}

          {error ? <Text style={ms.error}>{error}</Text> : null}

          <TouchableOpacity style={[ms.btn, busy && ms.btnDisabled]} onPress={handleSave} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={ms.btnText}>Salvar</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function Produtos() {
  const theme = useAppTheme();
  const s = getStyles(theme);
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing,    setEditing]    = useState(null);
  const [loading,    setLoading]    = useState(true);

  const [loadError, setLoadError] = useState('');

  async function load() {
    try {
      const [prods, cats] = await Promise.all([
        api.listProducts(),
        api.listCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message);
    }
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []));

  function handleDelete(id) {
    Alert.alert('Excluir produto', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProduct(id);
            await load();
          } catch (e) {
            Alert.alert('Erro ao excluir', e.message);
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Produtos</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setEditing('new')}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>
      {loadError ? <Text style={s.loadError}>{loadError}</Text> : null}
      <FlatList
        data={products}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.emoji}>{item.icon || '🧪'}</Text>
            <View style={s.info}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>
                {item.density} g/cm³
                {item.content_category ? ` · cat ${item.content_category}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEditing(item)} hitSlop={8}>
              <Text style={s.editBtn}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8}>
              <Text style={s.deleteBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Nenhum produto cadastrado</Text>}
      />
      <ProductModal
        visible={!!editing}
        product={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  screen:     { flex: 1, backgroundColor: theme.bg },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:      { fontSize: 22, fontWeight: 'bold', color: theme.text },
  addBtn:     { backgroundColor: theme.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  row:        { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.border },
  emoji:      { fontSize: 22, width: 32, textAlign: 'center' },
  info:       { flex: 1 },
  name:       { fontSize: 15, fontWeight: '600', color: theme.text },
  meta:       { fontSize: 12, color: theme.muted },
  editBtn:    { color: theme.accent, fontSize: 13, fontWeight: '600' },
  deleteBtn:  { color: theme.danger, fontSize: 18, fontWeight: '600' },
  empty:      { textAlign: 'center', color: theme.muted, marginTop: 40 },
  loadError:  { color: theme.danger, fontSize: 13, paddingHorizontal: 16, paddingTop: 8 },
});

const getModalStyles = (theme) => StyleSheet.create({
  screen:          { flex: 1, backgroundColor: theme.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:           { fontSize: 18, fontWeight: 'bold', color: theme.text },
  close:           { fontSize: 20, color: theme.muted },
  form:            { padding: 20, gap: 6 },
  label:           { fontSize: 13, color: theme.muted, marginTop: 10, fontWeight: '600' },
  input:           { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 15, color: theme.text, backgroundColor: theme.panel },
  catOption:       { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, marginTop: 4 },
  catSelected:     { borderColor: theme.accent2, backgroundColor: theme.accentSoft },
  catText:         { color: theme.text },
  catTextSelected: { color: theme.accent2, fontWeight: '600' },
  error:           { color: theme.danger, fontSize: 13, marginTop: 8 },
  btn:             { backgroundColor: theme.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  btnDisabled:     { opacity: 0.5 },
  btnText:         { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
