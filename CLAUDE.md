# 혜택나침반 작업 안내

| 명령 | 목적 |
|---|---|
| npm ci | 검사 도구 설치 |
| SITE_URL=https://site-url.invalid npm run build | 정적 페이지 생성 |
| npm test | 규칙·출력·개인정보 검사 |
| npm run check:screen | 4173 포트의 화면 검사 |
| npm run restore | 최초 데이터 복원 |

배포 주소는 Pages의 base_url로 전달한다. 자리표시가 남은 배포는 차단한다.
브랜드 기본값은 혜택나침반, 키 색은 #315fdd이다.

data/는 원본과 baseline, assets/는 정제된 이미지·스타일·이동 스크립트,
scripts/는 빌드·규칙·화면 검사, _site/는 배포 결과물이다.

webhards.json: updated, metricsDate, rankLimit, minScore, weights,
weeklyAdjust, maxRank, previousRanks, webhards 배열을 사용한다.
서비스는 id, name, status, url, logo, color, reason, tags, benefits,
metrics를 가진다. 모르는 지표는 null, 모르는 주소는 pending으로 둔다.
현재 지표는 미수집이다. 기존 순서를 유지하고 실측 순위로 설명하지 않는다.
카드 별점은 편집 별점으로 앱 평점과 구분한다.

차단 서비스 목록은 검사 스크립트를 따른다. 재등록 요청에는 기존 결정을 먼저 안내한다.
가입 혜택은 1개, 이벤트는 2개까지이며 추측하지 않는다.
고정 가입 혜택은 지정된 두 서비스에만 적용한다.
공식 로고만 사용하고 이미지를 정제한다. 외부 스크립트·폼·분석 ID는 넣지 않는다.
업체 주소는 이동 페이지의 뒤집은 base64 값으로만 배포한다.

실명·계정·저장소 식별자·이메일·로컬 경로를 소스·결과물·메시지에 쓰지 않는다.
PRIVACY_PATTERNS 줄 단위 값도 검사한다. 비밀 값은 출력하지 않는다.
사용자 승인에 따라 연결 계정으로 커밋하며 실제 커밋 시각을 허용한다.
소스와 배포 결과물의 개인정보 금지 규칙은 계속 적용한다.
서명·세션 링크·생성 도구 표시를 추가하지 않는다. CNAME은 만들지 않는다.
현재 저장소 공개 여부는 사용자가 정하며 임의로 바꾸지 않는다.
주간 외부 수집은 선택 사항으로 현재 비활성이다.
