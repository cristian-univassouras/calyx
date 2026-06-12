# Calyx Mobile App — Design Spec

**Data:** 2026-06-10  
**Stack:** React Native (Expo SDK 56) + Expo Router + StyleSheet  
**API:** Calyx REST API (`http://<host>:8080`) — documentada em `API.md`  
**Referência visual:** `frontend/src/` — componentes e paleta portados diretamente

---

## 1. Objetivo

App mobile que consome a API Calyx para gerenciamento completo do estoque virtual de cozinha: cadastro de categorias, produtos e recipientes, monitoramento ao vivo do nível de preenchimento via sensor IoT, e simulação manual de leituras.

O app é funcionalmente equivalente ao frontend web, adaptado para mobile com a mesma identidade visual (paleta de cores, ShapeIcon animado, fluxo de telas).

---

## 2. Estrutura de arquivos

```
mobile/
├── app/
│   ├── _layout.jsx                  # root: AuthProvider + redirect guard
│   ├── login.jsx                    # tela de login
│   ├── register.jsx                 # tela de registro
│   └── (tabs)/
│       ├── _layout.jsx              # Tab Bar com 4 abas
│       ├── index.jsx                # aba Recipientes (lista)
│       ├── produtos.jsx             # aba Produtos (CRUD)
│       ├── categorias.jsx           # aba Categorias (lista + criar)
│       └── perfil.jsx               # aba Perfil + logout
├── app/recipients/
│   ├── new.jsx                      # criar recipiente
│   ├── [id].jsx                     # detalhe + monitoramento ao vivo
│   └── [id]/edit.jsx                # editar recipiente
├── components/
│   ├── ShapeIcon.jsx                # ícone SVG animado (react-native-svg)
│   ├── ProductPicker.jsx            # seletor gráfico de produtos
│   └── ProfileEditor.jsx           # editor de curva de calibração (formato custom)
└── src/
    ├── api.js                       # chamadas HTTP (AsyncStorage para token)
    ├── auth.jsx                     # AuthContext + AuthProvider
    ├── calc.js                      # cálculos de volume/peso (cópia direta do frontend)
    └── theme.js                     # tokens de design (CSS vars → JS)
```

---

## 3. Navegação

### Fluxo de autenticação

`app/_layout.jsx` é o root do Expo Router. Ele envolve tudo com `AuthProvider` e:
- Se `loading` → tela em branco (aguarda validação do token no `AsyncStorage`)
- Se não autenticado → `router.replace('/login')`
- Se autenticado → renderiza o stack normalmente (tabs aparecem)

As rotas `/login` e `/register` são públicas (sem proteção).

### Tab Bar — `app/(tabs)/_layout.jsx`

| Aba | Arquivo | Ícone | Descrição |
|-----|---------|-------|-----------|
| Recipientes | `index.jsx` | 🫙 | Lista de recipientes com ShapeIcon + % cheio |
| Produtos | `produtos.jsx` | 🧪 | CRUD de produtos com modal inline |
| Categorias | `categorias.jsx` | 📂 | Lista de categorias + criar nova |
| Perfil | `perfil.jsx` | 👤 | Dados do usuário + logout |

Cores da Tab Bar: `tabBarActiveTintColor: theme.accent`, `tabBarStyle.backgroundColor: theme.panel`.

### Stack de recipientes

Telas que navegam por cima das abas:

| Rota | Origem | Descrição |
|------|--------|-----------|
| `/recipients/new` | FAB na aba Recipientes | Formulário de criação |
| `/recipients/[id]` | Toque em um card | Detalhe + monitoramento |
| `/recipients/[id]/edit` | Botão Editar no detalhe | Formulário de edição |

---

## 4. Telas

### Login (`app/login.jsx`)
Port direto de `frontend/src/pages/Login.jsx`.
- `TextInput` email + senha
- Botão "Entrar" — chama `auth.login(email, password)`
- Link para `/register`
- Mensagem de erro inline

### Register (`app/register.jsx`)
Port direto de `frontend/src/pages/Register.jsx`.
- `TextInput` nome, email, senha (mín. 6 chars)
- Submit → `api.register()` + auto-login
- Link para `/login`

### Recipientes — lista (`app/(tabs)/index.jsx`)
Port de `frontend/src/pages/Cabinets.jsx` simplificado (sem armários — organização plana).
- `FlatList` de recipientes
- Cada item: `ShapeIcon` animado (formato + fill%) + nome + peso estimado + tempo da última leitura
- Cor do ícone varia por nível: verde (>60%), amarelo (>25%), vermelho (≤25%)
- FAB `+` no canto inferior direito → `/recipients/new`
- Pull-to-refresh

### Produtos — CRUD (`app/(tabs)/produtos.jsx`)
Port de `frontend/src/pages/Products.jsx`.
- `FlatList` de produtos com emoji, nome, densidade, categoria
- Botões Editar / Excluir por item
- `Modal` nativo do React Native para criar/editar:
  - `TextInput` emoji, nome
  - `TextInput` densidade (numérico)
  - `Picker` ou lista de categorias

### Categorias (`app/(tabs)/categorias.jsx`)
Tela simples sem equivalente direto no frontend (categorias eram implícitas).
- `FlatList` de categorias (nome + método)
- Formulário inline para criar nova categoria
- Sem edição/exclusão (sem suporte na API documentada)

### Perfil (`app/(tabs)/perfil.jsx`)
- Exibe nome e e-mail do usuário (via `auth.user`)
- Botão "Sair" → `auth.logout()` + redirect para `/login`

### Detalhe do recipiente (`app/recipients/[id].jsx`)
Port de `frontend/src/pages/RecipientDetail.jsx`. Scroll contínuo com seções:

1. **Nível ao vivo** — `ShapeIcon` grande (120px) + gauge bar + stats (%, g, cm³, distância). Polling `api.currentFill(id)` a cada 5s via `setInterval` em `useEffect`.
2. **Token IoT** — exibe `device_token` com botão copiar (`Clipboard.setStringAsync`). Mostra o `curl` de exemplo.
3. **Medidas** — dimensões do recipiente + volume total calculado por `calc.totalVolume`.
4. **Simulador** — `TextInput` para `distance_from_lid`, preview ao vivo do `ShapeIcon` + stats calculados por `calc.filledVolume`. Botão "Registrar leitura" → `api.createMeasurement`.
5. **Ações** — Botões Editar + Excluir (com `Alert.alert` de confirmação antes de deletar).

### Criar/Editar recipiente (`app/recipients/new.jsx` e `[id]/edit.jsx`)
Port de `frontend/src/pages/NewRecipient.jsx`.
- `TextInput` nome
- Seletor de formato (6 opções com `ShapeIcon` pequeno — `ScrollView` horizontal)
- Inputs de dimensões dinâmicos conforme formato escolhido (via `calc.FORMATS`)
- Se formato `custom` → `ProfileEditor`
- `ProductPicker` para associar produto
- Card de prévia: `ShapeIcon` + volume total + peso quando cheio
- Submit → `api.createRecipient` ou `api.updateRecipient`

---

## 5. Componentes

### `ShapeIcon.jsx`
Adaptação de `frontend/src/components/ShapeIcon.jsx` para `react-native-svg`.

- Props: `format`, `fill` (0–100 | null), `size` (default 96)
- Mesma geometria SVG (viewBox 100×100, `yTop`/`yBottom` por formato)
- `<Svg>` → `<Defs>` → `<ClipPath>` → `<Path clipPath>` para o líquido
- Líquido: `fill="#d9a441"` com `fillOpacity={0.45}`
- Contorno: `stroke={theme.accent}` com `strokeWidth={3}`

### `ProductPicker.jsx`
Adaptação de `frontend/src/components/ProductPicker.jsx`.

- `ScrollView` horizontal com `TouchableOpacity` por produto
- Card selecionado tem borda `theme.accent2`
- Emoji do produto ou avatar circular com inicial (cor hasheada do nome)

### `ProfileEditor.jsx`
Adaptação de `frontend/src/components/ProfileEditor.jsx`.

- `ScrollView` com linhas de pares (h, v)
- `TextInput` numérico por campo; primeira linha (0, 0) desabilitada
- Botão `+ Adicionar ponto`

---

## 6. Camada de dados

### `src/theme.js`
```js
export const theme = {
  bg:      '#f5ece0',
  panel:   '#fffdf9',
  panel2:  '#f3e8d6',
  border:  '#e3d3bb',
  text:    '#3b2c1d',
  muted:   '#927a60',
  accent:  '#9c6b3f',
  accent2: '#7d5430',
  danger:  '#b23a2e',
  honey:   '#d9a441',
  radius:  14,
}
```

### `src/api.js`
Cópia de `frontend/src/api.js` com duas alterações:
1. `localStorage` → `AsyncStorage` de `@react-native-async-storage/async-storage` (API assíncrona — funções viram `async`)
2. `BASE` lido de `process.env.EXPO_PUBLIC_API_URL` com fallback para `http://10.0.2.2:8080` (Android emulator) ou `http://localhost:8080` (web/iOS)

Todos os métodos da API documentada são implementados: auth, categories, products, recipients, measurements.

### `src/auth.jsx`
Cópia direta de `frontend/src/auth.jsx`. Funciona igual — só depende do `api.js` adaptado.

### `src/calc.js`
Cópia direta de `frontend/src/calc.js`. Lógica pura JS sem dependência de DOM — zero adaptação necessária.

---

## 7. Dependências adicionais

| Pacote | Motivo |
|--------|--------|
| `react-native-svg` | ShapeIcon (SVG com clipPath) |
| `@react-native-async-storage/async-storage` | Persistência do token JWT |
| `expo-clipboard` | Copiar device_token na tela de detalhe |
| `@react-navigation/bottom-tabs` | Tab Bar (via Expo Router) |

Instalar com `npx expo install <pacote>` para garantir versões compatíveis com SDK 56.

---

## 8. Variável de ambiente

Criar `mobile/.env` (não versionar):
```
EXPO_PUBLIC_API_URL=http://<ip-da-maquina>:8080
```

Para testes no emulador Android: `10.0.2.2`. Para dispositivo físico: IP local da máquina na rede Wi-Fi.

---

## 9. Fora de escopo

- Armários (cabinets) — presentes no frontend mas não documentados na API; não implementados
- Push notifications de nível crítico
- Modo offline / cache local de leituras
- Gráfico de histórico (linha do tempo das medições)
