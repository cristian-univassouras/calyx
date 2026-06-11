# Calyx Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o app mobile Calyx em React Native com Expo Router, consumindo a API Calyx REST, com paridade visual e funcional ao frontend web existente.

**Architecture:** Expo Router com file-based routing — Tab Bar para navegação principal (Recipientes, Produtos, Categorias, Perfil) e Stack para telas de detalhe/criar/editar. Auth via React Context + AsyncStorage. Estilos com StyleSheet usando tokens de design portados do CSS do frontend.

**Tech Stack:** React Native, Expo SDK 56, Expo Router, react-native-svg, @react-native-async-storage/async-storage, expo-clipboard

**Spec:** `docs/superpowers/specs/2026-06-10-calyx-mobile-app-design.md`

---

## Estrutura de arquivos final

```
mobile/
├── app/
│   ├── _layout.jsx                    ← root: AuthProvider + AuthGuard + Stack
│   ├── login.jsx
│   ├── register.jsx
│   ├── (tabs)/
│   │   ├── _layout.jsx                ← Tab Bar (4 abas)
│   │   ├── index.jsx                  ← Recipientes
│   │   ├── produtos.jsx
│   │   ├── categorias.jsx
│   │   └── perfil.jsx
│   └── recipients/
│       ├── _layout.jsx                ← Stack recipients
│       ├── new.jsx
│       └── [id]/
│           ├── _layout.jsx            ← Stack [id]
│           ├── index.jsx              ← RecipientDetail
│           └── edit.jsx
├── components/
│   ├── ShapeIcon.jsx
│   ├── ProductPicker.jsx
│   ├── ProfileEditor.jsx
│   └── RecipientForm.jsx              ← form compartilhado (new + edit)
└── src/
    ├── api.js
    ├── auth.jsx
    ├── calc.js
    └── theme.js
```

---

## Task 1: Setup — Expo Router + dependências

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/app.json`
- Create: `mobile/.env`
- Delete: `mobile/App.js` (substituído pelo Expo Router)

- [ ] **Step 1: Instalar dependências**

```bash
cd mobile
npx expo install expo-router react-native-svg @react-native-async-storage/async-storage expo-clipboard
```

Saída esperada: `added N packages` sem erros.

- [ ] **Step 2: Atualizar `package.json` — trocar entry point**

Abrir `mobile/package.json` e alterar o campo `"main"`:

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "expo": "~56.0.9",
    "expo-clipboard": "...",
    "expo-router": "...",
    "expo-status-bar": "~56.0.4",
    "@react-native-async-storage/async-storage": "...",
    "react": "19.2.3",
    "react-dom": "...",
    "react-native": "0.85.3",
    "react-native-svg": "...",
    "react-native-web": "..."
  },
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "private": true
}
```

- [ ] **Step 3: Adicionar `scheme` ao `app.json`**

```json
{
  "expo": {
    "name": "mobile",
    "slug": "mobile",
    "scheme": "calyx",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "ios": { "supportsTablet": true },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    }
  }
}
```

- [ ] **Step 4: Criar `mobile/.env`**

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
```

> Para dispositivo físico: substituir pelo IP local da máquina na rede (ex: `http://192.168.1.10:8080`). Para iOS Simulator: `http://localhost:8080`.

- [ ] **Step 5: Deletar `mobile/App.js`**

O Expo Router não usa App.js. Pode ser removido com segurança.

- [ ] **Step 6: Verificar que o projeto ainda inicializa**

```bash
npx expo start
```

Esperado: QR code aparece sem erros de build. Pode aparecer "No route" — isso é esperado até criarmos `app/_layout.jsx`.

---

## Task 2: `src/theme.js` — tokens de design

**Files:**
- Create: `mobile/src/theme.js`

- [ ] **Step 1: Criar o arquivo de tema**

Cria o diretório `mobile/src/` e o arquivo:

```js
// mobile/src/theme.js
export const theme = {
  bg:         '#f5ece0',
  panel:      '#fffdf9',
  panel2:     '#f3e8d6',
  border:     '#e3d3bb',
  text:       '#3b2c1d',
  muted:      '#927a60',
  accent:     '#9c6b3f',
  accent2:    '#7d5430',
  accentSoft: '#e9d9c2',
  danger:     '#b23a2e',
  honey:      '#d9a441',
  radius:     14,
};
```

---

## Task 3: `src/calc.js` — cálculos de volume

**Files:**
- Create: `mobile/src/calc.js`

- [ ] **Step 1: Copiar `calc.js` do frontend**

```bash
copy "..\frontend\src\calc.js" ".\src\calc.js"
```

> Este arquivo é lógica pura JS sem dependências de DOM — funciona no React Native sem nenhuma alteração.

- [ ] **Step 2: Verificar que as exportações estão corretas**

O arquivo deve exportar: `FORMATS`, `KEY_LABELS`, `normalizeProfile`, `totalHeight`, `totalVolume`, `filledVolume`, `dimensionsReady`, `fmtNum`.

Abrir `mobile/src/calc.js` e confirmar que as exportações existem.

---

## Task 4: `src/api.js` — camada HTTP

**Files:**
- Create: `mobile/src/api.js`

- [ ] **Step 1: Criar `mobile/src/api.js`**

```js
// mobile/src/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'calyx_token';
const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

export const getToken  = ()    => AsyncStorage.getItem(TOKEN_KEY);
export const setToken  = (t)   => AsyncStorage.setItem(TOKEN_KEY, t);
export const clearToken = ()   => AsyncStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, form, auth } = {}) {
  const headers = {};
  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (body)  headers['Content-Type'] = 'application/json';
  if (form)  headers['Content-Type'] = 'application/x-www-form-urlencoded';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body
      ? JSON.stringify(body)
      : form
      ? Object.entries(form).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
      : undefined,
  });

  if (!res.ok) {
    let msg;
    try {
      const j = await res.json();
      msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail ?? j);
    } catch {
      msg = `HTTP ${res.status}`;
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login:    (email, password) => request('/auth/login',    { method: 'POST', form: { username: email, password } }),
  register: (payload)         => request('/auth/register', { method: 'POST', body: payload }),
  me:       ()                => request('/auth/me',       { auth: true }),

  // Categories
  listCategories:  ()        => request('/categories',     { auth: true }),
  createCategory:  (payload) => request('/categories',     { method: 'POST', body: payload, auth: true }),

  // Products
  listProducts:  ()           => request('/products',          { auth: true }),
  createProduct: (payload)    => request('/products',          { method: 'POST', body: payload, auth: true }),
  updateProduct: (id, payload)=> request(`/products/${id}`,    { method: 'PATCH', body: payload, auth: true }),
  deleteProduct: (id)         => request(`/products/${id}`,    { method: 'DELETE', auth: true }),

  // Recipients
  listRecipients:   ()            => request('/recipients',           { auth: true }),
  getRecipient:     (id)          => request(`/recipients/${id}`,     { auth: true }),
  createRecipient:  (payload)     => request('/recipients',           { method: 'POST', body: payload, auth: true }),
  updateRecipient:  (id, payload) => request(`/recipients/${id}`,     { method: 'PATCH', body: payload, auth: true }),
  deleteRecipient:  (id)          => request(`/recipients/${id}`,     { method: 'DELETE', auth: true }),

  // Measurements
  createMeasurement: (id, distance) =>
    request(`/recipients/${id}/measurements`, { method: 'POST', body: { distance_from_lid: distance }, auth: true }),
  currentFill: (id) => request(`/recipients/${id}/fill`,               { auth: true }),
  listMeasurements: (id, limit = 50) =>
    request(`/recipients/${id}/measurements?limit=${limit}`,           { auth: true }),
};
```

---

## Task 5: `src/auth.jsx` — contexto de autenticação

**Files:**
- Create: `mobile/src/auth.jsx`

- [ ] **Step 1: Criar `mobile/src/auth.jsx`**

```jsx
// mobile/src/auth.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { access_token } = await api.login(email, password);
    await setToken(access_token);
    const me = await api.me();
    setUser(me);
  }

  async function logout() {
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Task 6: `app/_layout.jsx` — root layout + guard

**Files:**
- Create: `mobile/app/_layout.jsx`

- [ ] **Step 1: Criar `mobile/app/_layout.jsx`**

```jsx
// mobile/app/_layout.jsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/auth';

function AuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'login' || segments[0] === 'register';
    if (!user && !inAuth) router.replace('/login');
    if (user && inAuth)   router.replace('/');
  }, [user, loading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="recipients" />
      </Stack>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Verificar que o Expo Router reconhece o layout**

```bash
npx expo start
```

Esperado: app inicializa sem erros. O guard deve redirecionar para `/login` (que ainda não existe — pode aparecer erro de rota não encontrada, isso é normal).

---

## Task 7: Telas de autenticação

**Files:**
- Create: `mobile/app/login.jsx`
- Create: `mobile/app/register.jsx`

- [ ] **Step 1: Criar `mobile/app/login.jsx`**

```jsx
// mobile/app/login.jsx
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
```

- [ ] **Step 2: Criar `mobile/app/register.jsx`**

```jsx
// mobile/app/register.jsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { useAuth } from '../src/auth';
import { api } from '../src/api';
import { theme } from '../src/theme';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);
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

const s = StyleSheet.create({
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
```

- [ ] **Step 3: Testar login/register no dispositivo**

Abrir o app, deve aparecer a tela de login. Preencher com credenciais válidas e confirmar que redireciona para `/` (aba de recipientes — que ainda não existe, mas o redirect deve funcionar sem crash).

---

## Task 8: Tab Bar layout

**Files:**
- Create: `mobile/app/(tabs)/_layout.jsx`

- [ ] **Step 1: Criar o diretório `mobile/app/(tabs)/` e o layout**

```jsx
// mobile/app/(tabs)/_layout.jsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '../../src/theme';

function Icon({ emoji }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.panel,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Recipientes', tabBarIcon: () => <Icon emoji="🫙" /> }}
      />
      <Tabs.Screen
        name="produtos"
        options={{ title: 'Produtos', tabBarIcon: () => <Icon emoji="🧪" /> }}
      />
      <Tabs.Screen
        name="categorias"
        options={{ title: 'Categorias', tabBarIcon: () => <Icon emoji="📂" /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: () => <Icon emoji="👤" /> }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Criar placeholder para cada aba (para não quebrar a navegação)**

Criar os 4 arquivos temporários:

`mobile/app/(tabs)/index.jsx`:
```jsx
import { View, Text } from 'react-native';
export default function Recipientes() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Recipientes</Text></View>;
}
```

`mobile/app/(tabs)/produtos.jsx`, `categorias.jsx`, `perfil.jsx`: mesmo conteúdo com nome diferente.

- [ ] **Step 3: Verificar Tab Bar no dispositivo**

As 4 abas devem aparecer na parte inferior com os emojis correspondentes.

---

## Task 9: `components/ShapeIcon.jsx`

**Files:**
- Create: `mobile/components/ShapeIcon.jsx`

- [ ] **Step 1: Criar `mobile/components/ShapeIcon.jsx`**

```jsx
// mobile/components/ShapeIcon.jsx
import React from 'react';
import Svg, {
  Defs, ClipPath, Path, Rect,
  Ellipse, Line, Circle, G,
} from 'react-native-svg';
import { theme } from '../src/theme';

let _uid = 0;

const SHAPES = {
  cilindric: {
    yTop: 18, yBottom: 82,
    clipD: 'M22,18 V82 A28,8 0 0 0 78,82 V18 A28,8 0 0 1 22,18 Z',
    Outline: ({ c, w }) => (
      <G>
        <Ellipse cx="50" cy="18" rx="28" ry="8" fill="none" stroke={c} strokeWidth={w} />
        <Line x1="22" y1="18" x2="22" y2="82" stroke={c} strokeWidth={w} />
        <Line x1="78" y1="18" x2="78" y2="82" stroke={c} strokeWidth={w} />
        <Ellipse cx="50" cy="82" rx="28" ry="8" fill="none" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  square: {
    yTop: 30, yBottom: 82,
    clipD: 'M30,30 H70 V82 H30 Z',
    Outline: ({ c, w }) => (
      <G>
        <Path d="M22,22 L70,22 L78,30 L78,82 L30,82 L22,74 Z" fill="none" stroke={c} strokeWidth={w} />
        <Line x1="22" y1="22" x2="30" y2="30" stroke={c} strokeWidth={w} />
        <Line x1="70" y1="22" x2="78" y2="30" stroke={c} strokeWidth={w} />
        <Line x1="30" y1="30" x2="70" y2="30" stroke={c} strokeWidth={w} />
        <Line x1="30" y1="30" x2="30" y2="82" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  rectangular: {
    yTop: 34, yBottom: 82,
    clipD: 'M20,34 H68 V82 H20 Z',
    Outline: ({ c, w }) => (
      <G>
        <Path d="M12,26 L68,26 L80,34 L80,82 L20,82 L12,74 Z" fill="none" stroke={c} strokeWidth={w} />
        <Line x1="12" y1="26" x2="20" y2="34" stroke={c} strokeWidth={w} />
        <Line x1="68" y1="26" x2="80" y2="34" stroke={c} strokeWidth={w} />
        <Line x1="20" y1="34" x2="68" y2="34" stroke={c} strokeWidth={w} />
        <Line x1="20" y1="34" x2="20" y2="82" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  conical: {
    yTop: 16, yBottom: 80,
    clipD: 'M50,16 L80,80 A30,8 0 0 1 20,80 Z',
    Outline: ({ c, w }) => (
      <G>
        <Line x1="50" y1="16" x2="20" y2="80" stroke={c} strokeWidth={w} />
        <Line x1="50" y1="16" x2="80" y2="80" stroke={c} strokeWidth={w} />
        <Ellipse cx="50" cy="80" rx="30" ry="8" fill="none" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  spherical: {
    yTop: 16, yBottom: 84,
    clipD: 'M50,16 A34,34 0 1 0 50,84 A34,34 0 1 0 50,16 Z',
    Outline: ({ c, w }) => (
      <G>
        <Circle cx="50" cy="50" r="34" fill="none" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  custom: {
    yTop: 14, yBottom: 90,
    clipD: 'M42,18 H58 V30 C58,36 70,38 70,48 V82 Q70,90 62,90 H38 Q30,90 30,82 V48 C30,38 42,36 42,30 Z',
    Outline: ({ c, w }) => (
      <G>
        <Path
          d="M42,18 H58 V30 C58,36 70,38 70,48 V82 Q70,90 62,90 H38 Q30,90 30,82 V48 C30,38 42,36 42,30 Z"
          fill="none" stroke={c} strokeWidth={w}
        />
        <Line x1="42" y1="14" x2="42" y2="18" stroke={c} strokeWidth={w} />
        <Line x1="58" y1="14" x2="58" y2="18" stroke={c} strokeWidth={w} />
        <Line x1="40" y1="14" x2="60" y2="14" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
};

export default function ShapeIcon({ format, fill = null, size = 96 }) {
  const shape = SHAPES[format] || SHAPES.cilindric;
  const clipId = React.useRef(`sc${++_uid}`).current;
  const sw = (3 * 100) / size;
  const { Outline } = shape;

  let liquidY = null;
  if (fill != null) {
    const p = Math.min(Math.max(fill, 0), 100) / 100;
    liquidY = shape.yBottom - p * (shape.yBottom - shape.yTop);
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {liquidY != null && (
        <Defs>
          <ClipPath id={clipId}>
            <Path d={shape.clipD} />
          </ClipPath>
        </Defs>
      )}
      {liquidY != null && (
        <Rect
          x="0"
          y={liquidY}
          width="100"
          height={shape.yBottom - liquidY + 4}
          fill={theme.honey}
          fillOpacity={0.45}
          clipPath={`url(#${clipId})`}
        />
      )}
      <Outline c={theme.accent} w={sw} />
    </Svg>
  );
}
```

- [ ] **Step 2: Verificar o ShapeIcon num placeholder**

Editar `app/(tabs)/index.jsx` temporariamente:

```jsx
import { View } from 'react-native';
import ShapeIcon from '../../components/ShapeIcon';
export default function Test() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <ShapeIcon format="cilindric" fill={80} size={100} />
      <ShapeIcon format="spherical" fill={45} size={100} />
      <ShapeIcon format="custom"    fill={20} size={100} />
    </View>
  );
}
```

Esperado: 3 ícones SVG com preenchimento mel animado nos formatos corretos. Desfazer após validar.

---

## Task 10: `components/ProductPicker.jsx`

**Files:**
- Create: `mobile/components/ProductPicker.jsx`

- [ ] **Step 1: Criar `mobile/components/ProductPicker.jsx`**

```jsx
// mobile/components/ProductPicker.jsx
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
                  <Text style={s.avatarText}>{p.name[0]?.toUpperCase()}</Text>
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
```

---

## Task 11: `components/ProfileEditor.jsx`

**Files:**
- Create: `mobile/components/ProfileEditor.jsx`

- [ ] **Step 1: Criar `mobile/components/ProfileEditor.jsx`**

```jsx
// mobile/components/ProfileEditor.jsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../src/theme';

export default function ProfileEditor({ value = [[0, 0]], onChange }) {
  const rows = value.length > 0 ? value : [[0, 0]];

  function updateRow(idx, col, val) {
    const next = rows.map((r) => [...r]);
    next[idx][col] = parseFloat(val) || 0;
    onChange(next);
  }

  function addRow() {
    onChange([...rows, [0, 0]]);
  }

  function removeRow(idx) {
    if (idx === 0) return;
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
        <View key={i} style={s.row}>
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

const s = StyleSheet.create({
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
```

---

## Task 12: `components/RecipientForm.jsx` — formulário compartilhado

**Files:**
- Create: `mobile/components/RecipientForm.jsx`

- [ ] **Step 1: Criar `mobile/components/RecipientForm.jsx`**

```jsx
// mobile/components/RecipientForm.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import ShapeIcon from './ShapeIcon';
import ProductPicker from './ProductPicker';
import ProfileEditor from './ProfileEditor';
import { api } from '../src/api';
import { theme } from '../src/theme';
import {
  FORMATS, KEY_LABELS,
  totalVolume, dimensionsReady, normalizeProfile, fmtNum,
} from '../src/calc';

const FORMAT_LIST = Object.entries(FORMATS);

export default function RecipientForm({ initialData, onSubmit, submitLabel }) {
  const router = useRouter();
  const [name,      setName]      = useState(initialData?.name || '');
  const [format,    setFormat]    = useState(initialData?.format || 'cilindric');
  const [dims,      setDims]      = useState(initialData?.dimensions || {});
  const [productId, setProductId] = useState(
    initialData?.product_id ? String(initialData.product_id) : ''
  );
  const [products, setProducts] = useState([]);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    api.listProducts().then(setProducts).catch(() => {});
  }, []);

  const dimKeys = format !== 'custom' ? (FORMATS[format]?.keys || []) : [];
  const ready   = name.trim() !== '' && dimensionsReady(format, dims);

  const preview = useMemo(() => {
    if (!ready) return null;
    try { return { volume: totalVolume(format, dims) }; }
    catch { return null; }
  }, [format, dims, ready]);

  const product = products.find((p) => String(p.id) === productId) || null;

  async function handleSubmit() {
    if (!ready) return;
    setBusy(true);
    setError('');
    const payload = {
      name: name.trim(),
      format,
      dimensions: format === 'custom'
        ? { profile: normalizeProfile(dims.profile || []).map(([h, v]) => ({ h, v })) }
        : { ...dims },
      product_id: productId ? parseInt(productId) : undefined,
    };
    try {
      await onSubmit(payload);
      router.replace('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      {/* Nome */}
      <View style={s.card}>
        <Text style={s.label}>Nome do recipiente *</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Pote de arroz"
          placeholderTextColor={theme.muted}
        />
      </View>

      {/* Formato */}
      <View style={s.card}>
        <Text style={s.label}>Formato *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {FORMAT_LIST.map(([key, { label }]) => (
              <TouchableOpacity
                key={key}
                style={[s.pickCard, format === key && s.pickCardSelected]}
                onPress={() => { setFormat(key); setDims({}); }}
              >
                <ShapeIcon format={key} size={48} />
                <Text style={[s.pickLabel, format === key && s.pickLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Dimensões */}
      <View style={s.card}>
        <Text style={s.label}>Medidas (em cm) *</Text>
        {format === 'custom' ? (
          <ProfileEditor
            value={dims.profile || [[0, 0]]}
            onChange={(p) => setDims({ profile: p })}
          />
        ) : (
          <View style={s.dimsGrid}>
            {dimKeys.map((k) => (
              <View key={k} style={s.dimField}>
                <Text style={s.dimLabel}>{KEY_LABELS[k]}</Text>
                <TextInput
                  style={s.input}
                  value={dims[k] != null ? String(dims[k]) : ''}
                  onChangeText={(t) => setDims((d) => ({ ...d, [k]: parseFloat(t) || '' }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.muted}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Produto */}
      <View style={s.card}>
        <Text style={s.label}>Produto (conteúdo)</Text>
        <ProductPicker products={products} value={productId} onChange={setProductId} />
      </View>

      {/* Prévia */}
      {preview && (
        <View style={s.card}>
          <Text style={s.sectionLabel}>PRÉVIA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <ShapeIcon format={format} fill={100} size={100} />
            <View style={s.statsGrid}>
              <View style={s.stat}>
                <Text style={s.statVal}>{fmtNum(preview.volume, 1)} cm³</Text>
                <Text style={s.statKey}>Volume total</Text>
              </View>
              {product && (
                <View style={s.stat}>
                  <Text style={s.statVal}>{fmtNum(preview.volume * product.density, 0)} g</Text>
                  <Text style={s.statKey}>Peso cheio</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[s.btn, (!ready || busy) && s.btnDisabled]}
        onPress={handleSubmit}
        disabled={!ready || busy}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>{submitLabel}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={s.btnSecondary} onPress={() => router.back()}>
        <Text style={s.btnSecondaryText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: theme.bg },
  card:             { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border, gap: 8 },
  label:            { fontSize: 13, color: theme.muted, fontWeight: '600' },
  sectionLabel:     { fontSize: 11, fontWeight: '700', color: theme.muted, letterSpacing: 1 },
  input:            { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 15, color: theme.text, backgroundColor: theme.panel },
  dimsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dimField:         { minWidth: '45%', flex: 1 },
  dimLabel:         { fontSize: 12, color: theme.muted, marginBottom: 4 },
  pickCard:         { alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 2, borderColor: theme.border, backgroundColor: theme.panel, minWidth: 80 },
  pickCardSelected: { borderColor: theme.accent2, backgroundColor: theme.accentSoft },
  pickLabel:        { fontSize: 11, color: theme.muted, marginTop: 4, textAlign: 'center' },
  pickLabelSelected:{ color: theme.accent2, fontWeight: '600' },
  statsGrid:        { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat:             { minWidth: '45%', backgroundColor: theme.panel2, borderRadius: 8, padding: 10 },
  statVal:          { fontSize: 15, fontWeight: 'bold', color: theme.text },
  statKey:          { fontSize: 11, color: theme.muted },
  error:            { color: theme.danger, fontSize: 13 },
  btn:              { backgroundColor: theme.accent, borderRadius: 8, padding: 14, alignItems: 'center' },
  btnDisabled:      { opacity: 0.5 },
  btnText:          { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnSecondary:     { backgroundColor: theme.panel2, borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  btnSecondaryText: { color: theme.text, fontWeight: '600' },
});
```

---

## Task 13: Stack layouts de recipients

**Files:**
- Create: `mobile/app/recipients/_layout.jsx`
- Create: `mobile/app/recipients/[id]/_layout.jsx`

- [ ] **Step 1: Criar `mobile/app/recipients/_layout.jsx`**

```jsx
// mobile/app/recipients/_layout.jsx
import { Stack } from 'expo-router';
export default function RecipientsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Criar `mobile/app/recipients/[id]/_layout.jsx`**

```jsx
// mobile/app/recipients/[id]/_layout.jsx
import { Stack } from 'expo-router';
export default function RecipientIdLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

---

## Task 14: Aba Recipientes — lista

**Files:**
- Modify: `mobile/app/(tabs)/index.jsx`

- [ ] **Step 1: Substituir placeholder pelo código real**

```jsx
// mobile/app/(tabs)/index.jsx
import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import ShapeIcon from '../../components/ShapeIcon';
import { api } from '../../src/api';
import { theme } from '../../src/theme';

function fillColor(pct) {
  if (pct == null) return theme.muted;
  if (pct > 60)   return '#4ade80';
  if (pct > 25)   return '#facc15';
  return '#f87171';
}

function RecipientCard({ item, onPress }) {
  const pct   = item.last_fill_percent;
  const color = fillColor(pct);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <ShapeIcon format={item.format} fill={pct} size={72} />
      <View style={s.info}>
        <Text style={s.name}>{item.name}</Text>
        <Text style={[s.pct, { color }]}>
          {pct != null ? `${pct.toFixed(1)}%` : 'Sem leitura'}
        </Text>
        {item.last_mass_g != null && (
          <Text style={s.meta}>⚖️ {item.last_mass_g.toFixed(0)} g</Text>
        )}
        {item.last_reading_at && (
          <Text style={s.meta}>
            🕐 {new Date(item.last_reading_at).toLocaleString('pt-BR')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function Recipientes() {
  const [recipients, setRecipients] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const router = useRouter();

  async function load() {
    try {
      const data = await api.listRecipients();
      setRecipients(data);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []));

  async function refresh() {
    setRefreshing(true);
    await load();
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
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Recipientes</Text>
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <FlatList
        data={recipients}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <RecipientCard
            item={item}
            onPress={() => router.push(`/recipients/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />
        }
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={s.empty}>Nenhum recipiente cadastrado</Text>
        }
      />
      <TouchableOpacity style={s.fab} onPress={() => router.push('/recipients/new')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: theme.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  header:  { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:   { fontSize: 22, fontWeight: 'bold', color: theme.text },
  card:    { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: theme.border },
  info:    { flex: 1 },
  name:    { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 2 },
  pct:     { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  meta:    { fontSize: 12, color: theme.muted },
  error:   { color: theme.danger, padding: 16, fontSize: 13 },
  empty:   { textAlign: 'center', color: theme.muted, marginTop: 40 },
  fab:     { position: 'absolute', bottom: 24, right: 24, backgroundColor: theme.accent, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
});
```

---

## Task 15: Telas de criar e editar recipiente

**Files:**
- Create: `mobile/app/recipients/new.jsx`
- Create: `mobile/app/recipients/[id]/edit.jsx`

- [ ] **Step 1: Criar `mobile/app/recipients/new.jsx`**

```jsx
// mobile/app/recipients/new.jsx
import { View, Text, StyleSheet } from 'react-native';
import RecipientForm from '../../components/RecipientForm';
import { api } from '../../src/api';
import { theme } from '../../src/theme';

export default function NewRecipient() {
  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Novo recipiente</Text>
        <Text style={s.subtitle}>Medidas em centímetros</Text>
      </View>
      <RecipientForm
        submitLabel="Criar recipiente"
        onSubmit={(payload) => api.createRecipient(payload)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: theme.bg },
  header:   { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:    { fontSize: 22, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 13, color: theme.muted, marginTop: 2 },
});
```

- [ ] **Step 2: Criar `mobile/app/recipients/[id]/edit.jsx`**

```jsx
// mobile/app/recipients/[id]/edit.jsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import RecipientForm from '../../../components/RecipientForm';
import { api } from '../../../src/api';
import { theme } from '../../../src/theme';

export default function EditRecipient() {
  const { id } = useLocalSearchParams();
  const [recipient, setRecipient] = useState(null);
  const [error,     setError]     = useState('');

  useEffect(() => {
    api.getRecipient(id)
      .then(setRecipient)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.error}>{error}</Text>
      </View>
    );
  }

  if (!recipient) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Editar recipiente</Text>
        <Text style={s.subtitle}>Medidas em centímetros</Text>
      </View>
      <RecipientForm
        initialData={recipient}
        submitLabel="Salvar alterações"
        onSubmit={(payload) => api.updateRecipient(id, payload)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: theme.bg },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  header:   { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:    { fontSize: 22, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 13, color: theme.muted, marginTop: 2 },
  error:    { color: theme.danger, fontSize: 14 },
});
```

---

## Task 16: Tela de detalhe do recipiente

**Files:**
- Create: `mobile/app/recipients/[id]/index.jsx`

- [ ] **Step 1: Criar `mobile/app/recipients/[id]/index.jsx`**

```jsx
// mobile/app/recipients/[id]/index.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
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

  const [recipient, setRecipient] = useState(null);
  const [products,  setProducts]  = useState([]);
  const [live,      setLive]      = useState(null);
  const [distance,  setDistance]  = useState('');
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [busy,      setBusy]      = useState(false);
  const [copied,    setCopied]    = useState(false);

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
  }, [recipient, id]);

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
    setTimeout(() => setCopied(false), 2000);
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

  function handleDelete() {
    Alert.alert(
      'Excluir recipiente',
      'Tem certeza? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteRecipient(id);
              router.replace('/');
            } catch (e) {
              setError(e.message);
            }
          },
        },
      ]
    );
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

  const maxH    = totalHeight(recipient.format, recipient.dimensions);
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
      <View style={s.btnRow}>
        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => router.push(`/recipients/${id}/edit`)}
        >
          <Text style={s.btnSecondaryText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnDanger} onPress={handleDelete}>
          <Text style={s.btnDangerText}>🗑 Excluir</Text>
        </TouchableOpacity>
      </View>

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
  btnRow:           { flexDirection: 'row', gap: 10 },
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
```

---

## Task 17: Aba Produtos — CRUD

**Files:**
- Modify: `mobile/app/(tabs)/produtos.jsx`

- [ ] **Step 1: Substituir placeholder pelo código real**

```jsx
// mobile/app/(tabs)/produtos.jsx
import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { theme } from '../../src/theme';

function ProductModal({ visible, product, categories, onClose, onSaved }) {
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
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing,    setEditing]    = useState(null);
  const [loading,    setLoading]    = useState(true);

  async function load() {
    try {
      const [prods, cats] = await Promise.all([
        api.listProducts(),
        api.listCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {}
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
        onPress: async () => { await api.deleteProduct(id); load(); },
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

const s = StyleSheet.create({
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
});

const ms = StyleSheet.create({
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
```

---

## Task 18: Aba Categorias

**Files:**
- Modify: `mobile/app/(tabs)/categorias.jsx`

- [ ] **Step 1: Substituir placeholder pelo código real**

```jsx
// mobile/app/(tabs)/categorias.jsx
import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { theme } from '../../src/theme';

const METHODS = ['volume_to_mass', 'volume_only'];

export default function Categorias() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [name,       setName]       = useState('');
  const [method,     setMethod]     = useState('volume_to_mass');
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState('');

  async function load() {
    try {
      setCategories(await api.listCategories());
    } catch (e) {
      setError(e.message);
    }
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []));

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.createCategory({ name: name.trim(), method });
      setName('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

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
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.meta}>{item.method || '—'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Nenhuma categoria</Text>}
        ListFooterComponent={
          <View style={s.form}>
            <Text style={s.formTitle}>Nova categoria</Text>

            <Text style={s.label}>Nome *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Grãos e cereais"
              placeholderTextColor={theme.muted}
            />

            <Text style={s.label}>Método</Text>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.methodOption, method === m && s.methodSelected]}
                onPress={() => setMethod(m)}
              >
                <Text style={[s.methodText, method === m && s.methodTextSelected]}>{m}</Text>
              </TouchableOpacity>
            ))}

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[s.btn, (!name.trim() || busy) && s.btnDisabled]}
              onPress={handleCreate}
              disabled={!name.trim() || busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Criar categoria</Text>
              }
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:            { flex: 1, backgroundColor: theme.bg },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  header:            { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:             { fontSize: 22, fontWeight: 'bold', color: theme.text },
  row:               { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  name:              { fontSize: 15, fontWeight: '600', color: theme.text },
  meta:              { fontSize: 12, color: theme.muted },
  empty:             { textAlign: 'center', color: theme.muted, marginTop: 20 },
  form:              { backgroundColor: theme.panel, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border, gap: 8, marginTop: 10 },
  formTitle:         { fontSize: 15, fontWeight: '700', color: theme.text },
  label:             { fontSize: 13, color: theme.muted, fontWeight: '600' },
  input:             { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 15, color: theme.text, backgroundColor: theme.panel },
  methodOption:      { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel },
  methodSelected:    { borderColor: theme.accent2, backgroundColor: theme.accentSoft },
  methodText:        { color: theme.text },
  methodTextSelected:{ color: theme.accent2, fontWeight: '600' },
  error:             { color: theme.danger, fontSize: 13 },
  btn:               { backgroundColor: theme.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled:       { opacity: 0.5 },
  btnText:           { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
```

---

## Task 19: Aba Perfil

**Files:**
- Modify: `mobile/app/(tabs)/perfil.jsx`

- [ ] **Step 1: Substituir placeholder pelo código real**

```jsx
// mobile/app/(tabs)/perfil.jsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';

export default function Perfil() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
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
});
```

---

## Task 20: Verificação final

- [ ] **Step 1: Rodar o app com a API ativa**

Garantir que a API está rodando em `localhost:8080` e iniciar o app:

```bash
cd mobile
npx expo start
```

- [ ] **Step 2: Testar fluxo completo**

Testar na ordem:
1. Registrar novo usuário → deve redirecionar para aba Recipientes
2. Criar uma categoria (aba Categorias)
3. Criar um produto com densidade e emoji (aba Produtos)
4. Criar um recipiente com formato cilíndrico, dimensões, e produto vinculado (FAB +)
5. Abrir o detalhe do recipiente → verificar ShapeIcon, token IoT, simulador
6. Inserir distância no simulador → verificar preview ao vivo → clicar Registrar
7. Editar o recipiente → salvar → confirmar que voltou para a lista
8. Testar logout na aba Perfil → deve voltar para tela de login

- [ ] **Step 3: Verificar ShapeIcon nos 6 formatos**

Criar um recipiente de cada formato e confirmar que o ícone na lista e no detalhe renderiza corretamente com preenchimento.
