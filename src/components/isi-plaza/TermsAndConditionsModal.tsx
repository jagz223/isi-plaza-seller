import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TERMS_AND_CONDITIONS_BLOCKS,
  type TermsBlock,
  type TermsTextPart,
} from '@/constants/terms-and-conditions';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const serifFont = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'serif',
});

function RichText({ parts, style }: { parts: TermsTextPart[]; style: object }) {
  return (
    <Text style={style}>
      {parts.map((part, index) => (
        <Text key={`${index}-${part.text.slice(0, 12)}`} style={part.bold ? styles.bold : undefined}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

function TermsBlockView({ block }: { block: TermsBlock }) {
  switch (block.type) {
    case 'document-title':
      return <Text style={styles.documentTitle}>{block.text}</Text>;
    case 'section-title':
      return <Text style={styles.sectionTitle}>{block.text}</Text>;
    case 'paragraph':
      return <RichText parts={block.parts} style={styles.paragraph} />;
    case 'bullet-list':
      return (
        <View style={styles.bulletList}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletMarker}>{'\u2022'}</Text>
              <RichText parts={item} style={styles.bulletText} />
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export function TermsAndConditionsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, IsiPlazaSpacing.sm) }]}>
          <Text style={styles.headerTitle}>Términos y condiciones</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cerrar términos y condiciones">
            <Ionicons name="close" size={28} color={IsiPlazaColors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, IsiPlazaSpacing.lg) },
          ]}
          showsVerticalScrollIndicator>
          {TERMS_AND_CONDITIONS_BLOCKS.map((block, index) => (
            <TermsBlockView key={index} block={block} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingBottom: IsiPlazaSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IsiPlazaColors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    paddingRight: IsiPlazaSpacing.sm,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.sm,
  },
  documentTitle: {
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    marginTop: IsiPlazaSpacing.md,
    marginBottom: IsiPlazaSpacing.xs,
    lineHeight: 28,
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 17,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    marginTop: IsiPlazaSpacing.sm,
    marginBottom: IsiPlazaSpacing.xs,
    lineHeight: 24,
  },
  paragraph: {
    fontFamily: serifFont,
    fontSize: 15,
    color: IsiPlazaColors.text,
    lineHeight: 22,
    marginBottom: IsiPlazaSpacing.xs,
  },
  bold: {
    fontWeight: '700',
  },
  bulletList: {
    gap: IsiPlazaSpacing.xs,
    marginBottom: IsiPlazaSpacing.xs,
    paddingLeft: IsiPlazaSpacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IsiPlazaSpacing.sm,
  },
  bulletMarker: {
    fontFamily: serifFont,
    fontSize: 15,
    lineHeight: 22,
    color: IsiPlazaColors.text,
    width: 12,
  },
  bulletText: {
    flex: 1,
    fontFamily: serifFont,
    fontSize: 15,
    color: IsiPlazaColors.text,
    lineHeight: 22,
  },
});
