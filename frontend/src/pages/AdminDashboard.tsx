import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reservation, ReservationStatus, UserRole, User, Room } from '../types';
import { reservationsApi, UpdateReservationStatusRequest } from '../api/reservations';
import { usersApi, PaginatedUsersResponse } from '../api/users';
import { roomsApi, PaginatedRoomsResponse, CreateRoomRequest, UpdateRoomRequest } from '../api/rooms';
import { formatDateTimeKorean } from '../utils/dateUtils';

type Tab = 'reservations' | 'users' | 'rooms';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('reservations');

  // 예약 관리 상태
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // 회원 관리 상태
  const [usersData, setUsersData] = useState<PaginatedUsersResponse | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);

  // 회의실 관리 상태
  const [roomsData, setRoomsData] = useState<PaginatedRoomsResponse | null>(null);
  const [roomsPage, setRoomsPage] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [roomFormData, setRoomFormData] = useState<CreateRoomRequest>({
    name: '',
    capacity: 1,
    description: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, [activeTab, usersPage, roomsPage, usersSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'reservations') {
        const data = await reservationsApi.getAll();
        setReservations(data);
        const pending = data.filter((r) => r.status === ReservationStatus.PENDING);
        setPendingReservations(pending);
      } else if (activeTab === 'users') {
        const data = await usersApi.getAll(usersPage, 20, usersSearch);
        setUsersData(data);
      } else if (activeTab === 'rooms') {
        const data = await roomsApi.getAllAdmin(roomsPage, 20);
        setRoomsData(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 예약 관리 핸들러
  const handleConfirm = async (reservation: Reservation) => {
    try {
      const updateData: UpdateReservationStatusRequest = {
        status: ReservationStatus.CONFIRMED,
      };
      await reservationsApi.updateStatus(reservation.id, updateData);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || '예약 승인에 실패했습니다.');
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!selectedReservation || !rejectReason.trim()) {
      setError('거절 사유를 입력해주세요.');
      return;
    }

    try {
      const updateData: UpdateReservationStatusRequest = {
        status: ReservationStatus.REJECTED,
        reason: rejectReason,
      };
      await reservationsApi.updateStatus(selectedReservation.id, updateData);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedReservation(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || '예약 거절에 실패했습니다.');
      console.error(err);
    }
  };

  const openRejectModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // 회원 관리 핸들러
  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      const newRole = selectedUser.role === UserRole.USER ? UserRole.ADMIN : UserRole.USER;
      await usersApi.updateRole(selectedUser.id, newRole);
      setShowRoleModal(false);
      setSelectedUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || '역할 변경에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await usersApi.delete(selectedUser.id);
      setShowDeleteUserModal(false);
      setSelectedUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || '회원 탈퇴에 실패했습니다.');
      console.error(err);
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const openDeleteUserModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  };

  // 회의실 관리 핸들러
  const handleCreateRoom = async () => {
    try {
      await roomsApi.create(roomFormData);
      setShowRoomModal(false);
      setRoomFormData({ name: '', capacity: 1, description: '', isActive: true });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || '회의실 추가에 실패했습니다.');
      console.error(err);
    }
  };

  const handleUpdateRoom = async () => {
    if (!selectedRoom) return;

    try {
      const updateData: UpdateRoomRequest = {
        name: roomFormData.name || undefined,
        capacity: roomFormData.capacity || undefined,
        description: roomFormData.description || undefined,
        isActive: roomFormData.isActive,
      };
      await roomsApi.update(selectedRoom.id, updateData);
      setShowRoomModal(false);
      setSelectedRoom(null);
      setRoomFormData({ name: '', capacity: 1, description: '', isActive: true });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || '회의실 수정에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;

    try {
      await roomsApi.delete(selectedRoom.id);
      setShowDeleteRoomModal(false);
      setSelectedRoom(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || '회의실 삭제에 실패했습니다.');
      console.error(err);
    }
  };

  const openCreateRoomModal = () => {
    setSelectedRoom(null);
    setRoomFormData({ name: '', capacity: 1, description: '', isActive: true });
    setShowRoomModal(true);
  };

  const openEditRoomModal = (room: Room) => {
    setSelectedRoom(room);
    setRoomFormData({
      name: room.name,
      capacity: room.capacity,
      description: room.description || '',
      isActive: room.isActive,
    });
    setShowRoomModal(true);
  };

  const openDeleteRoomModal = (room: Room) => {
    setSelectedRoom(room);
    setShowDeleteRoomModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading && activeTab === 'reservations' && reservations.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-sans">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">
              관리자 대시보드
            </h1>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('reservations')}
                className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === 'reservations'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                예약 관리
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === 'users'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                회원 관리
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === 'rooms'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
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
                회의실 관리
              </button>
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-slate-500">관리자</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium"
            >
              로그아웃
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* 예약 관리 탭 */}
            {activeTab === 'reservations' && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    예약 관리
                  </h2>
                  <p className="text-lg text-slate-600">
                    대기 중인 예약을 승인하거나 거절할 수 있습니다.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900">
                      대기 중인 예약 ({pendingReservations.length}건)
                    </h3>
                  </div>

                  {pendingReservations.length > 0 ? (
                    <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                      <div className="divide-y divide-slate-200">
                        {pendingReservations.map((reservation) => {
                          const startDateTime = formatDateTimeKorean(reservation.startAt);
                          const endDateTime = formatDateTimeKorean(reservation.endAt);
                          const createdAt = formatDateTimeKorean(reservation.createdAt);

                          return (
                            <div
                              key={reservation.id}
                              className="p-6 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h4 className="text-lg font-semibold text-slate-900">
                                      {reservation.room?.name || '회의실 정보 없음'}
                                    </h4>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                      대기중
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <p className="text-sm text-slate-500 mb-1">예약 날짜</p>
                                      <p className="text-sm font-medium text-slate-900">
                                        {startDateTime.date}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-500 mb-1">예약 시간</p>
                                      <p className="text-sm font-medium text-slate-900">
                                        {startDateTime.time} - {endDateTime.time}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-500 mb-1">수용 인원</p>
                                      <p className="text-sm font-medium text-slate-900">
                                        {reservation.room?.capacity || '-'}명
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-500 mb-1">예약 사유</p>
                                      <p className="text-sm font-medium text-slate-900">
                                        {reservation.reason || '-'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-xs text-slate-400">
                                    예약 신청일: {createdAt.date} {createdAt.time}
                                  </div>
                                </div>

                                <div className="flex gap-2 ml-6">
                                  <button
                                    onClick={() => handleConfirm(reservation)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(reservation)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                                  >
                                    거절
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        대기 중인 예약이 없습니다
                      </h3>
                      <p className="text-slate-600">
                        모든 예약이 처리되었습니다.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 회원 관리 탭 */}
            {activeTab === 'users' && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    회원 관리
                  </h2>
                  <p className="text-lg text-slate-600">
                    회원 목록을 조회하고 역할을 변경하거나 탈퇴시킬 수 있습니다.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-900">
                        회원 목록 {usersData && `(총 ${usersData.total}명)`}
                      </h3>
                    </div>
                    {/* 검색 입력 필드 */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={usersSearch}
                        onChange={(e) => {
                          setUsersSearch(e.target.value);
                          setUsersPage(1); // 검색 시 첫 페이지로 리셋
                        }}
                        placeholder="이름 또는 이메일로 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                      {usersSearch && (
                        <button
                          onClick={() => {
                            setUsersSearch('');
                            setUsersPage(1);
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          <svg
                            className="h-5 w-5"
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
                      )}
                    </div>
                  </div>

                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-slate-600">로딩 중...</p>
                    </div>
                  ) : usersData && usersData.data.length > 0 ? (
                    <>
                      <div className="divide-y divide-slate-200">
                        {usersData.data.map((user) => (
                          <div
                            key={user.id}
                            className="p-6 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-slate-900">
                                    {user.name}
                                  </h4>
                                  <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                      user.role === UserRole.ADMIN
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-100 text-slate-800'
                                    }`}
                                  >
                                    {user.role === UserRole.ADMIN ? '관리자' : '일반 사용자'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600">{user.email}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                  가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-6">
                                <button
                                  onClick={() => openRoleModal(user)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                >
                                  {user.role === UserRole.USER ? '관리자로 변경' : '일반 사용자로 변경'}
                                </button>
                                <button
                                  onClick={() => openDeleteUserModal(user)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                                >
                                  탈퇴
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 페이지네이션 */}
                      {usersData.totalPages > 1 && (
                        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            페이지 {usersData.page} / {usersData.totalPages} (전체 {usersData.total}명)
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                              disabled={usersData.page === 1}
                              className="px-4 py-2 border border-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                            >
                              이전
                            </button>
                            <button
                              onClick={() => setUsersPage((p) => Math.min(usersData.totalPages, p + 1))}
                              disabled={usersData.page === usersData.totalPages}
                              className="px-4 py-2 border border-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-slate-600">회원이 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 회의실 관리 탭 */}
            {activeTab === 'rooms' && (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                      회의실 관리
                    </h2>
                    <p className="text-lg text-slate-600">
                      회의실을 추가, 수정, 삭제할 수 있습니다.
                    </p>
                  </div>
                  <button
                    onClick={openCreateRoomModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    + 회의실 추가
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900">
                      회의실 목록 {roomsData && `(총 ${roomsData.total}개)`}
                    </h3>
                  </div>

                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-slate-600">로딩 중...</p>
                    </div>
                  ) : roomsData && roomsData.data.length > 0 ? (
                    <>
                      <div className="divide-y divide-slate-200">
                        {roomsData.data.map((room) => (
                          <div
                            key={room.id}
                            className="p-6 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-slate-900">
                                    {room.name}
                                  </h4>
                                  <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                      room.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {room.isActive ? '사용 가능' : '비활성'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">
                                  수용 인원: {room.capacity}명
                                </p>
                                {room.description && (
                                  <p className="text-sm text-slate-500">{room.description}</p>
                                )}
                                <p className="text-xs text-slate-400 mt-2">
                                  생성일: {new Date(room.createdAt).toLocaleDateString('ko-KR')}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-6">
                                <button
                                  onClick={() => openEditRoomModal(room)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => openDeleteRoomModal(room)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 페이지네이션 */}
                      {roomsData.totalPages > 1 && (
                        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            페이지 {roomsData.page} / {roomsData.totalPages} (전체 {roomsData.total}개)
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRoomsPage((p) => Math.max(1, p - 1))}
                              disabled={roomsData.page === 1}
                              className="px-4 py-2 border border-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                            >
                              이전
                            </button>
                            <button
                              onClick={() => setRoomsPage((p) => Math.min(roomsData.totalPages, p + 1))}
                              disabled={roomsData.page === roomsData.totalPages}
                              className="px-4 py-2 border border-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-slate-600">회의실이 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* 거절 모달 */}
      {showRejectModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              예약 거절
            </h3>
            <p className="text-slate-600 mb-4">
              예약을 거절하려면 사유를 입력해주세요.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                거절 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="예: 회의실 정원 초과, 시간대 중복 등"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedReservation(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                거절하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 역할 변경 모달 */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              역할 변경
            </h3>
            <p className="text-slate-600 mb-4">
              <strong>{selectedUser.name}</strong>님의 역할을{' '}
              {selectedUser.role === UserRole.USER ? '관리자' : '일반 사용자'}로 변경하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleUpdateRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                변경하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 모달 */}
      {showDeleteUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              회원 탈퇴
            </h3>
            <p className="text-slate-600 mb-4">
              <strong>{selectedUser.name}</strong>님을 정말 탈퇴시키시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                탈퇴시키기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회의실 추가/수정 모달 */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {selectedRoom ? '회의실 수정' : '회의실 추가'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  회의실 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomFormData.name}
                  onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="회의실 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  수용 인원 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={roomFormData.capacity}
                  onChange={(e) => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  설명
                </label>
                <textarea
                  value={roomFormData.description}
                  onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="회의실 설명을 입력하세요 (선택사항)"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={roomFormData.isActive}
                  onChange={(e) => setRoomFormData({ ...roomFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-slate-700">
                  사용 가능
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRoomModal(false);
                  setSelectedRoom(null);
                  setRoomFormData({ name: '', capacity: 1, description: '', isActive: true });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                onClick={selectedRoom ? handleUpdateRoom : handleCreateRoom}
                disabled={!roomFormData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedRoom ? '수정하기' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회의실 삭제 모달 */}
      {showDeleteRoomModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              회의실 삭제
            </h3>
            <p className="text-slate-600 mb-4">
              <strong>{selectedRoom.name}</strong> 회의실을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteRoomModal(false);
                  setSelectedRoom(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleDeleteRoom}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
