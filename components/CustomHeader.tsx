import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type IconProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
};

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightIcons?: IconProps[];
  searchQuery?: string;
  onSearchQueryChange?: (text: string) => void;
  isSearchActive: boolean;
  setIsSearchActive: (isActive: boolean) => void;
};

export default function CustomHeader({
  title,
  showBackButton = false,
  rightIcons,
  searchQuery,
  onSearchQueryChange,
  isSearchActive,
  setIsSearchActive,
}: HeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const defaultRightIcons: IconProps[] = [
    {
      name: 'search',
      onPress: () => {
        setIsSearchActive(!isSearchActive);
      },
    },
  ];

  const allRightIcons = [...defaultRightIcons, ...(rightIcons || [])];

  return (
    <SafeAreaView style={[styles.headerContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { borderBottomColor: colors.icon }]}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          {!isSearchActive && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
        </View>
        {isSearchActive && onSearchQueryChange ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.icon,
                },
              ]}
              placeholder="Search..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => onSearchQueryChange('')}
                style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <View style={styles.rightContainer}>
          {allRightIcons.map((icon, index) => (
            <TouchableOpacity key={index} onPress={icon.onPress} style={styles.icon}>
              <Ionicons
                name={icon.name}
                size={icon.size || 24}
                color={icon.color || colors.text}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 30 : 20,
    paddingBottom: 5,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.84,
    // Shadow for Android
    elevation: 2,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  icon: {
    marginLeft: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
  },
});
