// mobile/app/recipients/new.jsx
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import RecipientForm from '../../components/RecipientForm';
import { api } from '../../src/api';
import { theme } from '../../src/theme';

export default function NewRecipient() {
  const router = useRouter();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.listProducts().then(setProducts).catch(() => {});
  }, []);

  async function handleSubmit(payload) {
    const created = await api.createRecipient(payload);
    router.replace(`/recipients/${created.id}`);
  }

  return (
    <View style={s.screen}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Novo recipiente',
        headerStyle: { backgroundColor: theme.panel },
        headerTintColor: theme.accent,
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
      }} />
      <RecipientForm
        products={products}
        submitLabel="Criar recipiente"
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
});
