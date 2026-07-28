import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DateFormat = 'ymd' | 'dmy'; // AÑO-MES-DIA o DIA-MES-AÑO
export type TimeFormat = '12h' | '24h';

interface PreferencesContextType {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  setDateFormat: (f: DateFormat) => Promise<void>;
  setTimeFormat: (f: TimeFormat) => Promise<void>;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const pad = (n: number) => String(n).padStart(2, '0');

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dateFormat, setDateFormatState] = useState<DateFormat>('dmy');
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24h');

  useEffect(() => {
    (async () => {
      try {
        const d = await AsyncStorage.getItem('pref_date_format');
        const t = await AsyncStorage.getItem('pref_time_format');
        if (d === 'ymd' || d === 'dmy') setDateFormatState(d);
        if (t === '12h' || t === '24h') setTimeFormatState(t);
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    })();
  }, []);

  const setDateFormat = async (f: DateFormat) => {
    await AsyncStorage.setItem('pref_date_format', f);
    setDateFormatState(f);
  };

  const setTimeFormat = async (f: TimeFormat) => {
    await AsyncStorage.setItem('pref_time_format', f);
    setTimeFormatState(f);
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return dateFormat === 'ymd' ? `${y}-${m}-${d}` : `${d}-${m}-${y}`;
  };

  const formatTime = (date: Date) => {
    const h = date.getHours();
    const min = pad(date.getMinutes());
    if (timeFormat === '24h') {
      return `${pad(h)}:${min}`;
    }
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${pad(h12)}:${min} ${period}`;
  };

  return (
    <PreferencesContext.Provider
      value={{ dateFormat, timeFormat, setDateFormat, setTimeFormat, formatDate, formatTime }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
