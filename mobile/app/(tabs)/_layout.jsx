import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAppTheme } from '../../src/theme';

function Icon({ emoji }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.panel,
          borderTopColor: theme.border,
          height: 75,
          paddingBottom: 10,
          paddingTop: 8,
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
