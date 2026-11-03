import { StockMarketId, StockMarketInfo, MarketSessionStatus } from '../types/stocks';

export const STOCK_MARKETS: Record<StockMarketId, StockMarketInfo> = {
  US: {
    id: 'US',
    name: 'US (NYSE / Nasdaq)',
    fullName: 'New York Stock Exchange / Nasdaq',
    country: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    ianaTimeZone: 'America/New_York',
    regularOpen: '09:30',
    regularClose: '16:00',
    preMarketOpen: '04:00',
    afterHoursClose: '20:00',
    benchmarkIndex: '^GSPC',
    benchmarkName: 'S&P 500',
    requiresVerification: false,
    holidays2025: [
      '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', 
      '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01', 
      '2025-11-27', '2025-12-25'
    ]
  },
  NSE: {
    id: 'NSE',
    name: 'India (NSE)',
    fullName: 'National Stock Exchange of India',
    country: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    ianaTimeZone: 'Asia/Kolkata',
    regularOpen: '09:15',
    regularClose: '15:30',
    preMarketOpen: '09:00',
    afterHoursClose: '16:00',
    benchmarkIndex: '^NSEI',
    benchmarkName: 'NIFTY 50',
    requiresVerification: true, // Marked "verify"
    holidays2025: [
      '2025-01-26', '2025-02-26', '2025-03-14', '2025-03-31', 
      '2025-04-10', '2025-04-14', '2025-04-18', '2025-05-01', 
      '2025-08-15', '2025-08-27', '2025-10-02', '2025-10-21', 
      '2025-10-22', '2025-11-05', '2025-12-25'
    ]
  },
  LSE: {
    id: 'LSE',
    name: 'UK (LSE)',
    fullName: 'London Stock Exchange',
    country: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    ianaTimeZone: 'Europe/London',
    regularOpen: '08:00',
    regularClose: '16:30',
    benchmarkIndex: '^FTSE',
    benchmarkName: 'FTSE 100',
    requiresVerification: false,
    holidays2025: [
      '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-05', 
      '2025-05-26', '2025-08-25', '2025-12-25', '2025-12-26'
    ]
  },
  TSE: {
    id: 'TSE',
    name: 'Japan (TSE)',
    fullName: 'Tokyo Stock Exchange',
    country: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    currencySymbol: '¥',
    ianaTimeZone: 'Asia/Tokyo',
    regularOpen: '09:00',
    regularClose: '15:30',
    lunchBreakStart: '11:30',
    lunchBreakEnd: '12:30',
    benchmarkIndex: '^N225',
    benchmarkName: 'Nikkei 225',
    requiresVerification: false,
    holidays2025: [
      '2025-01-01', '2025-01-02', '2025-01-03', '2025-01-13', 
      '2025-02-11', '2025-02-24', '2025-03-20', '2025-04-29', 
      '2025-05-05', '2025-05-06', '2025-07-21', '2025-08-11', 
      '2025-09-15', '2025-09-23', '2025-10-13', '2025-11-03', 
      '2025-11-24', '2025-12-31'
    ]
  },
  HKEX: {
    id: 'HKEX',
    name: 'Hong Kong (HKEX)',
    fullName: 'Hong Kong Exchanges and Clearing',
    country: 'Hong Kong',
    flag: '🇭🇰',
    currency: 'HKD',
    currencySymbol: 'HK$',
    ianaTimeZone: 'Asia/Hong_Kong',
    regularOpen: '09:30',
    regularClose: '16:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    benchmarkIndex: '^HSI',
    benchmarkName: 'Hang Seng Index',
    requiresVerification: false,
    holidays2025: [
      '2025-01-01', '2025-01-29', '2025-01-30', '2025-01-31', 
      '2025-04-04', '2025-04-18', '2025-04-21', '2025-05-01', 
      '2025-05-05', '2025-07-01', '2025-10-01', '2025-10-07', 
      '2025-10-29', '2025-12-25', '2025-12-26'
    ]
  },
  XETRA: {
    id: 'XETRA',
    name: 'Germany (Xetra)',
    fullName: 'Deutsche Börse Xetra',
    country: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    ianaTimeZone: 'Europe/Berlin',
    regularOpen: '09:00',
    regularClose: '17:30',
    benchmarkIndex: '^GDAXI',
    benchmarkName: 'DAX 40',
    requiresVerification: false,
    holidays2025: [
      '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01', 
      '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-31'
    ]
  },
  TSX: {
    id: 'TSX',
    name: 'Canada (TSX)',
    fullName: 'Toronto Stock Exchange',
    country: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'CA$',
    ianaTimeZone: 'America/Toronto',
    regularOpen: '09:30',
    regularClose: '16:00',
    benchmarkIndex: '^GSPTSE',
    benchmarkName: 'S&P/TSX Composite',
    requiresVerification: false,
    holidays2025: [
      '2025-01-01', '2025-02-17', '2025-04-18', '2025-05-19', 
      '2025-07-01', '2025-08-04', '2025-09-01', '2025-10-13', 
      '2025-12-25', '2025-12-26'
    ]
  },
  PSX: {
    id: 'PSX',
    name: 'Pakistan (PSX)',
    fullName: 'Pakistan Stock Exchange',
    country: 'Pakistan',
    flag: '🇵🇰',
    currency: 'PKR',
    currencySymbol: 'Rs',
    ianaTimeZone: 'Asia/Karachi',
    regularOpen: '09:15',
    regularClose: '15:30',
    fridaySpecialSchedule: {
      morningOpen: '09:00',
      morningClose: '12:00',
      afternoonOpen: '14:30',
      afternoonClose: '16:30'
    },
    benchmarkIndex: '^KSE100',
    benchmarkName: 'KSE-100',
    requiresVerification: true, // Marked "verify"
    holidays2025: [
      '2025-02-05', '2025-03-23', '2025-03-31', '2025-04-01', 
      '2025-04-02', '2025-05-01', '2025-06-07', '2025-06-08', 
      '2025-07-06', '2025-07-07', '2025-08-14', '2025-09-05', 
      '2025-11-09', '2025-12-25'
    ]
  }
};

export interface MarketTimeStatus {
  marketId: StockMarketId;
  status: MarketSessionStatus;
  statusLabel: string;
  isRegularOpen: boolean;
  isObservationPeriod: boolean; // First 15m
  isSquareOffZone: boolean; // Last 30m
  minutesToSquareOff?: number;
  minutesToClose?: number;
  minutesToOpen?: number;
  countdownText: string;
  exchangeLocalTimeStr: string;
  phoneLocalTimeStr: string;
  nextSessionText: string;
  isHoliday: boolean;
  isWeekend: boolean;
  requiresVerification: boolean;
  customWindowActive?: boolean;
}

/**
 * Accurately parses a time in an IANA time zone without hardcoding UTC offsets
 */
export function getExchangeDate(ianaTimeZone: string, date = new Date()): {
  year: number;
  month: number;
  day: number;
  weekday: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  hours: number;
  minutes: number;
  seconds: number;
  formattedStr: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  parts.forEach(p => {
    partMap[p.type] = p.value;
  });

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const hours = parseInt(partMap.hour, 10);
  const minutes = parseInt(partMap.minute, 10);
  const seconds = parseInt(partMap.second, 10);

  // Determine weekday index
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekday = days.indexOf(partMap.weekday);

  const formattedStr = `${partMap.hour}:${partMap.minute}:${partMap.second}`;

  return { year, month, day, weekday, hours, minutes, seconds, formattedStr };
}

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutesDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export function computeMarketStatus(
  marketId: StockMarketId,
  options?: {
    observationMinutes?: number;
    customTradingStart?: string;
    customTradingEnd?: string;
    customWindowEnabled?: boolean;
  }
): MarketTimeStatus {
  const market = STOCK_MARKETS[marketId];
  const now = new Date();
  const exchangeTime = getExchangeDate(market.ianaTimeZone, now);

  const phoneFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const phoneLocalTimeStr = phoneFormatter.format(now);

  const exchangeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: market.ianaTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const exchangeLocalTimeStr = `${exchangeFormatter.format(now)} (${market.ianaTimeZone.split('/')[1]?.replace('_', ' ') || market.currency})`;

  const dateKey = `${exchangeTime.year}-${String(exchangeTime.month).padStart(2, '0')}-${String(exchangeTime.day).padStart(2, '0')}`;
  const isWeekend = exchangeTime.weekday === 0 || exchangeTime.weekday === 6;
  const isHoliday = market.holidays2025.includes(dateKey);

  const currentMinuteOfDay = exchangeTime.hours * 60 + exchangeTime.minutes;
  const obsMinutes = options?.observationMinutes ?? 15;

  // Check special Friday schedule for PSX
  let openMinutes = timeStringToMinutes(market.regularOpen);
  let closeMinutes = timeStringToMinutes(market.regularClose);

  if (market.id === 'PSX' && exchangeTime.weekday === 5 && market.fridaySpecialSchedule) {
    // Friday in PSX: 09:00-12:00, then 14:30-16:30
    const mOpen = timeStringToMinutes(market.fridaySpecialSchedule.morningOpen);
    const mClose = timeStringToMinutes(market.fridaySpecialSchedule.morningClose);
    const aOpen = timeStringToMinutes(market.fridaySpecialSchedule.afternoonOpen);
    const aClose = timeStringToMinutes(market.fridaySpecialSchedule.afternoonClose);

    if (isWeekend || isHoliday) {
      return buildClosedStatus(market, exchangeLocalTimeStr, phoneLocalTimeStr, isHoliday, isWeekend);
    }

    if (currentMinuteOfDay >= mOpen && currentMinuteOfDay < mClose) {
      const minutesToClose = mClose - currentMinuteOfDay;
      const isObs = (currentMinuteOfDay - mOpen) < obsMinutes;
      return {
        marketId,
        status: isObs ? 'OBSERVING' : 'OPEN',
        statusLabel: isObs ? 'OBSERVING VOLATILITY' : 'OPEN (Morning)',
        isRegularOpen: true,
        isObservationPeriod: isObs,
        isSquareOffZone: minutesToClose <= 30,
        minutesToSquareOff: minutesToClose,
        minutesToClose,
        countdownText: `Morning session closes in ${formatMinutesDuration(minutesToClose)}`,
        exchangeLocalTimeStr,
        phoneLocalTimeStr,
        nextSessionText: `Afternoon session opens 14:30 PKT`,
        isHoliday: false,
        isWeekend: false,
        requiresVerification: true
      };
    } else if (currentMinuteOfDay >= aOpen && currentMinuteOfDay < aClose) {
      const minutesToClose = aClose - currentMinuteOfDay;
      const isObs = (currentMinuteOfDay - aOpen) < obsMinutes;
      return {
        marketId,
        status: isObs ? 'OBSERVING' : 'OPEN',
        statusLabel: isObs ? 'OBSERVING VOLATILITY' : 'OPEN (Afternoon)',
        isRegularOpen: true,
        isObservationPeriod: isObs,
        isSquareOffZone: minutesToClose <= 30,
        minutesToSquareOff: minutesToClose,
        minutesToClose,
        countdownText: `Closes in ${formatMinutesDuration(minutesToClose)}`,
        exchangeLocalTimeStr,
        phoneLocalTimeStr,
        nextSessionText: `Next session opens Monday 09:15 PKT`,
        isHoliday: false,
        isWeekend: false,
        requiresVerification: true
      };
    } else if (currentMinuteOfDay >= mClose && currentMinuteOfDay < aOpen) {
      const minutesToAfternoon = aOpen - currentMinuteOfDay;
      return {
        marketId,
        status: 'CLOSED',
        statusLabel: 'FRIDAY LUNCH BREAK',
        isRegularOpen: false,
        isObservationPeriod: false,
        isSquareOffZone: false,
        countdownText: `Afternoon session opens in ${formatMinutesDuration(minutesToAfternoon)}`,
        exchangeLocalTimeStr,
        phoneLocalTimeStr,
        nextSessionText: `Afternoon session at 14:30 PKT`,
        isHoliday: false,
        isWeekend: false,
        requiresVerification: true
      };
    }
  }

  // Handle lunch breaks (TSE, HKEX)
  let isInLunchBreak = false;
  let lunchEndMinutes = 0;
  if (market.lunchBreakStart && market.lunchBreakEnd) {
    const lStart = timeStringToMinutes(market.lunchBreakStart);
    const lEnd = timeStringToMinutes(market.lunchBreakEnd);
    if (currentMinuteOfDay >= lStart && currentMinuteOfDay < lEnd) {
      isInLunchBreak = true;
      lunchEndMinutes = lEnd;
    }
  }

  if (isWeekend || isHoliday) {
    return buildClosedStatus(market, exchangeLocalTimeStr, phoneLocalTimeStr, isHoliday, isWeekend);
  }

  if (isInLunchBreak) {
    const minutesToReopen = lunchEndMinutes - currentMinuteOfDay;
    return {
      marketId,
      status: 'CLOSED',
      statusLabel: 'LUNCH BREAK',
      isRegularOpen: false,
      isObservationPeriod: false,
      isSquareOffZone: false,
      countdownText: `Afternoon session opens in ${formatMinutesDuration(minutesToReopen)}`,
      exchangeLocalTimeStr,
      phoneLocalTimeStr,
      nextSessionText: `Afternoon session resumes at ${market.lunchBreakEnd}`,
      isHoliday: false,
      isWeekend: false,
      requiresVerification: !!market.requiresVerification
    };
  }

  // Pre-market check
  const preMarketOpenMinutes = market.preMarketOpen ? timeStringToMinutes(market.preMarketOpen) : null;
  if (preMarketOpenMinutes !== null && currentMinuteOfDay >= preMarketOpenMinutes && currentMinuteOfDay < openMinutes) {
    const minutesToOpen = openMinutes - currentMinuteOfDay;
    return {
      marketId,
      status: 'PRE-MARKET',
      statusLabel: 'PRE-MARKET',
      isRegularOpen: false,
      isObservationPeriod: false,
      isSquareOffZone: false,
      minutesToOpen,
      countdownText: `Regular session opens in ${formatMinutesDuration(minutesToOpen)}`,
      exchangeLocalTimeStr,
      phoneLocalTimeStr,
      nextSessionText: `Regular session opens at ${market.regularOpen} ${market.ianaTimeZone.split('/')[1]}`,
      isHoliday: false,
      isWeekend: false,
      requiresVerification: !!market.requiresVerification
    };
  }

  // Regular Trading Session
  if (currentMinuteOfDay >= openMinutes && currentMinuteOfDay < closeMinutes) {
    const minutesToClose = closeMinutes - currentMinuteOfDay;
    const elapsedSinceOpen = currentMinuteOfDay - openMinutes;
    const isObs = elapsedSinceOpen < obsMinutes;
    const isSquareOff = minutesToClose <= 30;

    // Check optional custom trading window
    let customActive = false;
    if (options?.customWindowEnabled && options.customTradingStart && options.customTradingEnd) {
      const cStart = timeStringToMinutes(options.customTradingStart);
      const cEnd = timeStringToMinutes(options.customTradingEnd);
      if (currentMinuteOfDay < cStart || currentMinuteOfDay >= cEnd) {
        customActive = true;
      }
    }

    return {
      marketId,
      status: isObs ? 'OBSERVING' : 'OPEN',
      statusLabel: isObs ? 'OBSERVING VOLATILITY' : 'REGULAR TRADING OPEN',
      isRegularOpen: !customActive,
      isObservationPeriod: isObs,
      isSquareOffZone: isSquareOff,
      minutesToSquareOff: minutesToClose,
      minutesToClose,
      countdownText: `Closes in ${formatMinutesDuration(minutesToClose)}`,
      exchangeLocalTimeStr,
      phoneLocalTimeStr,
      nextSessionText: `Regular session until ${market.regularClose}`,
      isHoliday: false,
      isWeekend: false,
      requiresVerification: !!market.requiresVerification,
      customWindowActive: customActive
    };
  }

  // After-Hours check
  const afterHoursCloseMinutes = market.afterHoursClose ? timeStringToMinutes(market.afterHoursClose) : null;
  if (afterHoursCloseMinutes !== null && currentMinuteOfDay >= closeMinutes && currentMinuteOfDay < afterHoursCloseMinutes) {
    const minutesToAfterClose = afterHoursCloseMinutes - currentMinuteOfDay;
    return {
      marketId,
      status: 'AFTER-HOURS',
      statusLabel: 'AFTER-HOURS',
      isRegularOpen: false,
      isObservationPeriod: false,
      isSquareOffZone: false,
      countdownText: `After-hours closes in ${formatMinutesDuration(minutesToAfterClose)}`,
      exchangeLocalTimeStr,
      phoneLocalTimeStr,
      nextSessionText: `Next regular session opens tomorrow ${market.regularOpen}`,
      isHoliday: false,
      isWeekend: false,
      requiresVerification: !!market.requiresVerification
    };
  }

  // Otherwise Closed for the day
  return buildClosedStatus(market, exchangeLocalTimeStr, phoneLocalTimeStr, false, false, currentMinuteOfDay, openMinutes);
}

function buildClosedStatus(
  market: StockMarketInfo,
  exchangeLocalTimeStr: string,
  phoneLocalTimeStr: string,
  isHoliday: boolean,
  isWeekend: boolean,
  currentMinuteOfDay = 0,
  openMinutes = 0
): MarketTimeStatus {
  let nextDayStr = 'tomorrow';
  if (isWeekend) {
    nextDayStr = 'Monday';
  } else if (isHoliday) {
    nextDayStr = 'next trading day';
  }

  let countdownText = `Market Closed • Opens ${nextDayStr} at ${market.regularOpen}`;
  if (!isWeekend && !isHoliday && currentMinuteOfDay < openMinutes) {
    const minToOpen = openMinutes - currentMinuteOfDay;
    countdownText = `Opens today in ${formatMinutesDuration(minToOpen)} (${market.regularOpen})`;
  }

  return {
    marketId: market.id,
    status: 'CLOSED',
    statusLabel: isHoliday ? 'HOLIDAY CLOSED' : isWeekend ? 'WEEKEND CLOSED' : 'MARKET CLOSED',
    isRegularOpen: false,
    isObservationPeriod: false,
    isSquareOffZone: false,
    countdownText,
    exchangeLocalTimeStr,
    phoneLocalTimeStr,
    nextSessionText: `Next regular session: ${nextDayStr} ${market.regularOpen}`,
    isHoliday,
    isWeekend,
    requiresVerification: !!market.requiresVerification
  };
}
