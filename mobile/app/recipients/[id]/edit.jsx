// mobile/app/recipients/[id]/edit.jsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import RecipientForm from '../../../components/RecipientForm';
import { api } from '../../../src/api';
import { useAppTheme } from '../../../src/theme';

export default function EditRecipient() {
  const theme = useAppTheme();
  const s = getStyles(theme);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [recipient, setRecipient] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getRecipient(id), api.listProducts()])
      .then(([r, prods]) => { setRecipient(r); setProducts(prods); })
      .catch((e) => setError(e.message));
  }, [id]);

  async function handleSubmit(payload) {
    await api.updateRecipient(id, payload);
    router.replace('/');
  }

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
      <Stack.Screen options={{
        headerShown: true,
        title: 'Editar recipiente',
        headerStyle: { backgroundColor: theme.panel },
        headerTintColor: theme.accent,
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
      }} />
      <RecipientForm
        initial={recipient}
        products={products}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  error:  { color: theme.danger, fontSize: 14 },
});
