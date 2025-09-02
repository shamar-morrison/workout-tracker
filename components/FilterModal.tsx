import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  items: string[];
  selected?: string | null;
  onSelect: (value: string | null) => void;
  title?: string;
  allLabel?: string;
};

export default function FilterModal({ visible, onClose, items, selected, onSelect, title = 'Filter', allLabel = 'All' }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[null, ...items]}
            keyExtractor={(item, index) => (item ?? 'all') + index}
            renderItem={({ item }) => {
              const label = item ?? allLabel;
              const isSelected = (item ?? null) === (selected ?? null);
              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => onSelect(item ?? null)}>
                  <Text style={styles.rowText}>{label}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    maxHeight: '70%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  close: {
    color: '#8a8a8a',
    fontSize: 16,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
  },
  rowSelected: {
    backgroundColor: '#2a2a2a',
  },
  rowText: {
    color: '#fff',
    fontSize: 16,
  },
});
