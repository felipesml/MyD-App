import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function DateTimeField({ value, onChange }: Props) {
  const { formatDate, formatTime, timeFormat } = usePreferences();
  const { colors } = useTheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const dateString = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

  const onSelectDay = (day: { dateString: string }) => {
    const [y, m, d] = day.dateString.split('-').map(Number);
    const next = new Date(value);
    next.setFullYear(y, m - 1, d);
    onChange(next);
    setShowDate(false);
  };

  const hours24 = Array.from({ length: 24 }, (_, i) => i);
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const currentHour = value.getHours();
  const isPM = currentHour >= 12;

  const setHour24 = (h: number) => {
    const next = new Date(value);
    next.setHours(h);
    onChange(next);
  };

  const setHour12 = (h12: number) => {
    // keep AM/PM
    let h = h12 % 12;
    if (isPM) h += 12;
    const next = new Date(value);
    next.setHours(h);
    onChange(next);
  };

  const setMinute = (min: number) => {
    const next = new Date(value);
    next.setMinutes(min);
    onChange(next);
  };

  const setPeriod = (period: 'AM' | 'PM') => {
    let h = value.getHours() % 12;
    if (period === 'PM') h += 12;
    const next = new Date(value);
    next.setHours(h);
    onChange(next);
  };

  const styles = createStyles(colors);
  const displayHour12 = currentHour % 12 === 0 ? 12 : currentHour % 12;

  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.field, { flex: 2 }]} onPress={() => setShowDate(true)}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={styles.fieldText}>{formatDate(value)}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.field, { flex: 1 }]} onPress={() => setShowTime(true)}>
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text style={styles.fieldText}>{formatTime(value)}</Text>
      </TouchableOpacity>

      {/* Date modal */}
      <Modal visible={showDate} transparent animationType="fade" onRequestClose={() => setShowDate(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowDate(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seleccionar fecha</Text>
            <Calendar
              current={dateString}
              onDayPress={onSelectDay}
              markedDates={{ [dateString]: { selected: true, selectedColor: colors.primary } }}
              theme={{
                calendarBackground: colors.surface,
                dayTextColor: colors.text,
                monthTextColor: colors.text,
                textDisabledColor: colors.textMuted,
                arrowColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                todayTextColor: colors.primary,
              }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDate(false)}>
              <Text style={styles.closeBtnText}>Listo</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time modal */}
      <Modal visible={showTime} transparent animationType="fade" onRequestClose={() => setShowTime(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowTime(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seleccionar hora</Text>
            <View style={styles.timeRow}>
              {/* Hours */}
              <View style={styles.timeCol}>
                <Text style={styles.timeColLabel}>Hora</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {(timeFormat === '24h' ? hours24 : hours12).map((h) => {
                    const selected = timeFormat === '24h' ? currentHour === h : displayHour12 === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[styles.timeItem, selected && styles.timeItemActive]}
                        onPress={() => (timeFormat === '24h' ? setHour24(h) : setHour12(h))}
                      >
                        <Text style={[styles.timeItemText, selected && styles.timeItemTextActive]}>{pad(h)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              {/* Minutes */}
              <View style={styles.timeCol}>
                <Text style={styles.timeColLabel}>Min</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => {
                    const selected = value.getMinutes() === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.timeItem, selected && styles.timeItemActive]}
                        onPress={() => setMinute(m)}
                      >
                        <Text style={[styles.timeItemText, selected && styles.timeItemTextActive]}>{pad(m)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              {/* AM/PM */}
              {timeFormat === '12h' && (
                <View style={styles.timeCol}>
                  <Text style={styles.timeColLabel}>&nbsp;</Text>
                  <View style={{ gap: 8 }}>
                    {(['AM', 'PM'] as const).map((p) => {
                      const selected = (p === 'PM') === isPM;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[styles.periodItem, selected && styles.timeItemActive]}
                          onPress={() => setPeriod(p)}
                        >
                          <Text style={[styles.timeItemText, selected && styles.timeItemTextActive]}>{p}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTime(false)}>
              <Text style={styles.closeBtnText}>Listo</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    fieldText: { fontSize: 15, color: colors.text, fontWeight: '500' },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      width: '100%',
      maxWidth: 380,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
    timeRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    timeCol: { alignItems: 'center' },
    timeColLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6, fontWeight: '600' },
    timeScroll: { height: 180, width: 60 },
    timeItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 4,
    },
    periodItem: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    timeItemActive: { backgroundColor: colors.primary },
    timeItemText: { fontSize: 16, color: colors.text, fontWeight: '500' },
    timeItemTextActive: { color: '#fff', fontWeight: '700' },
    closeBtn: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
