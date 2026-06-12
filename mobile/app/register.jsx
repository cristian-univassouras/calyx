import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { useAuth } from '../src/auth';
import { api } from '../src/api';
import { useAppTheme } from '../src/theme';

export default function Register() {
  const theme = useAppTheme();
  const s = getStyles(theme);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function set(field) {
    return (value) => setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password) {
      setError('Preencha todos os campos');
      return;
    }
    if (form.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.register(form);
      await login(form.email, form.password);
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
        <Text style={s.title}>Criar conta</Text>
        <Text style={s.subtitle}>É rápido</Text>

        <Text style={s.label}>Nome</Text>
        <TextInput style={s.input} value={form.name} onChangeText={set('name')} placeholder="Seu nome" placeholderTextColor={theme.muted} />

        <Text style={s.label}>E-mail</Text>
        <TextInput style={s.input} value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" placeholder="seu@email.com" placeholderTextColor={theme.muted} />

        <Text style={s.label}>Senha</Text>
        <TextInput style={s.input} value={form.password} onChangeText={set('password')} secureTextEntry placeholder="Mín. 6 caracteres" placeholderTextColor={theme.muted} />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={[s.btn, busy && s.btnDisabled]} onPress={handleSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color={theme.panel} /> : <Text style={s.btnText}>Criar conta</Text>}
        </TouchableOpacity>

        <Link href="/login" style={s.link}>Já tem conta? Entrar</Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  screen:    { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:      { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 28, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: theme.border },
  title:     { fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: 4 },
  subtitle:  { fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 20 },
  label:     { fontSize: 13, color: theme.muted, marginTop: 12, marginBottom: 4 },
  input:     { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 15, color: theme.text, backgroundColor: theme.panel },
  error:     { color: theme.danger, fontSize: 13, marginTop: 8 },
  btn:       { backgroundColor: theme.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  link:      { color: theme.accent, fontSize: 13, textAlign: 'center', marginTop: 16 },
});
