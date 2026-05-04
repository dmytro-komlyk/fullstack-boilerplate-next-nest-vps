import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
// import { AiAssistantPlugin } from '@/components/plugins/AiAssistantPlugin'; // Убедись, что создал .native версию
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '@package/api/client';
import { useAuthStore } from '@package/store/auth-native';
import { useRouter } from 'expo-router';

import { Toast } from 'toastify-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      const response = await logoutMutation.mutateAsync();
      Toast.success(response.message);
    } catch (error) {
      console.warn('Backend logout failed', error);
    } finally {
      await logout();
    }
  };

  const highlights = [
    {
      title: 'Single Source',
      desc: 'Shared Zod schemas across Web and Mobile.',
      icon: <MaterialCommunityIcons name="cube-outline" size={24} color="#f97316" />,
      color: 'rgba(249, 115, 22, 0.1)',
    },
    {
      title: 'Native Mobile',
      desc: 'Baked in Expo app with shared logic.',
      icon: <MaterialCommunityIcons name="cellphone" size={24} color="#a855f7" />,
      color: 'rgba(168, 85, 247, 0.1)',
    },
    {
      title: 'Security',
      desc: 'RBAC and secure sessions pre-configured.',
      icon: <MaterialCommunityIcons name="shield-check-outline" size={24} color="#22c55e" />,
      color: 'rgba(34, 197, 94, 0.1)',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#6366f1', dark: '#1e1b4b' }}
        headerImage={
          <View style={styles.heroOverlay}>
            <MaterialCommunityIcons
              name="console"
              size={120}
              color="rgba(255,255,255,0.1)"
              style={styles.bgIcon}
            />
            <ThemedText style={styles.heroBadge}>v1.0.0 Production Ready</ThemedText>
          </View>
        }
      >
        {/* User Profile Card */}
        <ThemedView style={[styles.userCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.userInfoRow}>
            <Image
              source={
                user?.avatarUrl ? { uri: user.avatarUrl } : require('@/assets/images/icon.png')
              }
              style={styles.avatar}
              transition={500}
            />
            <View style={styles.userTextContainer}>
              <View style={styles.welcomeRow}>
                <ThemedText style={styles.welcomeText}>Hello,</ThemedText>
                <HelloWave />
              </View>
              <ThemedText type="subtitle" style={styles.nickName}>
                {user?.nickName || 'Guest'}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Hero Section Copy */}
        <View style={styles.section}>
          <ThemedText style={styles.heroTitle}>
            The Ultimate <ThemedText style={styles.brandText}>Fullstack</ThemedText> Monorepo
          </ThemedText>
          <ThemedText style={styles.heroDesc}>
            Accelerate development with Omni-tRPC-Stack. High-performance architecture integrating
            Next.js & Expo.
          </ThemedText>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.mainButton}>
              <ThemedText style={styles.mainButtonText}>Get Started</ThemedText>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Core Capabilities - Mobile Vertical Grid */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>CORE CAPABILITIES</ThemedText>
          {highlights.map((item, idx) => (
            <View key={idx} style={[styles.featCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>{item.icon}</View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.featTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.featDesc}>{item.desc}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Footer Status */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <View style={styles.greenDot} />
            <ThemedText style={styles.statusText}>CI/CD: READY</ThemedText>
          </View>
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#6366f1" />
            <ThemedText style={styles.statusText}>AUTH: SECURE</ThemedText>
          </View>
        </View>
      </ParallaxScrollView>

      {/* Наш чат-бот как плавающий виджет */}
      {/* <AiAssistantPlugin /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  bgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    overflow: 'hidden',
  },
  userCard: {
    padding: 20,
    borderRadius: 28,
    marginTop: -30,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardLight: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9' },
  cardDark: { backgroundColor: '#1e293b' },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9' },
  userTextContainer: { marginLeft: 16, flex: 1 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  welcomeText: { fontSize: 16, opacity: 0.6 },
  nickName: { fontSize: 22, fontWeight: '800' },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  section: { marginTop: 32, paddingHorizontal: 4 },
  heroTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38 },
  brandText: { color: '#6366f1' },
  heroDesc: { textAlign: 'center', marginTop: 12, opacity: 0.6, lineHeight: 22, fontSize: 16 },
  buttonGroup: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  mainButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    height: 56,
    borderRadius: 18,
    gap: 8,
  },
  mainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.4,
    letterSpacing: 2,
    marginBottom: 16,
  },
  featCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featTitle: { fontSize: 18, fontWeight: 'bold' },
  featDesc: { fontSize: 14, opacity: 0.5, marginTop: 2 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 40,
    opacity: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
});
