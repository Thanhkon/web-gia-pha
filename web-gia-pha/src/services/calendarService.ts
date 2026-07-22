import lunarJavascript from 'lunar-javascript';

const { Solar } = lunarJavascript;

const pad = (value: number) => value.toString().padStart(2, '0');
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

type SolarDateParts = {
  year: number;
  month: number;
  day: number;
};

export type VietnameseLunarDate = {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  display: string;
};

export const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseLocalDate = (value: string) => {
  return new Date(value);
};

export const isSameDate = (left: Date, right: Date) => {
  return formatDateKey(left) === formatDateKey(right);
};

export const isDateBetween = (date: Date, startAt: string, endAt: string) => {
  const key = formatDateKey(date);
  const startKey = formatVietnamDateKey(startAt);
  const endKey = formatVietnamDateKey(endAt);
  return key >= startKey && key <= endKey;
};

export const formatSolarDate = (value: string) => {
  const { year, month, day } = getSolarDatePartsInVietnam(value);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseLocalDate(value));
};

export const toDateTimeLocalValue = (value: string) => {
  const parts = getVietnamDateTimeParts(parseLocalDate(value));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const getSolarDatePartsInVietnam = (value: Date | string): SolarDateParts => {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }

  const date = value instanceof Date ? value : parseLocalDate(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
  };
};

const getVietnamDateTimeParts = (value: Date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second'),
  };
};

export const formatVietnamDateTimeOffset = (value: Date = new Date()) => {
  const parts = getVietnamDateTimeParts(value);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+07:00`;
};

export const toVietnamDateTimeOffset = (value: string | Date) => {
  if (value instanceof Date) {
    return formatVietnamDateTimeOffset(value);
  }

  const localDateTimeMatch = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?$/);
  if (localDateTimeMatch) {
    return `${localDateTimeMatch[1]}:${localDateTimeMatch[2] ?? '00'}+07:00`;
  }

  return formatVietnamDateTimeOffset(parseLocalDate(value));
};

export const formatVietnamDateKey = (value: Date | string) => {
  const { year, month, day } = getSolarDatePartsInVietnam(value);
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const getVietnameseLunarDate = (value: Date | string): VietnameseLunarDate => {
  const { year, month, day } = getSolarDatePartsInVietnam(value);
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const lunarMonth = lunar.getMonth();
  const isLeapMonth = lunarMonth < 0;
  const monthNumber = Math.abs(lunarMonth);

  return {
    year: lunar.getYear(),
    month: monthNumber,
    day: lunar.getDay(),
    isLeapMonth,
    display: `${pad(lunar.getDay())}/${pad(monthNumber)}${isLeapMonth ? ' nhuận' : ''} âm lịch`,
  };
};

export const getVietnameseLunarDateDisplay = (value: Date | string) => {
  return getVietnameseLunarDate(value).display;
};

export const buildCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      date,
      dateKey: formatDateKey(date),
      solarDay: date.getDate(),
      lunarDisplay: getVietnameseLunarDateDisplay(date),
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDate(date, new Date()),
    };
  });
};

export const getMonthRange = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  const start = parseLocalDate(`${year}-${pad(month)}-01T00:00:00+07:00`);
  const end = parseLocalDate(`${year}-${pad(month)}-${pad(lastDay)}T23:59:59+07:00`);
  return { start, end };
};
