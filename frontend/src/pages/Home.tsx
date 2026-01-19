import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, Reservation, UserRole } from '../types';
import { reservationsApi } from '../api/reservations';
import { roomsApi } from '../api/rooms';
import ReservationForm from '../components/ReservationForm';
import { getTodayStartUTC, getTodayEndUTC } from '../utils/dateUtils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/ko';

// 한국어 locale 설정
dayjs.locale('ko');
dayjs.extend(utc);
dayjs.extend(timezone);

export default function Home() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // 관리자는 관리자 페이지로 리다이렉트
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === UserRole.ADMIN) {
          navigate('/admin');
          return;
        }
      }
    } catch {
      // 파싱 에러 무시
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, reservationsData] = await Promise.all([
        roomsApi.getAll(),
        reservationsApi.getAll(),
      ]);

      setRooms(roomsData);
      setReservations(reservationsData);
    } catch (err: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 오늘 날짜의 예약만 필터링 (UTC 기준)
  const getTodayReservations = () => {
    const todayStartUTC = getTodayStartUTC();
    const todayEndUTC = getTodayEndUTC();

    return reservations.filter((reservation) => {
      if (reservation.status === 'CANCELED' || reservation.status === 'REJECTED')
        return false;

      // UTC 시간을 비교
      const startAtUTC = reservation.startAt;
      return startAtUTC >= todayStartUTC && startAtUTC < todayEndUTC;
    });
  };

  const getTodayReservationsForRoom = (roomId: number) => {
    return getTodayReservations().filter((r) => r.roomId === roomId);
  };

  // 1시간 단위 타임라인 생성 (9시 ~ 18시, 로컬 타임존 기준)
  const generateTimeline = (roomId: number) => {
    const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 9시부터 18시까지
    const todayReservations = getTodayReservationsForRoom(roomId);

    return hours.map((hour) => {
      // 로컬 타임존의 오늘 날짜 + 시간을 UTC로 변환
      const today = dayjs().startOf('day');
      const hourStartUTC = today.hour(hour).minute(0).second(0).utc().toISOString();
      const hourEndUTC = today.hour(hour + 1).minute(0).second(0).utc().toISOString();

      // 해당 시간대에 예약이 있는지 확인 (UTC 기준)
      const reservation = todayReservations.find((res) => {
        return res.startAt < hourEndUTC && res.endAt > hourStartUTC;
      });

      return {
        hour,
        reserved: !!reservation,
        reservation,
      };
    });
  };

  // 사용자 정보 안전하게 가져오기
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return { id: '', name: '', email: '', role: '' };
      return JSON.parse(userStr);
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
      return { id: '', name: '', email: '', role: '' };
    }
  };

  const user = getUser();
  const todayReservations = getTodayReservations();
  const todayReservationCount = todayReservations.length;

  // 예약이 본인 예약인지 확인
  const isOwnReservation = (reservation: Reservation) => {
    return reservation.userId === user.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const activeRooms = rooms.filter((room) => room.isActive);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-900">OfficeSpace</h1>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
              </div>
              <a
                href="/api/docs"
                className="px-4 py-2 text-sm text-blue-900 border border-blue-200 hover:bg-blue-50 rounded-lg transition font-semibold"
                target="_blank"
                rel="noreferrer"
              >
                API DOC
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            오늘 예약이 {todayReservationCount}건 있습니다
          </h2>
          <p className="text-lg text-slate-600">
            {dayjs().format('YYYY년 MM월 DD일 dddd')}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Room Cards List */}
        {activeRooms.length > 0 ? (
          <div className="space-y-6">
            {activeRooms.map((room) => {
              const timeline = generateTimeline(room.id);

              return (
                <div
                  key={room.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex items-start gap-6">
                      {/* Room Image Placeholder */}
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-16 h-16 text-white opacity-80"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>

                      {/* Room Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">
                              {room.name}
                            </h3>
                            {room.description && (
                              <p className="text-slate-600">{room.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-slate-500">수용 인원</p>
                              <p className="text-lg font-semibold text-blue-900">
                                {room.capacity}명
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Equipment Info */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span>프로젝터</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <span>화이트보드</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <span>화상회의</span>
                          </div>
                        </div>

                        {/* Timeline Bar */}
                        <div className="mt-6">
                          <p className="text-sm font-semibold text-slate-700 mb-3">
                            오늘의 타임라인
                          </p>
                          <div className="flex gap-1">
                            {timeline.map((slot) => {
                              const isOwn = slot.reservation ? isOwnReservation(slot.reservation) : false;
                              const reservation = slot.reservation;
                              const reservationTitle = reservation
                                ? `${slot.hour}:00 - ${slot.hour + 1}:00\n` +
                                  `예약자: ${reservation.user?.name || '알 수 없음'}\n` +
                                  `상태: ${reservation.status === 'CONFIRMED' ? '확정' : '대기중'}${isOwn ? '\n(내 예약)' : ''}`
                                : `${slot.hour}:00 - ${slot.hour + 1}:00 예약 가능`;
                              
                              return (
                                <div
                                  key={slot.hour}
                                  className="flex-1 flex flex-col items-center relative"
                                >
                                  <div
                                  className={`w-full h-8 rounded relative ${
                                    slot.reserved
                                      ? slot.reservation?.status === 'CONFIRMED'
                                        ? isOwn
                                          ? 'bg-green-600'
                                          : 'bg-green-500'
                                        : isOwn
                                        ? 'bg-yellow-500'
                                        : 'bg-yellow-400'
                                      : 'bg-slate-100'
                                    } border ${
                                      slot.reserved
                                        ? slot.reservation?.status === 'CONFIRMED'
                                          ? isOwn
                                            ? 'border-green-700'
                                            : 'border-green-600'
                                          : isOwn
                                          ? 'border-yellow-600'
                                          : 'border-yellow-500'
                                        : 'border-slate-200'
                                    } hover:opacity-80 transition-opacity ${slot.reserved ? 'cursor-pointer' : ''} group`}
                                    title={reservationTitle}
                                    onClick={() => {
                                      if (slot.reserved && slot.reservation) {
                                        setSelectedReservation(slot.reservation);
                                      }
                                    }}
                                  >
                                    {slot.reserved && isOwn && (
                                      <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-white bg-blue-600 px-1 rounded">
                                        내
                                      </span>
                                    )}
                                    {slot.reserved && reservation?.user && (
                                      <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] text-white font-semibold truncate px-0.5">
                                        {reservation.user.name}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500 mt-1">
                                    {slot.hour}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded"></div>
                              <span>예약 가능</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-400 border border-yellow-500 rounded"></div>
                              <span>대기중</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 border border-green-600 rounded"></div>
                              <span>확정</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              현재 조회 가능한 회의실이 없습니다
            </h3>
            <p className="text-slate-600">
              관리자에게 문의하시거나 잠시 후 다시 시도해주세요.
            </p>
          </div>
        )}
      </main>

      {/* Reservation Form Modal */}
      {selectedRoom && (
        <ReservationForm
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">예약 상세 정보</h2>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 내 예약 뱃지 */}
              {isOwnReservation(selectedReservation) && (
                <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full inline-block">
                  내 예약
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">회의실</p>
                <p className="text-lg text-gray-900">{selectedReservation.room?.name || '알 수 없음'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">예약자</p>
                <p className="text-lg text-gray-900">{selectedReservation.user?.name || '알 수 없음'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">예약 시간</p>
                <p className="text-lg text-gray-900">
                  {dayjs(selectedReservation.startAt).format('YYYY년 MM월 DD일 HH:mm')} - {dayjs(selectedReservation.endAt).format('HH:mm')}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">상태</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedReservation.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : selectedReservation.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : selectedReservation.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedReservation.status === 'CONFIRMED'
                    ? '확정'
                    : selectedReservation.status === 'PENDING'
                    ? '대기중'
                    : selectedReservation.status === 'REJECTED'
                    ? '거절됨'
                    : '취소됨'}
                </span>
              </div>

              {/* 본인 예약인 경우에만 reason 표시 및 수정/삭제 버튼 */}
              {isOwnReservation(selectedReservation) && (
                <>
                  {selectedReservation.reason && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">예약 사유</p>
                      <p className="text-lg text-gray-900">{selectedReservation.reason}</p>
                    </div>
                  )}

                  {/* 본인 예약인 경우에만 취소 버튼 표시 */}
                  {(selectedReservation.status === 'PENDING' || selectedReservation.status === 'CONFIRMED') && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={async () => {
                          if (window.confirm('정말 이 예약을 취소하시겠습니까?')) {
                            try {
                              await reservationsApi.cancel(selectedReservation.id);
                              setSelectedReservation(null);
                              loadData();
                            } catch (err: any) {
                              alert(err.response?.data?.message || '예약 취소에 실패했습니다.');
                            }
                          }
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        예약 취소
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
