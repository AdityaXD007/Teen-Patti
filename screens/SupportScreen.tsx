import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

// TODO: Replace these with your actual hosted URLs
const PRIVACY_POLICY_URL = 'https://teen-patti.everesttechnologies.com.np/privacy-policy';
const TERMS_URL = 'https://teen-patti.everesttechnologies.com.np/terms';

interface SupportItem {
  icon: string;
  label: string;
  subtitle: string;
  url: string;
}

const supportItems: SupportItem[] = [
  {
    icon: 'shield-lock-outline',
    label: 'Privacy Policy',
    subtitle: 'How we handle your data',
    url: PRIVACY_POLICY_URL,
  },
  {
    icon: 'file-document-outline',
    label: 'Terms & Conditions',
    subtitle: 'Rules of using our app',
    url: TERMS_URL,
  },
];

export const SupportScreen = ({ navigation }: any) => {
  const handlePress = (item: SupportItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('WebView', { url: item.url, title: item.label });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="lifebuoy" size={40} color={theme.colors.accent} />
        </View>
        <Text style={styles.heading}>Support & Legal</Text>
        <Text style={styles.subtitle}>
          Questions or concerns? Review our policies below.
        </Text>

        <View style={styles.itemsList}>
          {supportItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.itemCard,
                index < supportItems.length - 1 && { marginBottom: theme.spacing.sm },
              ]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={22}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL('mailto:info@everesttechnologies.com.np');
            }}
          >
            <MaterialCommunityIcons name="email-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  heading: {
    ...theme.typography.title,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  itemsList: {
    width: '100%',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  itemSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  contactSection: {
    marginTop: theme.spacing.xl * 2,
    alignItems: 'center',
    width: '100%',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  contactTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  contactButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
});
