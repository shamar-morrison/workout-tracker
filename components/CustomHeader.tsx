import { ExpoContextMenu } from '@appandflow/expo-context-menu';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import {
    Keyboard,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import SimpleMenu from './SimpleMenu';

type IconProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
};

type MenuItem = {
  title: string;
  onPress: () => void;
  icon?: React.ReactElement;
  destructive?: boolean;
};

type RightTextButton = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
};

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightIcons?: IconProps[];
  rightTextButton?: RightTextButton;
  onBackPress?: () => void;
  enableSearch?: boolean;
  initialQuery?: string;
  onSearchQueryChange?: (text: string) => void;
  resetOnBlurWhenEmpty?: boolean;
  debounceMs?: number;
  searchPlaceholder?: string;
  onSearchToggle?: (active: boolean) => void;
  menuItems?: MenuItem[];
  menuOpenOnTap?: boolean;
  children?: React.ReactNode;
};

export default function CustomHeader({
  title,
  showBackButton = false,
  rightIcons,
  rightTextButton,
  onBackPress,
  enableSearch = false,
  initialQuery = '',
  onSearchQueryChange,
  resetOnBlurWhenEmpty = true,
  debounceMs = 250,
  searchPlaceholder = 'Search...',
  onSearchToggle,
  menuItems,
  menuOpenOnTap = false,
  children,
}: HeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [query, setQuery] = React.useState(initialQuery);
  const isKeyboardVisible = React.useRef(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const menuIconRef = React.useRef<View>(null);
  const [menuAnchorY, setMenuAnchorY] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      isKeyboardVisible.current = true;
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardVisible.current = false;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (resetOnBlurWhenEmpty && query === '') {
          setIsSearchActive(false);
          if (onSearchToggle) onSearchToggle(false);
          Keyboard.dismiss();
          setMenuVisible(false);
        }
      };
    }, [resetOnBlurWhenEmpty, query, onSearchToggle])
  );

  React.useEffect(() => {
    if (!enableSearch || !onSearchQueryChange) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchQueryChange(query);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, debounceMs, enableSearch, onSearchQueryChange]);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  const combinedRightIcons: IconProps[] = [];
  if (enableSearch) {
    combinedRightIcons.push({
      name: 'search',
      onPress: () => {
        setIsSearchActive((prev) => {
          const next = !prev;
          if (onSearchToggle) onSearchToggle(next);
          return next;
        });
      },
    });
  }
  if (rightIcons && rightIcons.length > 0) {
    combinedRightIcons.push(...rightIcons);
  }

  const shouldDeactivateOnOutsidePress = enableSearch && isSearchActive && !isKeyboardVisible.current && query === '';

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
        {enableSearch && isSearchActive ? (
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
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.icon}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <View style={styles.rightContainer}>
          {rightTextButton ? (
            <TouchableOpacity
              onPress={rightTextButton.onPress}
              disabled={rightTextButton.disabled}
              style={styles.textButton}
            >
              <Text
                style={{
                  color: rightTextButton.color || colors.text,
                  fontWeight: '600',
                  fontSize: 16,
                  opacity: rightTextButton.disabled ? 0.5 : 1,
                }}
              >
                {rightTextButton.label}
              </Text>
            </TouchableOpacity>
          ) : null}
          {combinedRightIcons.map((icon, index) => (
            <TouchableOpacity key={index} onPress={icon.onPress} style={styles.icon}>
              <Ionicons name={icon.name} size={icon.size || 24} color={icon.color || colors.text} />
            </TouchableOpacity>
          ))}
          {menuItems && menuItems.length > 0 ? (
            menuOpenOnTap ? (
              <TouchableOpacity
                style={styles.icon}
                onPress={() => {
                  menuIconRef.current?.measureInWindow((_x, y, _w, h) => {
                    setMenuAnchorY(y + h + 8);
                    setMenuVisible(true);
                  });
                }}
                ref={menuIconRef as any}
              >
                <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                <SimpleMenu
                  visible={menuVisible}
                  onClose={() => setMenuVisible(false)}
                  items={menuItems.map(({ title, onPress, destructive, icon }) => ({ title, onPress, destructive, icon }))}
                  anchorY={menuAnchorY}
                />
              </TouchableOpacity>
            ) : (
              <ExpoContextMenu
                menuItems={menuItems.map((m) => ({ title: m.title, onPress: m.onPress, icon: m.icon, destructive: m.destructive }))}
              >
                <View style={styles.icon}>
                  <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                </View>
              </ExpoContextMenu>
            )
          ) : null}
        </View>
      </View>

      {children ? (
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            // Only deactivate search mode when keyboard is NOT visible.
            // Avoid dismissing the keyboard on content presses to prevent
            // focus conflicts with in-list inputs.
            if (!isKeyboardVisible.current && shouldDeactivateOnOutsidePress) {
              setIsSearchActive(false);
              if (onSearchToggle) onSearchToggle(false);
            }
          }}>
          <View style={{ flex: 1 }}>{children}</View>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 30 : 20,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.84,
    elevation: 2,
    flex: 1,
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
  textButton: {
    marginLeft: 10,
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
