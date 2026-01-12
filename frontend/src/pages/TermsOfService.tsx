import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              서비스 이용약관
            </h1>
            <p className="text-gray-600 text-sm">
              최종 수정일: {new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제1조 (목적)
              </h2>
              <p>
                본 약관은 회의실 예약 시스템(이하 "서비스")이 제공하는
                회의실 예약 서비스의 이용과 관련하여 서비스와 이용자 간의
                권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
                합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제2조 (정의)
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  "서비스"란 회의실 예약 시스템이 제공하는 회의실 예약 및
                  관리 서비스를 의미합니다.
                </li>
                <li>
                  "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및
                  비회원을 의미합니다.
                </li>
                <li>
                  "회원"이란 서비스에 회원등록을 하고 서비스를 이용하는 자를
                  의미합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제3조 (약관의 게시와 개정)
              </h2>
              <p>
                서비스는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스
                초기 화면에 게시합니다. 서비스는 필요한 경우 관련 법령을
                위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제4조 (회원가입)
              </h2>
              <p>
                이용자는 서비스가 정한 가입 양식에 따라 회원정보를 기입한 후
                본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
                서비스는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에
                해당하지 않는 한 회원으로 등록합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제5조 (서비스의 제공 및 변경)
              </h2>
              <p>서비스는 다음과 같은 서비스를 제공합니다:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>회의실 목록 조회</li>
                <li>회의실 예약 및 취소</li>
                <li>예약 내역 조회</li>
                <li>기타 서비스가 정하는 업무</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제6조 (서비스의 중단)
              </h2>
              <p>
                서비스는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장,
                통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을
                일시적으로 중단할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제7조 (회원의 의무)
              </h2>
              <p>회원은 다음 행위를 하여서는 안 됩니다:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>신청 또는 변경 시 허위내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>서비스에 게시된 정보의 변경</li>
                <li>서비스가 정한 정보 이외의 정보 등의 송신 또는 게시</li>
                <li>서비스와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제8조 (개인정보보호)
              </h2>
              <p>
                서비스는 이용자의 개인정보 수집시 서비스 제공을 위하여 필요한
                범위에서 최소한의 개인정보를 수집합니다. 서비스는 개인정보
                보호법에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                제9조 (면책조항)
              </h2>
              <p>
                서비스는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
                제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
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
