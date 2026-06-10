// mobile/app/recipients/[id]/_layout.jsx
import { Stack } from 'expo-router';
import { theme } from '../../../src/theme';

export default function RecipientDetailLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
