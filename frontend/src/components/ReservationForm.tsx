import { useState } from 'react';
import { Room, CreateReservationRequest } from '../types';
import { reservationsApi } from '../api/reservations';
import { toUTCString } from '../utils/dateUtils';
import dayjs from 'dayjs';

interface ReservationFormProps {
  room: Room;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationForm({
  room,
  onClose,
  onSuccess,
}: ReservationFormProps) {
  // 초기값 설정 (로컬 타임존 기준)
  const getInitialDateTime = (hoursOffset: number = 0) => {
    const date = dayjs().add(hoursOffset, 'hour');
    return date.format('YYYY-MM-DDTHH:mm'); // YYYY-MM-DDTHH:mm 형식
  };

  const [formData, setFormData] = useState<CreateReservationRequest>({
    roomId: room.id,
    startAt: getInitialDateTime(1),
    endAt: getInitialDateTime(2),
    reason: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 로컬 타임존의 날짜/시간을 UTC로 변환하여 전송
      const submitData: CreateReservationRequest = {
        ...formData,
        startAt: toUTCString(formData.startAt),
        endAt: toUTCString(formData.endAt),
      };
      await reservationsApi.create(submitData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || '예약 생성에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기 (로컬 타임존)
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {room.name} 예약
          </h2>
          <button
            onClick={onClose}
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

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">수용 인원:</span> {room.capacity}명
          </p>
          {room.description && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">설명:</span> {room.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              예약 날짜
            </label>
            <input
              id="date"
              type="date"
              required
              min={today}
              value={formData.startAt.split('T')[0] || today}
              onChange={(e) => {
                const date = e.target.value;
                const startTime = formData.startAt.split('T')[1] || '09:00';
                const endTime = formData.endAt.split('T')[1] || '10:00';
                setFormData({
                  ...formData,
                  startAt: `${date}T${startTime}`,
                  endAt: `${date}T${endTime}`,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                시작 시간
              </label>
              <input
                id="startTime"
                type="time"
                required
                value={formData.startAt.split('T')[1] || '09:00'}
                onChange={(e) => {
                  const date = formData.startAt.split('T')[0] || today;
                  setFormData({
                    ...formData,
                    startAt: `${date}T${e.target.value}`,
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                종료 시간
              </label>
              <input
                id="endTime"
                type="time"
                required
                value={formData.endAt.split('T')[1] || '10:00'}
                onChange={(e) => {
                  const date = formData.endAt.split('T')[0] || today;
                  setFormData({
                    ...formData,
                    endAt: `${date}T${e.target.value}`,
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              예약 사유 (선택)
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="예: 팀 미팅, 클라이언트 미팅 등"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '예약 중...' : '예약하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

