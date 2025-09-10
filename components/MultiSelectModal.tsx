import React from 'react';

import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  items: string[];
  selected: string[];
  onConfirm: (values: string[]) => void;
  title?: string;
  okText?: string;
  cancelText?: string;
  single?: boolean;
  includeNoneOption?: boolean;
  noneLabel?: string;
};

export default function MultiSelectModal({
  visible,
  onClose,
  items,
  selected,
  onConfirm,
  title = 'Select items',
  okText = 'OK',
  cancelText = 'Cancel',
  single = false,
  includeNoneOption = false,
  noneLabel = 'None',
}: Props) {
  const [localSelected, setLocalSelected] = React.useState<string[]>(selected);

  React.useEffect(() => {
    if (visible) setLocalSelected(selected);
  }, [visible, selected]);

  const toggle = (value: string) => {
    if (single) {
      setLocalSelected([value]);
    } else {
      setLocalSelected((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
      );
    }
  };

  const data = includeNoneOption ? ['__NONE__', ...items] : items;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              if (item === '__NONE__') {
                const isSelected = localSelected.length === 0;
                return (
                  <TouchableOpacity style={styles.row} onPress={() => setLocalSelected([])}>
                    <Ionicons
                      name={
                        single
                          ? isSelected
                            ? 'radio-button-on'
                            : 'radio-button-off'
                          : isSelected
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                      }
                      size={20}
                      color={isSelected ? '#0a7ea4' : '#9BA1A6'}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={styles.rowText}>{noneLabel}</Text>
                  </TouchableOpacity>
                );
              }

              const isSelected = localSelected.includes(item);
              return (
                <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
                  <Ionicons
                    name={
                      single
                        ? isSelected
                          ? 'radio-button-on'
                          : 'radio-button-off'
                        : isSelected
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                    }
                    size={20}
                    color={isSelected ? '#0a7ea4' : '#9BA1A6'}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={styles.rowText}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.actionText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onClose();
                setTimeout(() => onConfirm(localSelected), 0);
              }}
            >
              <Text style={[styles.actionText, { color: '#0a7ea4', fontWeight: '600' }]}>
                {okText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
  },
  rowText: {
    color: '#fff',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    paddingTop: 12,
  },
  actionText: {
    color: '#9BA1A6',
    fontSize: 16,
  },
});
