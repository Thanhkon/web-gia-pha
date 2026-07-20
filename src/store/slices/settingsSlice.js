import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hero: {
    title: "Gia Phả Họ Nguyễn",
    subtitle: "Họ Nguyễn là một trong những dòng họ lâu đời và có truyền thống văn hóa sâu sắc. Từ cội nguồn lịch sử, ông cha ta đã bồi đắp và lưu truyền những giá trị tốt đẹp về đạo hiếu, tình anh em và tinh thần hiếu học. Website này là nơi lưu giữ những kỷ vật tinh thần đó cho muôn đời sau.",
    bgImage: ""
  },
  marqueeItems: [
    "Vinh danh ông Nguyễn Văn A đã tài trợ quỹ khuyến học 50.000.000đ",
    "Chúc mừng cháu Nguyễn Thị B đỗ Đại học Bách Khoa",
    "Ghi nhận công đức tập thể Chi 2 trong việc tôn tạo Từ đường",
    "Thông báo: Lễ Thanh Minh sẽ được tổ chức vào ngày 03/03 Âm lịch sắp tới"
  ],
  showStats: true,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateHero: (state, action) => {
      state.hero = { ...state.hero, ...action.payload };
    },
    updateMarquee: (state, action) => {
      state.marqueeItems = action.payload;
    },
    toggleStats: (state) => {
      state.showStats = !state.showStats;
    }
  },
});

export const { updateHero, updateMarquee, toggleStats } = settingsSlice.actions;

export default settingsSlice.reducer;
