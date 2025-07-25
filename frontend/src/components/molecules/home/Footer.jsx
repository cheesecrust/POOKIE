// src/components/molecules/home/Footer.jsx
// 사용 예시:
// ! 상위에 flex-column 레이아웃 구성 필요
// <div className="flex flex-col min-h-screen">
//     <Header/>
//     <main className="flex-grow">...</main>
//     <Footer/>
// </div>
// 추가
// target="_blank" 사용 시 보안 권장 설정:
// - noopener: window.opener 제거 (탭 간 보안)
// - noreferrer: referrer 정보 차단 (추적 방지)
// → 항상 rel="noopener noreferrer"와 함께 사용할 것

const Footer = () => {
    return (
        <footer className="w-full bg-[#EF8888] py-4 text-center text-sm text-black">
          <div className="flex justify-center gap-8 mb-2">
            <a
              href="https://www.notion.so/Home-22cf8b7cd5bb80039f65db4777152ad5"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              NOTION
            </a>
            <a
              href="https://project.ssafy.com/sso?SAMLRequest=fZFdT4MwFIb%2FCne9glLGNmyAhGwxWTKNmR8X3pizUjK0tNhT1P17C4txJupt87zPec9pjtCpnleDO%2BidfB0kuqBClNa1Rq%2BMxqGT9lbat1bI%2B922IAfneuSUKthHiNAcI2E6OvgEUvAWOgqpAKX2IF5IsPbGVsOo%2Bw731jxL4c4EiIYEm3VBnuoLMW%2FSLAtZw0SYLtIm3DcpC1O2jGExqzNIZh5FHORGowPtCpLEyTyMl2GS3rGYpxmfZY8kePCdprFJFJPgo1Ma%2BdiuIIPV3AC2yDV0ErkT%2FLa62nIPcvja%2FjzS%2F5%2Fx%2BzgjjCJlPtJ8amfLX2%2BV03MkP93%2F2is36xujWnEMKqXM%2B8pKcLIgzg6SBJfGduD%2BLsEiNr20ddhMKJcdtKqqaysRCS1PU39%2BdPkJ"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GITLAB
            </a>
            <a
              href="https://ssafy.atlassian.net/jira/software/c/projects/S13P11A604/boards/9686"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              JIRA
            </a>
          </div>
          <p className="mb-1">
            (주)푸키푸키 주식회사 ｜ 대표자명 : 정연수
          </p>
          <p className="text-xs">Copyright © A604</p>
        </footer>
    );
};

export default Footer;