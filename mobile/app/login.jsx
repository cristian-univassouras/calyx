import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { useAuth } from '../src/auth';
import { theme } from '../src/theme';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit() {
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      router.replace('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.card}>
        <Text style={s.brand}>CA<Text style={s.brandBold}>LYX</Text></Text>
        <Text style={s.subtitle}>Entre para gerenciar seus recipientes</Text>

        <Text style={s.label}>E-mail</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="seu@email.com"
          placeholderTextColor={theme.muted}
        />

        <Text style={s.label}>Senha</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor={theme.muted}
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.btn, busy && s.btnDisabled]}
          onPress={handleSubmit}
          disabled={busy}
        >
          {busy
            ? <ActivityIndicator color={theme.panel} />
            : <Text style={s.btnText}>Entrar</Text>
          }
        </TouchableOpacity>

        <Link href="/register" style={s.link}>
          Não tem conta? Cadastre-se
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:      { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 28, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: theme.border },
  brand:     { fontSize: 26, color: theme.muted, textAlign: 'center', marginBottom: 4 },
  brandBold: { fontWeight: 'bold', color: theme.text },
  subtitle:  { fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 20 },
  label:     { fontSize: 13, color: theme.muted, marginTop: 12, marginBottom: 4 },
  input:     { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 15, color: theme.text, backgroundColor: theme.panel },
  error:     { color: theme.danger, fontSize: 13, marginTop: 8 },
  btn:       { backgroundColor: theme.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  link:      { color: theme.accent, fontSize: 13, textAlign: 'center', marginTop: 16 },
});
