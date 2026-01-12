import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import { UserRole } from './types';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  // 관리자 체크 - 관리자는 /admin으로 리다이렉트
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const userRole = String(user.role || '').toUpperCase().trim();
      if (userRole === 'ADMIN' || userRole === UserRole.ADMIN) {
        return <Navigate to="/admin" />;
      }
    } catch {
      // 파싱 에러 무시하고 일반 사용자로 처리
    }
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    return <Navigate to="/login" />;
  }

  // role 비교: enum 값 또는 문자열 'ADMIN' 모두 허용
  const userRole = String(user.role || '').toUpperCase().trim();
  const isAdmin = userRole === 'ADMIN' || userRole === UserRole.ADMIN;

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

// 토큰 체크 컴포넌트 (모든 페이지에서 실행)
function TokenChecker() {
  useEffect(() => {
    // URL에서 token과 user 쿼리 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token) {
      // 토큰을 localStorage에 저장
      localStorage.setItem('token', token);
      
      // user 정보도 함께 저장 (SSO 로그인인 경우)
      if (userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          console.error('Failed to parse user from URL:', error);
        }
      }
      
      // 주소창을 깔끔하게 정리 (쿼리 스트링 제거)
      const cleanUrl = window.location.pathname || '/';
      window.history.replaceState({}, '', cleanUrl);
      
      // 사용자 정보를 기반으로 올바른 페이지로 리다이렉트
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userRole = String(user.role || '').toUpperCase().trim();
          if (userRole === 'ADMIN' || userRole === UserRole.ADMIN) {
            window.location.href = '/admin';
            return;
          }
        }
      } catch {
        // 파싱 에러 무시
      }
      
      // 로그인이 완료된 상태로 메인 화면을 보여주기 위해 페이지 리로드
      window.location.reload();
    }
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <TokenChecker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

