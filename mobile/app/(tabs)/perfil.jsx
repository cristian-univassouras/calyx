// mobile/app/(tabs)/perfil.jsx
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { useAppTheme, useThemeToggle } from '../../src/theme';

export default function Perfil() {
  const theme = useAppTheme();
  const s = getStyles(theme);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeToggle();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Perfil</Text>
      </View>
      <View style={s.card}>
        <View style={s.field}>
          <Text style={s.label}>NOME</Text>
          <Text style={s.value}>{user?.name}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.field}>
          <Text style={s.label}>E-MAIL</Text>
          <Text style={s.value}>{user?.email}</Text>
        </View>
      </View>
      <View style={[s.card, { marginTop: 0 }]}>
        <View style={s.themeRow}>
          <Text style={s.themeText}>Modo Escuro</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={isDark ? theme.panel : theme.muted}
          />
        </View>
      </View>
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  screen:     { flex: 1, backgroundColor: theme.bg },
  header:     { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:      { fontSize: 22, fontWeight: 'bold', color: theme.text },
  card:       { margin: 16, backgroundColor: theme.panel, borderRadius: theme.radius, padding: 20, borderWidth: 1, borderColor: theme.border, gap: 16 },
  field:      { gap: 4 },
  label:      { fontSize: 11, color: theme.muted, letterSpacing: 0.8, fontWeight: '600' },
  value:      { fontSize: 17, color: theme.text, fontWeight: '500' },
  divider:    { height: 1, backgroundColor: theme.border },
  logoutBtn:  { marginHorizontal: 16, borderWidth: 1, borderColor: theme.danger, borderRadius: 8, padding: 14, alignItems: 'center' },
  logoutText: { color: theme.danger, fontWeight: '600', fontSize: 15 },
  themeRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeText:  { fontSize: 16, color: theme.text, fontWeight: '500' },
});
