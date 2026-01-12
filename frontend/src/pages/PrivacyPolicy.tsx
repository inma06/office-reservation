import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              개인정보처리방침
            </h1>
            <p className="text-gray-600 text-sm">
              최종 수정일: {new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. 개인정보의 처리 목적
              </h2>
              <p>
                회의실 예약 시스템(이하 "서비스")은 다음의 목적을 위하여
                개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적
                이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
                개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한
                조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>회원 가입 및 관리</li>
                <li>회의실 예약 서비스 제공</li>
                <li>서비스 이용에 따른 본인확인</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. 개인정보의 처리 및 보유기간
              </h2>
              <p>
                서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
                개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
                개인정보를 처리·보유합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. 처리하는 개인정보의 항목
              </h2>
              <p>서비스는 다음의 개인정보 항목을 처리하고 있습니다:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>필수항목: 이메일, 이름, 비밀번호</li>
                <li>선택항목: 프로필 사진 (Google 로그인 시)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. 개인정보의 제3자 제공
              </h2>
              <p>
                서비스는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서
                명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한
                규정 등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를
                제3자에게 제공합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. 개인정보처리의 위탁
              </h2>
              <p>
                서비스는 원활한 개인정보 업무처리를 위하여 다음과 같이
                개인정보 처리업무를 위탁하고 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. 정보주체의 권리·의무 및 행사방법
              </h2>
              <p>
                정보주체는 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를
                행사할 수 있습니다. 권리 행사는 서비스를 통해 요청하실 수
                있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. 개인정보의 파기
              </h2>
              <p>
                서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
                불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. 개인정보 보호책임자
              </h2>
              <p>
                서비스의 개인정보 처리에 관한 업무를 총괄해서 책임지고,
                개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을
                위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← 로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
