import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../src/theme';

function hashColor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 50%, 45%)`;
}

export default function ProductPicker({ products = [], value = '', onChange }) {
  const items = [
    { id: '', name: 'Sem produto', icon: null, density: null },
    ...products,
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
        {items.map((p) => {
          const selected = String(p.id) === String(value);
          return (
            <TouchableOpacity
              key={String(p.id)}
              style={[s.card, selected && s.selected]}
              onPress={() => onChange(String(p.id))}
            >
              {p.icon ? (
                <Text style={s.emoji}>{p.icon}</Text>
              ) : p.id === '' ? (
                <View style={[s.avatar, { backgroundColor: theme.text }]}>
                  <Text style={s.avatarText}>∅</Text>
                </View>
              ) : (
                <View style={[s.avatar, { backgroundColor: hashColor(p.name) }]}>
                  <Text style={s.avatarText}>{p.name[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <Text style={[s.name, selected && s.nameSelected]} numberOfLines={2}>
                {p.name}
              </Text>
              {p.density != null && (
                <Text style={s.density}>{p.density} g/cm³</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card:         { width: 90, alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 2, borderColor: theme.border, backgroundColor: theme.panel, gap: 4 },
  selected:     { borderColor: theme.accent2, backgroundColor: theme.accentSoft },
  emoji:        { fontSize: 24 },
  avatar:       { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  name:         { fontSize: 11, color: theme.text, textAlign: 'center', fontWeight: '500' },
  nameSelected: { color: theme.accent2, fontWeight: '700' },
  density:      { fontSize: 10, color: theme.muted },
});
