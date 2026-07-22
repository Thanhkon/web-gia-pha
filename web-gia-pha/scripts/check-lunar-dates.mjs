import assert from 'node:assert/strict';
import lunarJavascript from 'lunar-javascript';

const { Solar } = lunarJavascript;

const pad = (value) => value.toString().padStart(2, '0');

const toLunarDisplay = (solarDate) => {
  const [year, month, day] = solarDate.split('-').map(Number);
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const lunarMonth = lunar.getMonth();
  const monthNumber = Math.abs(lunarMonth);

  return `${pad(lunar.getDay())}/${pad(monthNumber)}${lunarMonth < 0 ? ' nhuận' : ''} âm lịch`;
};

const cases = [
  ['2026-07-01', '17/05 âm lịch'],
  ['2026-07-11', '27/05 âm lịch'],
  ['2026-07-14', '01/06 âm lịch'],
  ['2026-07-31', '18/06 âm lịch'],
];

for (const [solarDate, expectedLunarDate] of cases) {
  assert.equal(toLunarDisplay(solarDate), expectedLunarDate, solarDate);
}

console.log('Lunar date regression checks passed.');

