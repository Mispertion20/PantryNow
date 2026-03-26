import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Tabs } from "expo-router";
 

export default function TabsLayout() {
  const [fontsLoaded] = useFonts({
    'Sen-Regular': require('../../assets/fonts/Sen-Regular.ttf'),
    'Sen-Bold': require('../../assets/fonts/Sen-Bold.ttf'),
    'Sen-ExtraBold': require('../../assets/fonts/Sen-ExtraBold.ttf'),
    'Sen-Medium': require('../../assets/fonts/Sen-Medium.ttf'),
    'Sen-SemiBold': require('../../assets/fonts/Sen-SemiBold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,  // hide header; optional
        tabBarActiveTintColor: '#FF6347',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { height: 60, paddingBottom: 5 },
      }}
    >
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Ionicons name="basket-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-recipes"
        options={{
          title: 'My Recipes',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="all-recipes"
        options={{
          title: 'All Recipes',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="survey-retake"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="allergy-settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="custom-instructions"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
