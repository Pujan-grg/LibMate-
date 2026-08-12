/**
 * AppNavigator
 *
 * CRASH-SAFE ARCHITECTURE (Android New Architecture / Fabric):
 *
 *   • Logged IN  → NavigationContainer → Tab.Navigator (pure JS, safe)
 *   • Logged OUT → <LoginScreen /> directly (no Navigator at all)
 *
 * WHY NO AuthStack:
 *   createNativeStackNavigator renders NativeStackView, a native Android
 *   component that crashes on New Architecture with:
 *   "java.lang.String cannot be cast to java.lang.Boolean"
 *
 *   LoginScreen already contains both Login and Register as internal tabs,
 *   so no stack navigator is needed for the auth flow.
 */
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Animated, Easing, View, Image, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import useAuthStore from '@/store/authStore';

import LoginScreen    from '@/screens/auth/LoginScreen';
import HomeScreen     from '@/screens/home/HomeScreen';
import CatalogueScreen from '@/screens/catalogue/CatalogueScreen';
import MyBooksScreen  from '@/screens/borrowings/MyBooksScreen';
import WishlistScreen from '@/screens/wishlist/WishlistScreen';
import ProfileScreen  from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const LOGO_MAIN = require('../../assets/logo_main.png');

const TAB_ICONS = {
  Home:      'home-outline',
  Catalogue: 'book-open-variant',
  MyBooks:   'bookmark-multiple-outline',
  Wishlist:  'heart-outline',
  Profile:   'account-outline',
};

// ── Splash screen (shown while checking stored token) ────────────
function SplashView() {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dotOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dotOp, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image source={LOGO_MAIN} style={splashStyles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[splashStyles.dotsRow, { opacity: dotOp }]}>
        {[0, 1, 2].map((i) => (
          <BounceDot key={i} delay={i * 150} />
        ))}
      </Animated.View>
    </View>
  );
}

function BounceDot({ delay }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: -8, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0,  duration: 350, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[splashStyles.dot, { transform: [{ translateY: y }] }]} />
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FAF7F2', gap: 40,
  },
  logo:    { width: 260, height: 260 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C4895A' },
});

// ── Main tab navigator (shown when logged in) ─────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2C1F14',
        tabBarInactiveTintColor: '#9A8478',
        tabBarStyle: {
          backgroundColor: '#FAF7F2',
          borderTopColor: '#EAE0D0',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 82 : 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={TAB_ICONS[route.name] || 'circle-outline'}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ title: 'Home' }} />
      <Tab.Screen name="Catalogue" component={CatalogueScreen} options={{ title: 'Catalogue' }} />
      <Tab.Screen name="MyBooks"   component={MyBooksScreen}   options={{ title: 'My Books' }} />
      <Tab.Screen name="Wishlist"  component={WishlistScreen}  options={{ title: 'Wishlist' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────────────────
export default function AppNavigator() {
  const { token, isLoading } = useAuthStore();

  if (isLoading) return <SplashView />;
  if (!token) return <LoginScreen />;

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
