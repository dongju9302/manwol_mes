# 프롬프트 기록

## 2026-05-06

- page.tsx 보일러플레이트 전체 제거 후 "안녕하세요! manwol_mes 프로젝트입니다." 텍스트만 화면 중앙에 표시
- AGENTS.md에 프로젝트 개요(프로젝트명, 프레임워크, 목표, DB, 인증, 암호화) 및 작업 기록 섹션 추가 (1차)
- CLAUDE.md에 작업 규칙 섹션 추가 (1차)
- AGENTS.md 프로젝트 개요 유지 + CLAUDE.md 작업 규칙 항목 추가·수정 (2차: 작업 목록 승인, 체크리스트 검증, 간결한 답변, 해결방법 설명 항목 추가)
- page.tsx 보일러플레이트 제거 후 /login으로 이동하는 버튼 배치
- app/login/page.tsx 신규 생성 (이메일, 비밀번호 입력 필드, 로그인 버튼, Tailwind 스타일, TypeScript 타입)
- AGENTS.md 작업 기록 섹션 삭제 + PROMPTS.md 신규 생성 + CLAUDE.md에 PROMPTS.md 기록 규칙 추가
- 인증 관련 패키지 설치
  - bcryptjs: 비밀번호를 해시(암호화)하고 검증하는 라이브러리. 평문 비밀번호를 DB에 저장하지 않고 해시값으로 저장할 때 사용
  - jsonwebtoken: JWT(JSON Web Token)를 생성하고 검증하는 라이브러리. 로그인 성공 시 토큰을 발급하고, 요청마다 토큰을 확인해 인증 상태를 유지할 때 사용
  - @types/bcryptjs: bcryptjs의 TypeScript 타입 정의 파일. TypeScript 프로젝트에서 bcryptjs를 타입 안전하게 사용하기 위해 필요
  - @types/jsonwebtoken: jsonwebtoken의 TypeScript 타입 정의 파일. TypeScript 프로젝트에서 jsonwebtoken을 타입 안전하게 사용하기 위해 필요
- data/users.json 신규 생성 (빈 배열로 초기화)
- types/user.ts 신규 생성 (User 인터페이스 정의: id, email, password, createdAt)
- app/api/auth/register/route.ts 신규 생성 (POST 회원가입 API: 유효성 검증, 이메일 중복 확인, bcrypt 해시, users.json 저장)
- CLAUDE.md 작업 규칙을 필수 작업 순서 6단계 섹션으로 교체 (PROMPTS.md 기록을 필수 절차로 명시)
- docs/HTTP_STATUS_CODES.md 신규 생성 (1xx~5xx 상태 코드 정리, 프로젝트 API 사용 현황 표 포함)
- app/api/auth/login/route.ts 신규 생성 (POST 로그인 API: 이메일 조회, bcrypt 비밀번호 검증, JWT 토큰 생성, 쿠키 저장)
- .env.local 신규 생성 (JWT_SECRET 환경변수 설정), .gitignore에 .env* 패턴으로 이미 포함 확인
- register/route.ts + login/route.ts 코드 검토 후 개선: 이메일 형식·비밀번호 길이 검증, 소문자 정규화, NextResponse.cookies.set() 적용, 사용자 열거 공격 방지, JWT_SECRET 폴백 제거, Secure 쿠키 플래그 추가, 주석 스타일 별도 줄로 통일
- CLAUDE.md에 코딩 규칙 및 코딩 규칙 검토 섹션 추가
- .env.local의 JWT_SECRET을 crypto.randomBytes(64)로 생성한 안전한 값으로 교체
- app/login/page.tsx에 /api/auth/login API 연동 (로그인 호출, 성공 시 / 이동, 실패 시 에러 메시지 표시, 로딩 상태 처리)
- app/login/page.tsx UI 수정: 입력 필드 텍스트 색상 명확화(다크/라이트모드 대응), 에러 메시지 영역 고정 높이로 레이아웃 변경 방지
- data/users.json에 테스트 계정 추가 (test@test.com / test1234, bcrypt 해시 적용)
- types/user.ts의 User 인터페이스에 name 필드 추가 (email 다음), register/route.ts에서 name 추출·필수값 검증·저장 처리 추가
- app/register/page.tsx 신규 생성 (이름·이메일·비밀번호 입력, POST /api/auth/register, 성공 시 /login 이동, 실패 시 에러 표시, 로그인 페이지와 동일 스타일)

## 2026-05-07

- app/login/page.tsx 로그인 버튼 아래에 "계정이 없으신가요? 회원가입" 링크 추가 (/register 이동)
- PostgreSQL 관련 패키지 설치 (터미널에서 직접 실행)
  - pg: Node.js에서 PostgreSQL에 접속하는 라이브러리. 서버 코드가 DB와 통신할 때 사용
  - @types/pg: pg의 TypeScript 타입 정의 파일. TypeScript 프로젝트에서 pg를 타입 안전하게 사용하기 위해 필요
  - 실행 명령어: npm install pg @types/pg
- .env.local에 DATABASE_URL 추가 (postgresql://localhost:5432/manwol_mes)
- lib/db.ts 신규 생성 (pg Pool로 PostgreSQL 연결, process.env.DATABASE_URL 사용, 싱글턴 패턴으로 앱 전체에서 하나의 Pool만 사용)
- DBeaver 연결 설정 완료 (Host: localhost, Port: 5432, Database: manwol_mes) — GUI로 DB 데이터를 직접 조회·수정하는 툴
- lib/db/migrate.ts 신규 생성 (users 테이블 생성: id SERIAL PK, email UNIQUE NOT NULL, password NOT NULL, created_at TIMESTAMP DEFAULT NOW(), CREATE TABLE IF NOT EXISTS 사용), npx ts-node lib/db/migrate.ts 로 실행 완료
- pg/@types/pg 패키지 재설치, lib/db.ts 재생성 (pg Pool 싱글턴), .env.local에 DATABASE_URL 추가
- register/route.ts — users.json 파일 I/O 제거 후 PostgreSQL INSERT INTO users 로 교체 (이메일 중복은 DB unique 제약 조건으로 처리)
- login/route.ts — users.json 파일 I/O 제거 후 PostgreSQL SELECT WHERE email 로 교체
- lib/auth.ts 신규 생성 (JWT 검증 헬퍼: 쿠키에서 token 추출 → jsonwebtoken 검증 → AuthUser 반환, 실패 시 null)
- lib/db/migrate_posts.ts 신규 생성 (posts, comments, post_likes 테이블 생성 마이그레이션, 트랜잭션 적용, ON DELETE CASCADE 설정)
- app/api/posts/route.ts 신규 생성 (GET: 게시글 목록 최신순+작성자명, POST: JWT 검증 후 게시글 작성)
- app/api/posts/[id]/route.ts 신규 생성 (GET: 좋아요·싫어요 수 포함 상세조회, PUT·DELETE: 작성자 본인 검증 후 수정·삭제)
- app/api/posts/[id]/comments/route.ts 신규 생성 (GET: 댓글+대댓글 중첩 구조 반환, POST: JWT 검증 후 댓글/대댓글 작성)
- app/api/posts/[id]/comments/[commentId]/route.ts 신규 생성 (PUT·DELETE: 작성자 본인 검증 후 댓글 수정·삭제)
- app/api/posts/[id]/likes/route.ts 신규 생성 (POST: 좋아요/싫어요 토글 — 동일타입 재클릭 시 취소, 다른타입 클릭 시 변경)
- lib/auth.ts에 verifyAuthFromCookies() 추가 (서버 컴포넌트용: next/headers cookies()로 JWT 검증)
- app/board/page.tsx 신규 생성 (서버 컴포넌트: 미로그인 시 /login 리다이렉트, DB 게시글 목록 조회, 글쓰기 버튼)
- app/board/write/page.tsx 신규 생성 (클라이언트 컴포넌트: 제목·내용 입력 폼, POST /api/posts, 성공 시 /board 이동)
- app/board/[id]/page.tsx 신규 생성 (서버 컴포넌트: 게시글 상세·좋아요수·댓글, 작성자 본인만 수정·삭제 버튼 표시)
- app/board/[id]/_components/LikeButtons.tsx 신규 생성 (클라이언트: 좋아요·싫어요 토글, 낙관적 업데이트)
- app/board/[id]/_components/CommentSection.tsx 신규 생성 (클라이언트: 댓글·대댓글 목록+작성폼+삭제, 낙관적 업데이트)
- app/board/[id]/_components/DeleteButton.tsx 신규 생성 (클라이언트: 게시글 삭제 후 /board 이동)
- app/board/[id]/edit/page.tsx 신규 생성 (클라이언트: 기존 내용 로드 후 수정, PUT /api/posts/[id], 성공 시 /board/[id] 이동)
- app/register/page.tsx 하단에 "이미 계정이 있으신가요? 로그인" 링크 추가 (/login 이동, login/page.tsx의 회원가입 링크와 동일 스타일)
- app/login/page.tsx 로그인 성공 시 이동 경로를 / → /board로 변경
- proxy.ts 신규 생성 (Next.js 16에서 middleware.ts는 deprecated → proxy.ts로 변경됨. /login·/register는 공개, 그 외 전체 보호. 비로그인 시 /login 리다이렉트, 로그인 상태로 공개 경로 접근 시 /board 리다이렉트, JWT 쿠키 검증)
- app/api/auth/logout/route.ts 신규 생성 (POST: token 쿠키 삭제 후 /login 리다이렉트)
- app/components/Sidebar.tsx 신규 생성 (클라이언트: usePathname 활성 메뉴 하이라이트, 로그아웃, 사용자 이름 표시, 모바일 hidden)
- app/board/layout.tsx 신규 생성 (서버: 유저 이름 DB 조회, Sidebar + children 레이아웃 구성, /board/** 전체 적용)
- app/board/page.tsx 헤더에서 LogoutButton 제거 (사이드바로 이동)
- app/icon.svg 신규 생성 (체크마크 아이콘, favicon.ico 대체) → logo.png로 교체
- public/logo.png를 사이드바 상단 로고 및 파비콘으로 적용
- Sidebar.tsx 로고 크기 width=80 height=27로 축소
- Sidebar.tsx 로고 영역 개편: 로고 이미지 → "Manwol"(굵게) → "MES"(작은 회색) 세로 배치, 전체 가운데 정렬
- app/icon.svg, app/favicon.ico 삭제 / layout.tsx icons → { icon, shortcut, apple } 모두 /logo.png로 설정
- layout.tsx title → "Manwol MES", icons → { icon: [{ url: '/logo.png' }] }로 변경
- app/layout.tsx metadata title → "manwol_mes", description 수정, html lang → "ko"
- posts 테이블에 view_count INTEGER DEFAULT 0 컬럼 추가 (ALTER TABLE, DBeaver에서 실행)
- app/api/posts/[id]/route.ts GET에 view_count +1 UPDATE 추가, 응답에 view_count 포함
- app/board/page.tsx 테이블 스타일 개선: 헤더 bg-gray-200, 행 bg-white + hover:bg-gray-50, 테두리+그림자 추가
- 시스템 전체 폰트를 Pretendard로 변경 (CDN, globals.css font-family, @theme --font-sans 등록, Geist 폰트 제거)
- app/board/write/page.tsx 헤더 개선: ← 아이콘 버튼 + "글쓰기" 제목 한 줄 배치로 변경
- app/board/_components/BoardFilter.tsx 신규 생성 → 체크박스 선택삭제 방식으로 개편
- BoardFilter.tsx 삭제 버튼 로직 수정: 전체삭제 버튼 제거, 전체선택 시 버튼 텍스트 "전체삭제"로 변경, 미선택 시 버튼 숨김
- BoardFilter.tsx 선택삭제 버튼 항상 표시로 변경: 미선택 시 회색 비활성화, 일부 선택 시 "선택삭제", 전체 선택 시 "전체삭제"
- BoardFilter.tsx 모든 버튼 padding py-2 px-4로 통일
- app/components/Button.tsx 신규 생성 (variant: primary·secondary·danger, size: sm·md, disabled 처리)
- BoardFilter.tsx 게시글 번호를 DB id → 목록 순서(index + 1)로 변경
- data/users.json 및 data/ 폴더 삭제, 미사용 types/user.ts 삭제 (PostgreSQL 전환으로 불필요)
- api/posts/[id]/route.ts GET: 작성자 본인 조회 시 view_count 증가 안 함 → 실제 조회 경로는 서버 컴포넌트이므로 board/[id]/page.tsx로 이동, API route는 수정 페이지 전용
- board/[id]/page.tsx에 view_count 증가 로직 추가 (작성자 본인 제외)
- CommentSection.tsx textarea rows=2 → rows=1 축소
- api/auth/register/route.ts: 회원가입 성공 시 JWT 쿠키 발급 + 자동 로그인
- app/register/page.tsx: 회원가입 성공 시 /login → /board로 이동
- app/login/page.tsx, app/register/page.tsx: 비밀번호 필드에 눈 아이콘 토글 추가
- BoardFilter.tsx, write/page.tsx, DeleteButton.tsx 버튼을 Button 컴포넌트로 교체 (전체글: 번호 표시, 내글만: 체크박스 + 전체선택, 전체삭제/선택삭제 버튼, 행 높이 통일)
- app/board/page.tsx SQL에 user_id 추가, 테이블 렌더링을 BoardFilter로 위임
- app/board/page.tsx 테이블 개편: 번호·제목·작성자·조회수·좋아요·싫어요·작성일 7개 컬럼, 컬럼 구분선, 헤더 가운데 정렬, 제목 왼쪽 정렬
- app/board/_components/LogoutButton.tsx 신규 생성 (클라이언트 컴포넌트: POST /api/auth/logout 호출 후 /login 이동)
- app/board/page.tsx 헤더에 LogoutButton 추가 (글쓰기 버튼 왼쪽 배치)

## 2026-05-11

- users 테이블에 phone VARCHAR(20) NOT NULL DEFAULT '' 컬럼 추가 (ALTER TABLE, DBeaver에서 실행)
- app/register/page.tsx: 이름과 이메일 사이에 연락처(모바일) 입력 필드 추가 (010-0000-0000 자동 하이픈, 필수값, 010으로 시작하는 11자리 유효성 검사)
- app/api/auth/register/route.ts: phone 값 추출·필수값 검증·형식 유효성 검사·DB INSERT 포함
- 시스템 전체 반응형 UI 적용 (모바일 < 768px / 태블릿 768~1024px / 데스크탑 1024px+, Tailwind md:/lg: 클래스 사용)
  - app/components/Sidebar.tsx: 모바일 햄버거+슬라이드 드로어+딤처리, 태블릿 아이콘 전용 좁은 사이드바(w-16), 데스크탑 전체 사이드바(w-60)
  - app/board/layout.tsx: 모바일 햄버거 버튼 아래 콘텐츠 밀기 (pt-16 md:pt-0)
  - app/components/Button.tsx: md 사이즈 최소 높이 44px 적용 (터치 친화적)
  - app/board/_components/BoardFilter.tsx: 모바일 카드 형식, 태블릿 간소화 테이블(조회수·좋아요·싫어요 숨김), 데스크탑 전체 테이블
  - app/board/page.tsx: 모바일 패딩 축소, 글쓰기 버튼 터치 영역 확대
  - app/board/[id]/page.tsx: 모바일/태블릿 px/py 축소, 제목 폰트 크기 반응형
  - app/board/write/page.tsx: 모바일 폼 패딩 축소, 버튼 터치 영역 확대
  - app/board/[id]/edit/page.tsx: 모바일 폼 패딩 축소, 버튼 터치 영역 확대
  - app/login/page.tsx: 모바일 전체 너비 + 패딩, 버튼 최소 높이 44px
  - app/register/page.tsx: 모바일 전체 너비 + 패딩, 버튼 최소 높이 44px
- app/api/auth/check-email/route.ts 신규 생성 (GET: email 쿼리 파라미터로 중복 여부 확인, available: boolean 반환)
- app/register/page.tsx 이메일 중복 검사 및 버튼 활성화 조건 추가
  - onBlur 시 GET /api/auth/check-email 호출 → 초록(사용 가능) / 빨간(중복) 메시지
  - 이메일 수정 시 검사 상태 idle로 초기화
  - 버튼 활성화 조건: 이름 1자+, 이메일 형식 유효+중복 통과, 연락처 형식 유효, 비밀번호 8자+
- app/register/page.tsx 각 입력란 인라인 유효성 메시지 추가 (onBlur 트리거, 고정 h-5 영역)
  - 이름: 빈값 → 빨간 "이름을 입력해주세요."
  - 연락처: 형식 불일치 → 빨간 메시지, 올바른 형식 → 초록 메시지
  - 이메일: 형식 오류 → 빨간, 중복 → 빨간, 사용 가능 → 초록, 확인 중 → 회색
  - 비밀번호: 8자 미만 → 빨간, 8자 이상 → 초록
- 권한 시스템 구현
  - DBeaver 실행 쿼리: users(role VARCHAR(10) CHECK master/admin/user, is_active BOOLEAN), page_permissions 테이블 생성, /board 기본 데이터 INSERT
  - lib/auth.ts: JwtPayload·AuthUser에 role/isActive 추가
  - login/route.ts: role·is_active DB 조회 → JWT 포함, 비활성 계정 로그인 차단(403)
  - register/route.ts: JWT에 role='user'/isActive=true 포함
  - proxy.ts: JWT 기반 isActive 차단(쿠키 삭제+/login 리다이렉트), /admin/** master 전용 보호(/unauthorized 리다이렉트)
  - board/layout.tsx: users 테이블에서 role 조회 → Sidebar에 userRole 전달
  - Sidebar.tsx: userRole prop 추가, master일 때 관리자 메뉴(계정 관리/권한 설정) 표시
  - app/unauthorized/page.tsx 신규 생성 (403 안내 페이지)
  - app/admin/layout.tsx 신규 생성 (master 검증 + 사이드바 레이아웃)
  - app/admin/page.tsx 신규 생성 (계정 목록 테이블: 이름/이메일/역할/활성화/삭제)
  - app/admin/permissions/page.tsx 신규 생성 (페이지 권한 테이블: admin_access/user_access 토글)
  - app/api/admin/users/route.ts 신규 생성 (GET: 전체 사용자 목록)
  - app/api/admin/users/[id]/route.ts 신규 생성 (PATCH: 역할/활성화 수정, DELETE: 계정 삭제)
  - app/api/admin/permissions/route.ts 신규 생성 (GET: 권한 목록, PATCH: 권한 수정)
- 전체 레이아웃 재구성 (헤더 상단 고정 + 사이드바 소분류 전용 + 콘텐츠)
  - lib/navigation.ts 신규 생성 (대분류/중분류/소분류 메뉴 구조 배열, masterOnly 필터 포함)
  - app/api/auth/me/route.ts 신규 생성 (GET: JWT 기반 로그인 사용자 정보 반환)
  - app/components/Header.tsx 신규 생성 (로고, 대분류 호버 드롭다운, 모바일 햄버거 드로어, 사용자명+로그아웃)
  - app/components/LayoutProvider.tsx 신규 생성 (클라이언트, pathname 기반 헤더/사이드바 조건부 렌더링, /api/auth/me 유저 조회)
  - app/components/Sidebar.tsx 전면 재작성 (소분류 전용, 소분류 없으면 null 반환, 호버 임시 펼침/핀 고정 구조)
  - app/layout.tsx 수정 (LayoutProvider 적용, 로그인/회원가입 페이지는 헤더 미노출)
  - app/page.tsx 수정 (메인 홈: "Manwol MES" 제목 + 구글형 통합검색 입력창 UI)
  - app/login/page.tsx 수정 (로그인 성공 이동: /board → /)
  - app/board/layout.tsx 간소화 (Sidebar 제거, 서버측 인증 확인만 유지)
  - app/admin/layout.tsx 간소화 (Sidebar 제거, master 검증만 유지)
- 권한 설정 페이지를 계정 관리 페이지로 통합 (탭 UI)
  - app/admin/permissions/page.tsx 삭제
  - app/admin/page.tsx: "계정 목록" / "권한 설정" 탭 UI로 재작성 (계정·권한 기능 단일 페이지 통합)
  - lib/navigation.ts: 관리 카테고리에서 "권한설정"(/admin/permissions) 항목 제거, "계정관리"만 유지
- UI 컴포넌트 정리 및 디자인 통일
  - app/components/ui/Button.tsx 신규 (variant: primary/secondary/danger/ghost, size: sm/md/lg)
  - app/components/ui/Input.tsx 신규 (label, error, success, hint, suffix 슬롯)
  - app/components/ui/Card.tsx 신규 (padding / overflow-hidden 두 모드)
  - app/components/ui/Badge.tsx 신규 (master/admin/user/active/inactive variant)
  - app/components/ui/Modal.tsx 신규 (오버레이+다이얼로그, confirm/cancel)
  - app/components/ui/Tabs.tsx 신규 (탭 스트립 컴포넌트)
  - app/components/ui/Table.tsx 신규 (TableWrapper, Th, Tr, Td 등 named exports)
  - app/components/Button.tsx: ui/Button re-export로 교체 (기존 임포트 호환 유지)
  - app/components/Header.tsx: 대분류 버튼 화살표(▾) 제거, 스타일 간소화
  - app/admin/page.tsx: Tabs·Table·Badge·Button·Modal 컴포넌트 적용, window.confirm → Modal 교체
  - app/board/write/page.tsx: Card·Input·Button 적용, pl-12 제거
  - app/board/[id]/page.tsx: Card·Button 적용, pl-12 제거
  - app/login/page.tsx: Card·Input·Button 적용
  - app/register/page.tsx: Card·Input·Button 적용, suffix 슬롯으로 eye 토글 처리
- Soft Delete 전환 (모든 삭제를 논리 삭제로 변경)
  - DB 컬럼 추가 (psql 직접 실행): posts·comments·users에 is_deleted BOOLEAN DEFAULT false, deleted_at TIMESTAMP
  - app/api/posts/route.ts: GET WHERE p.is_deleted = false 추가
  - app/api/posts/[id]/route.ts: GET·PUT WHERE is_deleted = false 추가, DELETE → UPDATE SET is_deleted=true, deleted_at=NOW()
  - app/api/posts/[id]/comments/route.ts: GET·POST 존재 확인 쿼리에 is_deleted = false 추가, 댓글 목록 WHERE c.is_deleted = false 추가
  - app/api/posts/[id]/comments/[commentId]/route.ts: PUT WHERE is_deleted=false 추가, DELETE → soft delete
  - app/api/admin/users/route.ts: GET WHERE is_deleted = false 추가
  - app/api/admin/users/[id]/route.ts: PATCH WHERE is_deleted=false 추가, DELETE → soft delete
  - app/api/auth/check-email/route.ts: WHERE email=$1 AND is_deleted=false (활성 계정만 중복 확인)
  - app/api/auth/register/route.ts: INSERT 전 이메일 존재 사전 확인, 탈퇴 계정 이메일 재가입 차단 (명시 에러)
  - app/api/auth/login/route.ts: WHERE email=$1 AND is_deleted=false (탈퇴 계정 로그인 차단)
- UI 수정: 헤더 로고 이미지 교체, 메인 페이지 간소화
  - app/components/Header.tsx: "Manwol MES" 텍스트 → /logo.png 이미지(img 태그, h-8)
  - app/page.tsx: 시스템 설명 문구 제거, 게시판 바로가기 버튼 제거, 제목+검색창만 유지
- 댓글 Soft Delete 표시 방식 개선
  - app/api/posts/[id]/comments/route.ts: GET에서 is_deleted 포함 전체 댓글 조회 후 코드로 필터링 — 활성 대댓글 있는 삭제 댓글은 is_deleted=true로 포함, 없으면 제외
  - app/board/[id]/page.tsx: CommentRow에 is_deleted 추가, 초기 댓글 쿼리에 c.is_deleted 포함, 동일 필터링 로직 적용
  - app/board/[id]/_components/CommentSection.tsx: CommentRow에 is_deleted 필드 추가, 삭제된 부모 댓글은 "삭제된 댓글입니다" 회색 텍스트 표시(작성자/내용/버튼 숨김), 대댓글은 정상 표시, handleDeleteComment 낙관적 업데이트 개선(대댓글 있으면 is_deleted=true 표시, 없으면 제거)
- app/board/_components/BoardFilter.tsx: 선택삭제 버튼 노출 조건 변경 — 체크박스 1개 이상 선택 시만 표시, 전체 선택 시 "전체삭제", 미선택 시 버튼 숨김
- app/board/_components/BoardFilter.tsx: 컬럼별 텍스트 정렬 설정 기능 추가 — ⚙️ 버튼 클릭 시 팝업 표시, 번호·제목·작성자·조회수·👍·👎·작성일 각 컬럼 왼쪽/가운데/오른쪽 정렬 선택, localStorage 저장, 테이블 즉시 반영
- app/board/_components/BoardFilter.tsx: 정렬 설정 UI를 팝업 → 편집모드 방식으로 전환 — ⚙️ 버튼 클릭 시 편집모드 진입, 헤더 각 컬럼 내 인라인 정렬 아이콘 버튼 표시, 헤더 배경색 변경으로 편집 중 표시, 완료 버튼 또는 ⚙️ 재클릭으로 종료, 팝업 제거
- 컬럼 정렬 편집모드를 공통 Table 컴포넌트로 통합
  - app/components/ui/Table.tsx: "use client" 추가, AlignValue/ColumnDef/AlignableTableProps 타입, AlignIcon/GearIcon/alignClass 헬퍼, AlignableTable<T> 컴포넌트 추가 (tableId 기반 localStorage, ⚙️ 아이콘만 표시, 편집모드 시 헤더 하단 정렬 버튼, 배경색 변경 없음)
  - app/board/_components/BoardFilter.tsx: 정렬 관련 코드 전부 제거, AlignableTable 교체 (tableId="board")
  - app/admin/page.tsx: 계정/권한 테이블을 AlignableTable로 교체 (tableId="admin-users"/"admin-permissions")
- app/components/ui/Table.tsx: ⚙️ 버튼 위치 변경 (테이블 내부 absolute → 외부 컨테이너 기준 right-0 top-0), 모든 th에 whitespace-nowrap 적용
- app/components/ui/Table.tsx: 편집모드 진입/종료 시 셀 크기 변동 수정 — 정렬 버튼 영역을 조건부 렌더링에서 항상 렌더링으로 변경, invisible/visible 전환으로 공간 유지하며 표시·숨김 처리
- app/components/ui/Table.tsx: AlignableTable 기본 스타일을 게시판 스타일로 통일 — theadClassName 기본값 bg-gray-100 text-sm text-gray-600, rowDivide 기본값 true (세로 구분선 항상 표시)
- app/components/ui/Table.tsx: 정렬 버튼 visibility 방식 제거 → absolute 포지션 방식으로 교체 (th에 relative, 버튼 div를 top-full z-30 absolute 배치), ⚙️ 아이콘 2배 확대 (h-3.5→h-7)
- app/components/ui/Table.tsx: ⚙️ 아이콘 크기 조정 (h-7→h-4, text-base 수준), 정렬 버튼 위치 변경 (헤더 아래 top-full → 헤더 위 bottom-full)
- app/components/ui/Table.tsx: 정렬 버튼 absolute 방식 폐기 → thead 안 별도 tr 행으로 변경 (overflow-hidden/z-index 문제 해결), pt-8→pt-6 축소
- app/components/ui/Table.tsx: 레이아웃 밀림 수정 — 별도 tr 방식 제거, 정렬 버튼을 기존 th 내부로 이동 후 invisible/visible 토글로 헤더 높이 항상 일정하게 유지 (BoardFilter 잔여 코드 없음 확인)
- app/board/page.tsx: 테이블 컨테이너 크기·패딩을 admin/page.tsx와 통일 (max-w-4xl→max-w-5xl, py-4 md:py-8→py-6 md:py-8)
- app/components/ui/Table.tsx: 정렬 버튼 위치 개선 — th 내 invisible 버튼 제거·py-3 복원, 카드를 outer(relative, overflow-hidden 없음)+inner(overflow-hidden) 이중 구조로 분리, 편집모드 오버레이를 outer 기준 absolute bottom-full flex 행으로 구현, toFlexCellClass 헬퍼로 컬럼 너비 근사 대응
- app/components/ui/Table.tsx: 정렬 버튼 완전 재구현 — absolute/이중카드 구조 폐기, ⚙️을 flex justify-end 단순 행으로 변경, 정렬 버튼을 테이블 외부 별도 div(isEditMode 조건부, display:none 방식)로 분리, 테이블 카드 단순 구조 복귀
- 시스템 전체 클릭 가능 요소에 cursor-pointer 적용: Button.tsx(enabled 상태), Header.tsx(대분류 버튼·로그아웃·햄버거), Sidebar.tsx(핀 버튼), Table.tsx(⚙️·정렬 버튼), Tabs.tsx(탭 버튼), admin/page.tsx(ToggleSwitch·활성화·select), login/page.tsx·register/page.tsx(EyeToggle)
- app/components/ui/Table.tsx: 정렬 버튼 useRef 측정 방식으로 재구현 — useLayoutEffect로 th 너비 측정, overflow-x-auto 안 div.relative에 absolute 오버레이 배치(가로 스크롤 연동), th에 paddingTop으로 공간 확보, toFlexCellClass 제거
- app/components/ui/Table.tsx: 이름 컬럼 정렬 버튼 클릭 불가 버그 수정 — overflow-hidden rounded-xl의 border-radius 클리핑이 첫 컬럼 오버레이 버튼 영역을 차단하는 것이 원인, 오버레이를 overflow-hidden 카드 밖 relative 래퍼 기준으로 이동, console.log 추가
- app/components/ui/Table.tsx: 정렬 설정 방식 팝업으로 완전 재구현 — 오버레이/useRef 방식 전부 제거, ⚙️ 클릭 시 팝업 표시(컬럼별 행+정렬 3버튼+강조), 팝업 외부 클릭 닫기, localStorage 저장, 테이블 본체 스타일 무변경
- app/admin/page.tsx: 이름 컬럼 정렬 미반영 수정 — renderUserCell "name" 케이스의 div.flex → div.inline-flex 변경 (block 레벨 flex는 td의 text-align에 반응하지 않아 정렬 변경이 시각적으로 반영되지 않았음)
- 공통 컴포넌트 모바일 터치 최적화: Input.tsx(size prop 추가, py-2→py-2.5, text-sm 제거), Button.tsx(active:scale/opacity 터치 피드백), login·register의 EyeToggle 버튼 44px 터치 영역 확보
- login/register 페이지 모바일 PWA 레이아웃 최적화: min-h-screen-dvh 적용, 모바일 bg-white(앱 느낌)/PC sm:bg-gray-50, Card→div 교체로 모바일 border·shadow 제거(sm: 복원), Input size="lg" 적용
- PC 로그인 페이지 문제 수정: globals.css의 .min-h-screen-dvh를 @layer utilities로 감싸기(Tailwind v4), 다크모드 자동감지 주석처리(라이트 고정), body background-color #ffffff 명시, html/body min-height 추가, login·register 패딩 sm:p-8 명시화
- PC 웹 + 모바일 PWA 전역 설정 추가
  - app/layout.tsx: viewport export 분리(Next.js 16 방식), metadata에 manifest·appleWebApp 추가
  - public/manifest.json 신규 생성 (name/short_name/display/icons 등 PWA 기본값)
  - app/globals.css: input font-size 16px(iOS 줌 방지), 터치 최적화(-webkit-tap-highlight), safe-area 유틸 클래스, dvh 유틸, PWA 미디어쿼리 추가
- app/board/_components/BoardFilter.tsx: 이제 기본값과 동일해진 theadClassName·rowDivide 명시 prop 제거
- app/globals.css: input/textarea/select font-size 16px 규칙을 !important + 구체적 선택자로 강화 (Tailwind text-sm이 적용돼도 16px 유지, iOS 자동 줌 완전 방지, checkbox·radio·file 제외)
- proxy.ts matcher 수정: 확장자 있는 정적 파일 전체 인증 체크 제외 (favicon\\.ico 단독 제외 → .*\\..* 패턴으로 통합)
- PC 터치 영역 1차 축소 (md: 접두사, 모바일 min-h-[44px] 유지)
  - admin/page.tsx 역할 select: md:min-h-[32px] md:px-2 md:py-1 md:text-xs 추가
  - admin/page.tsx 활성화 토글 버튼: md:min-h-[28px] 추가
  - admin/page.tsx 삭제 Button: md:min-h-[28px] 추가
  - CommentSection.tsx 답글 버튼: md:min-h-0 md:min-w-0 md:px-2 md:py-1 추가
  - CommentSection.tsx 댓글 삭제 버튼: md:min-h-0 md:min-w-0 md:px-2 md:py-1 추가
  - CommentSection.tsx 대댓글 삭제 버튼: md:min-h-0 md:min-w-0 md:px-2 md:py-1 추가
- PC 터치 영역 2차 축소 (md: 접두사, 모바일 min-h-[44px] 유지)
  - write/page.tsx 제목 Input: size="lg" → size="default" 변경
  - board/[id]/page.tsx 수정 Link 버튼: md:min-h-[36px] 추가
  - DeleteButton.tsx 삭제 버튼: md:min-h-[36px] 추가
  - CommentSection.tsx 답글 등록 버튼: md:min-h-[38px] 추가
  - CommentSection.tsx 댓글 등록 버튼: md:min-h-[38px] 추가
- PC 터치 영역 3차 마무리 (md: 접두사, 모바일 유지)
  - Tabs.tsx 탭 버튼: md:py-2 md:min-h-[36px] 추가
  - BoardFilter.tsx 필터 버튼: size="lg" → size="md" 변경
  - write/page.tsx 뒤로가기 아이콘 버튼: md:h-9 md:w-9 md:min-h-0 md:min-w-0 추가
- PC/모바일 디자인 이슈 수정
  - admin/page.tsx 계정관리 h1: pl-12 md:pl-0 추가 (모바일 햄버거 버튼 영역 확보, /board와 통일)
  - globals.css input/textarea/select font-size 16px !important 규칙을 @media (max-width: 767px)로 감싸기 (PC에서 Tailwind text-xs 등 정상 동작)
- 모바일/PC 추가 수정
  - board/page.tsx h1: pl-12 md:pl-0 제거 (햄버거 버튼은 헤더 영역 별개이므로 불필요)
  - admin/page.tsx h1: pl-12 md:pl-0 제거 (두 페이지 제목 좌측 정렬 통일)
  - admin/page.tsx 역할 select: md:text-xs → md:text-[11px], md:py-1 → md:py-0, md:h-7 추가 (PC 컴팩트)
- admin/page.tsx 역할 select md:text-[11px] → md:!text-[11px] 변경 (Tailwind ! = !important, JIT 미감지 또는 명시도 충돌 해결)
- Docker 배포 사전 설정
  - next.config.ts: output: 'standalone' 추가 (Docker 이미지 최적화)
  - .env.production.example 신규 생성 (키 목록 + 주석, git 커밋 대상)
  - .env.production 신규 생성 (실제 값 포함, git 제외)
  - .gitignore: .env.production 추가
  - .dockerignore 신규 생성 (빌드 제외 목록)
- Dockerfile 신규 생성 (multi-stage: deps → builder → runner, node:22-alpine, standalone 모드, nextjs 비권한 사용자)
- docker-compose.yml 신규 생성 (nextjs + postgres:16-alpine, healthcheck, postgres_data 볼륨, 포트 5433:5432)
- db/init.sql 신규 생성 (로컬 pg_dump --schema-only 추출, Docker 최초 실행 시 자동 테이블 생성)
- docker-compose.yml db 볼륨에 ./db/init.sql:/docker-entrypoint-initdb.d/init.sql 마운트 추가
- db/seed.sql 신규 생성 (page_permissions 초기 데이터, ON CONFLICT DO NOTHING 멱등성 보장)
- docker-compose.yml volumes 01-init.sql / 02-seed.sql 번호 접두사로 실행 순서 보장
- proxy.ts 인증 강화: JWT 검증 후 DB 조회 추가 (사용자 미존재 또는 is_deleted 시 토큰 삭제+/login 리다이렉트, is_active=false 동일, DB 오류 시 fail-open)
- LayoutProvider.tsx: useEffect 의존성 []→[pathname] (pathname 변경마다 /api/auth/me 재조회), handleLogout 추가 (setUser(null)+router.replace), Header에 onLogout prop 전달
- Header.tsx: HeaderProps에 onLogout 추가, handleLogout 성공 시 onLogout() 호출로 상태 초기화 위임
- .gitignore: postgres_data/ 추가 (Docker named volume 호스트 마운트 대비 명시적 제외)
- docker-compose.yml DB 인증 정보 환경변수 참조 방식으로 변경 (${POSTGRES_USER} 등, 하드코딩 제거)
- .env.production.example / .env.production에 POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB 항목 추가
- .env 심볼릭 링크 생성 (.env.production 가리킴, docker-compose 변수 보간 자동 인식용)
- PWA 아이콘 파일 배치 및 manifest.json 수정
  - app/: favicon.ico, icon0.svg, icon1.png, apple-icon.png 복사 (Downloads/favicon-for-app/)
  - public/: web-app-manifest-192x192.png, web-app-manifest-512x512.png 복사 (Downloads/favicon-for-public/)
  - public/manifest.json icons src 경로 수정 (/icons/icon-*.png → /web-app-manifest-*x*.png)
  - public/icons/ 폴더 정리
- 계정관리 테이블 모바일 카드형 전환 (app/admin/page.tsx): md 미만에서 카드 리스트, md 이상은 AlignableTable 유지
- 계정관리 페이지 터치 영역 44px 일괄 수정
  - admin/page.tsx: 역할 select min-h-[44px], 활성화 버튼 min-h-[44px], 삭제 버튼 min-h-[44px], ToggleSwitch wrapper min-h-[44px], 이메일 max-w-[200px] sm:max-w-[160px]
  - Tabs.tsx: 탭 버튼 py-3 min-h-[44px]
  - Modal.tsx: 확인/취소 버튼 size="lg"
- 모바일 터치 영역 44px 일괄 수정
  - LikeButtons.tsx: 좋아요/싫어요 버튼 min-h-[44px] 추가
  - CommentSection.tsx: 답글/삭제 버튼 min-h-[44px]+px-3 py-2, 등록 버튼 min-h-[44px], 답글 input text-sm 제거, px-8→px-4 sm:px-6
  - BoardFilter.tsx: 필터 버튼 size="md"→size="lg"
  - write/page.tsx: 뒤로가기 버튼 h-9 w-9→min-h-[44px] min-w-[44px], Input size="lg"
  - board/[id]/page.tsx: 수정 버튼 min-h-[36px]→min-h-[44px]
  - Header.tsx: 햄버거 버튼 h-9 w-9→min-h-[44px] min-w-[44px], 모바일 드로어 링크 py-2→py-3
- PC/모바일 비정상 스크롤 일괄 수정 (LayoutProvider의 main이 overflow-auto 스크롤 영역이므로 내부 페이지는 min-h-screen 사용 금지)
  - app/board/page.tsx: 외곽 div min-h-screen → min-h-full
  - app/board/[id]/edit/page.tsx: 외곽 div min-h-screen → min-h-full, textarea rows={12} → rows={10}
  - app/board/write/page.tsx: textarea rows={14} → rows={10}
  - login/register/unauthorized: LayoutProvider 밖(AUTH_PATHS)이므로 min-h-screen-dvh 유지

## 2026-05-12

- 프로젝트명 all_is_well → manwol_mes 일괄 변경
  - package.json name 필드
  - .env.local DATABASE_URL DB명
  - .env.production POSTGRES_DB, DATABASE_URL DB명
  - AGENTS.md 프로젝트명
  - PROMPTS.md 내 모든 언급
- JWT 쿠키 secure 옵션을 NODE_ENV 기반에서 COOKIE_SECURE 환경변수 기반으로 변경
  - app/api/auth/login/route.ts, register/route.ts, logout/route.ts 3개 파일
  - 기존: secure: process.env.NODE_ENV === "production"
  - 변경: secure: process.env.COOKIE_SECURE === "true"
  - 목적: HTTP 환경(EC2)에서도 쿠키 작동 가능하도록 배포 환경별 제어
- COOKIE_SECURE=false 환경변수 추가 및 이미지 재빌드·재배포
  - 로컬 .env.production, EC2 ~/manwol_mes/.env.production에 COOKIE_SECURE=false 추가
  - 멀티 플랫폼(amd64+arm64) 이미지 재빌드 후 Docker Hub 푸시
  - EC2 docker compose pull + up -d 로 재배포

---

## 2026-05-12 (오후 세션) - EC2 배포 + 로그인 401 디버깅

### 작업 1: 프로젝트명 변경 (all_is_well → manwol_mes)
- 목표: 프로젝트명 통일
- 진행: GitHub 레포명, 로컬 폴더명, DB명, Docker Hub 레포명 모두 변경
- 결과: 완료

### 작업 2: Docker 멀티 플랫폼 이미지 빌드
- 목표: M1 Mac(arm64) + EC2(amd64) 양쪽 지원
- 진행:
  - docker buildx create --name multiplatform --use
  - docker buildx build --platform linux/amd64,linux/arm64 --push
- 결과: dongju9302/manwol_mes:latest 멀티 플랫폼 manifest 완성
- 학습: buildx는 표준 방식, M1에서 amd64 빌드 시 에뮬레이션 사용

### 작업 3: EC2 정리 및 파일 배치
- 목표: 기존 all_is_well 잔재 제거 후 manwol_mes 폴더 구성
- 진행:
  - EC2 ~/all_is_well 폴더 삭제 (DB 데이터 없음 확인 후)
  - ~/manwol_mes 폴더 생성
  - scp로 docker-compose.yml, .env.production, db/init.sql, db/seed.sql 전송
  - db 폴더 마운트 경로 일치 확인
- 결과: 컨테이너 정상 기동

### 작업 4: docker-compose.yml build → image 방식 전환
- 목표: EC2에서 빌드 부담 제거 (t3.micro RAM 1GB 제약)
- 진행: nextjs 서비스의 build: 블록 제거 → image: dongju9302/manwol_mes:latest
- 결과: EC2는 pull만, 빌드는 로컬/Actions에서

### 작업 5: 로그인 401 에러 디버깅
- 증상: EC2에서 로그인 시 401 Unauthorized 응답
- 진단 과정:
  1. 보안그룹 의심 (X - 페이지 접속/회원가입 정상이므로 포트는 열림)
  2. 환경변수 차이 의심 (X - diff 결과 완전 동일)
  3. bcrypt 직접 검증으로 비번 일치 여부 확인 → Match: false (오타로 판명)
  4. 비번 재입력 후 재가입 → 200 OK로 변경
  5. 그런데도 로그인 화면 머무름 → Application 탭 쿠키 확인
  6. 원인: 쿠키 Secure: ✓ 옵션이 HTTP 환경에서 차단
- 해결:
  - login/register/logout route.ts 3개 파일에서
  - secure: process.env.NODE_ENV === "production"
  - → secure: process.env.COOKIE_SECURE === "true" 변경
  - 로컬/EC2 .env.production에 COOKIE_SECURE=false 추가
  - 이미지 재빌드 + 푸시 + EC2 재배포
- 결과: ✅ 로그인 성공, /board 페이지 정상 이동
- 학습:
  - 쿠키 Secure 옵션은 HTTPS 전용 (localhost만 예외)
  - bcrypt 직접 검증이 비번 인증 디버깅의 결정타
  - DevTools Network/Application 탭이 401 디버깅 필수

### 다음 단계
- CLAUDE.md 규칙 보완 (PROMPTS.md 기록 범위 확장)
- GitHub Actions CI/CD 자동화

### 작업 6: GitHub Actions 자동 배포 워크플로우 작성
- 목표: main 브랜치 push 시 자동 빌드 → Docker Hub 푸시 → EC2 배포
- 진행:
  - EC2에 deploy.sh 생성 (/home/ubuntu/manwol_mes/deploy.sh, chmod +x)
  - .github/workflows/deploy.yml 생성 (5단계 워크플로우)
    - Checkout → Buildx 설정 → Docker Hub 로그인 → 이미지 빌드+푸시 → EC2 SSH 배포
  - 필요한 GitHub Secrets: DOCKERHUB_USERNAME, DOCKERHUB_TOKEN, EC2_HOST, EC2_SSH_KEY
- 결과: 워크플로우 파일 생성 완료, GitHub Secrets 등록 후 동작 예정

## 2026-05-13

### 작업 1: 게시판 목록 캐싱 문제 해결 (bfcache + force-dynamic)
- 목표: 뒤로가기로 돌아와도 조회수/좋아요 수가 즉시 반영되도록
- 수정 내용:
  - app/board/page.tsx: export const dynamic = "force-dynamic" 추가
  - app/board/[id]/page.tsx: export const dynamic = "force-dynamic" 추가
  - app/board/_components/RefreshOnBack.tsx 신규 생성 (pageshow 이벤트로 bfcache 감지 후 router.refresh())
  - app/board/page.tsx: RefreshOnBack 컴포넌트 JSX 최상단에 삽입

### 작업 8: 게시판 조회수 기능 재추가 (Phase 2)
- posts.view_count 컬럼 기존 존재, DB 변경 없음
- 상세 페이지: UPDATE RETURNING으로 +1 후 최신값 표시 (본인 제외)
- 목록: SELECT + 컬럼 + 모바일 카드에 조회수 표시
- BFCache 우회 코드 일절 없음 (새로고침/재클릭 시 반영)

### 작업 7: 게시판 조회수(view_count) 기능 코드 완전 제거
- app/board/page.tsx: 주석·SELECT 쿼리에서 view_count 제거
- app/board/[id]/page.tsx: view_count UPDATE 로직 제거, 주석 수정
- app/board/_components/BoardFilter.tsx: Post 타입, 컬럼 정의, 셀 렌더링, 모바일 카드에서 제거
- app/api/posts/[id]/route.ts: PostDetailRow 타입, SELECT 쿼리에서 제거

### 작업 6: 로그인 페이지 이메일 저장 기능 추가
- app/login/page.tsx: useEffect + localStorage로 이메일 저장/불러오기, 체크박스 UI 추가
- 로그인 성공 시점에만 저장/삭제 처리 (실패한 이메일 저장 방지)

### 작업 5: JWT 만료 1일로 단축 + 회원가입 비밀번호 복잡도 검증 추가
- login/route.ts, register/route.ts: JWT_EXPIRES_IN "7d" → "1d", COOKIE_MAX_AGE 7일 → 1일
- register/route.ts: validatePasswordComplexity() 헬퍼 추가 (영문/숫자/특수문자 2종류 이상)
- login/route.ts에는 복잡도 검증 미추가 (기존 사용자 로그인 차단 방지)

### 작업 4: 조회수 갱신 진짜 원인 해결 + RefreshOnBack 제거
- 진짜 원인: BoardFilter의 useState<Post[]>(posts)가 최초 마운트 시 1회만 초기화되어 이후 서버에서 새 props를 내려도 무시
- 해결: useEffect(() => { setPostList(posts); }, [posts]) 추가로 props 변경 시 state 동기화
- 제거: RefreshOnBack.tsx 삭제, board/page.tsx에서 import·JSX 제거 (근본 해결로 불필요해짐)
- 유지: force-dynamic (서버가 매 요청마다 DB 최신 조회하도록)

### 작업 3: RefreshOnBack 코드 정리 (프로덕션 정리)
- console.log 3개 제거, visibilitychange 리스너(동작 없음) 제거
- popstate + location.reload() 핵심 로직만 유지

### 작업 2: RefreshOnBack bfcache 복원 방식 변경
- 기존: router.refresh() — bfcache 복원 직후 RSC 머지 불안정
- 변경: window.location.reload() — 페이지 전체 강제 갱신으로 확실히 최신 데이터 반영
- useRouter import 제거 (의존성 단순화)

### 작업 7: is_deleted 필터 누락 버그 일괄 수정 + 디버그 로그 정리
- 목표: Soft Delete된 게시글이 목록/상세/좋아요에 노출되는 버그 수정
- 진단: board/page.tsx(목록)·board/[id]/page.tsx(상세)·likes/route.ts에 is_deleted=false 조건 누락 확인
- 수정 파일 5개:
  - app/board/page.tsx: GROUP BY 앞에 WHERE p.is_deleted = false 추가
  - app/board/[id]/page.tsx: WHERE p.id = $1 → WHERE p.id = $1 AND p.is_deleted = false
  - app/api/posts/[id]/likes/route.ts: WHERE id = $1 → WHERE id = $1 AND is_deleted = false
  - app/api/posts/[id]/route.ts: [DELETE DEBUG] console.log 4줄 제거
  - app/board/_components/BoardFilter.tsx: deletePosts를 Promise.allSettled로 교체, 실패 항목 UI 유지