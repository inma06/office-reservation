import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// dayjs 플러그인 활성화
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * UTC 시간 문자열을 사용자의 브라우저 타임존으로 변환하여 포맷팅
 * @param utcDateString - UTC 시간 문자열 (ISO 8601 형식)
 * @param format - dayjs 포맷 문자열 (기본값: 'YYYY-MM-DD HH:mm')
 * @returns 포맷팅된 날짜 문자열
 */
export const formatDate = (
  utcDateString: string | Date,
  format: string = 'YYYY-MM-DD HH:mm'
): string => {
  if (!utcDateString) return '';
  
  // UTC로 파싱한 후 사용자의 타임존으로 변환
  return dayjs.utc(utcDateString).local().format(format);
};

/**
 * UTC 시간 문자열을 사용자의 브라우저 타임존으로 변환하여 Date 객체 반환
 * @param utcDateString - UTC 시간 문자열 (ISO 8601 형식)
 * @returns 로컬 타임존의 Date 객체
 */
export const toLocalDate = (utcDateString: string | Date): Date => {
  if (!utcDateString) return new Date();
  return dayjs.utc(utcDateString).local().toDate();
};

/**
 * 날짜와 시간을 분리하여 반환
 * @param utcDateString - UTC 시간 문자열 (ISO 8601 형식)
 * @returns { date: 'YYYY-MM-DD', time: 'HH:mm' }
 */
export const formatDateTime = (utcDateString: string | Date): {
  date: string;
  time: string;
} => {
  if (!utcDateString) return { date: '', time: '' };
  
  const localDate = dayjs.utc(utcDateString).local();
  return {
    date: localDate.format('YYYY-MM-DD'),
    time: localDate.format('HH:mm'),
  };
};

/**
 * 한국어 형식으로 날짜와 시간을 분리하여 반환
 * @param utcDateString - UTC 시간 문자열 (ISO 8601 형식)
 * @returns { date: 'YYYY년 MM월 DD일', time: 'HH:mm' }
 */
export const formatDateTimeKorean = (utcDateString: string | Date): {
  date: string;
  time: string;
} => {
  if (!utcDateString) return { date: '', time: '' };
  
  const localDate = dayjs.utc(utcDateString).local().locale('ko');
  return {
    date: localDate.format('YYYY년 MM월 DD일'),
    time: localDate.format('HH:mm'),
  };
};

/**
 * 로컬 날짜/시간을 UTC ISO 문자열로 변환 (서버 전송용)
 * @param localDate - 로컬 Date 객체 또는 dayjs 객체
 * @returns UTC ISO 8601 형식 문자열
 */
export const toUTCString = (localDate: string | Date | dayjs.Dayjs): string => {
  if (!localDate) return '';
  
  // 이미 UTC 문자열인 경우 그대로 반환
  if (typeof localDate === 'string' && localDate.endsWith('Z')) {
    return localDate;
  }
  
  // 로컬 시간을 UTC로 변환
  return dayjs(localDate).utc().toISOString();
};

/**
 * 오늘 날짜인지 확인 (UTC 기준)
 * @param utcDateString - UTC 시간 문자열
 * @returns 오늘 날짜인지 여부
 */
export const isToday = (utcDateString: string | Date): boolean => {
  if (!utcDateString) return false;
  
  const localDate = dayjs.utc(utcDateString).local();
  const today = dayjs();
  
  return localDate.isSame(today, 'day');
};

/**
 * 두 날짜가 같은 날인지 확인
 * @param date1 - 첫 번째 UTC 시간 문자열
 * @param date2 - 두 번째 UTC 시간 문자열
 * @returns 같은 날인지 여부
 */
export const isSameDay = (
  date1: string | Date,
  date2: string | Date
): boolean => {
  if (!date1 || !date2) return false;
  
  const localDate1 = dayjs.utc(date1).local();
  const localDate2 = dayjs.utc(date2).local();
  
  return localDate1.isSame(localDate2, 'day');
};

/**
 * 오늘 날짜의 시작 시간 (로컬 타임존)을 UTC로 변환
 * @returns UTC ISO 8601 형식 문자열
 */
export const getTodayStartUTC = (): string => {
  return dayjs().startOf('day').utc().toISOString();
};

/**
 * 오늘 날짜의 종료 시간 (로컬 타임존)을 UTC로 변환
 * @returns UTC ISO 8601 형식 문자열
 */
export const getTodayEndUTC = (): string => {
  return dayjs().endOf('day').utc().toISOString();
};
