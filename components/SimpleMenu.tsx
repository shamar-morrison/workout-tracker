import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SimpleMenuItem = {
  title: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: React.ReactElement;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmCancelText?: string;
  confirmConfirmText?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  items: SimpleMenuItem[];
  anchorY?: number;
};

export default function SimpleMenu({ visible, onClose, items, anchorY }: Props) {
  const insets = useSafeAreaInsets();
  const fallbackTop = insets.top + 56; // default header height
  const top = anchorY ?? fallbackTop;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.menu, { top }]}> 
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.title + index}
              style={styles.menuItem}
              onPress={() => {
                onClose();
                const run = () => item.onPress();
                if (item.destructive || item.confirmTitle || item.confirmMessage) {
                  setTimeout(
                    () =>
                      Alert.alert(
                        item.confirmTitle ?? 'Confirm action',
                        item.confirmMessage ?? 'This action cannot be undone.',
                        [
                          { text: item.confirmCancelText ?? 'Cancel', style: 'cancel' },
                          { text: item.confirmConfirmText ?? 'Confirm', style: 'destructive', onPress: run },
                        ],
                        { cancelable: true }
                      ),
                    0
                  );
                } else {
                  setTimeout(run, 0);
                }
              }}>
              {item.icon ? <View style={styles.icon}>{item.icon}</View> : null}
              <Text style={[styles.menuText, item.destructive && styles.destructive]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  menu: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#FAFBFB',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 220,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E9EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  menuText: {
    color: '#111',
    fontSize: 16,
  },
  destructive: {
    color: '#c62828',
  },
  icon: {
    width: 20,
    alignItems: 'center',
  },
});
