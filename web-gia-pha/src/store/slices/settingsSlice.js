import { createSlice } from '@reduxjs/toolkit';

const defaultSettings = {
  primaryFamilyId: null,
  familiesSettings: {}, // { [familyId]: { hero } }
  hero: {
    title: "Gia Phả Dòng Họ",
    subtitle: "Nơi lưu giữ những kỷ vật tinh thần cho muôn đời sau.",
    bgImage: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  marqueeItems: [
    "Vinh danh ông Nguyễn Văn A đã tài trợ quỹ khuyến học 50.000.000đ",
    "Chúc mừng cháu Nguyễn Thị B đỗ Đại học Bách Khoa",
    "Ghi nhận công đức tập thể Chi 2 trong việc tôn tạo Từ đường",
    "Thông báo: Lễ Thanh Minh sẽ được tổ chức vào ngày 03/03 Âm lịch sắp tới"
  ],
  showStats: true,
};

const loadSettings = () => {
  const saved = localStorage.getItem('appSettings');
  if (saved) {
    return { ...defaultSettings, ...JSON.parse(saved) };
  }
  return defaultSettings;
};

const initialState = loadSettings();

const saveSettings = (state) => {
  localStorage.setItem('appSettings', JSON.stringify(state));
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPrimaryFamily: (state, action) => {
      state.primaryFamilyId = action.payload;
      saveSettings(state);
    },
    updateFamilyHero: (state, action) => {
      const { familyId, hero } = action.payload;
      if (!state.familiesSettings[familyId]) {
        state.familiesSettings[familyId] = {};
      }
      state.familiesSettings[familyId].hero = {
        ...state.familiesSettings[familyId].hero,
        ...hero
      };
      saveSettings(state);
    },
    updateHero: (state, action) => {
      // Legacy support for single family or default
      state.hero = { ...state.hero, ...action.payload };
      saveSettings(state);
    },
    updateMarquee: (state, action) => {
      state.marqueeItems = action.payload;
      saveSettings(state);
    },
    toggleStats: (state) => {
      state.showStats = !state.showStats;
      saveSettings(state);
    }
  },
});

export const { setPrimaryFamily, updateFamilyHero, updateHero, updateMarquee, toggleStats } = settingsSlice.actions;

export default settingsSlice.reducer;
