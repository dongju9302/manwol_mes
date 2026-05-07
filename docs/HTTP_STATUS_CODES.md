# HTTP 상태 코드 정리

> 전체 공식 목록: https://developer.mozilla.org/ko/docs/Web/HTTP/Status

---

## 1xx (정보)
- 100 Continue: 요청 진행 중, 계속 보내도 됨
- 101 Switching Protocols: 프로토콜 전환 중

## 2xx (성공)
- 200 OK: 요청 성공 (조회, 로그인 등 일반적인 성공)
- 201 Created: 새로운 데이터 생성 성공 (회원가입 등)
- 202 Accepted: 요청 접수됐지만 처리는 나중에
- 204 No Content: 성공했지만 응답 데이터 없음 (삭제 등)

## 3xx (리다이렉트 - 다른 곳으로 이동)
- 301 Moved Permanently: 주소가 영구적으로 바뀜
- 302 Found: 주소가 임시로 바뀜
- 304 Not Modified: 캐시된 데이터 그대로 사용

## 4xx (클라이언트 오류 - 요청이 잘못됨)
- 400 Bad Request: 잘못된 요청 (필수값 누락, 형식 오류)
- 401 Unauthorized: 인증 실패 (비밀번호 틀림, 토큰 없음)
- 403 Forbidden: 권한 없음 (접근 불가 페이지)
- 404 Not Found: 존재하지 않는 리소스
- 405 Method Not Allowed: 허용되지 않는 HTTP 메서드
- 408 Request Timeout: 요청 시간 초과
- 409 Conflict: 충돌 (이메일 중복 등)
- 410 Gone: 리소스가 영구적으로 삭제됨
- 422 Unprocessable Entity: 형식은 맞지만 내용이 잘못됨
- 429 Too Many Requests: 요청 횟수 초과 (도배 방지)

## 5xx (서버 오류)
- 500 Internal Server Error: 서버 내부 오류
- 501 Not Implemented: 서버가 기능을 지원하지 않음
- 502 Bad Gateway: 서버가 잘못된 응답을 받음
- 503 Service Unavailable: 서버 점검 중 or 과부하
- 504 Gateway Timeout: 서버 응답 시간 초과

---

## 우리 프로젝트 사용 현황
| API | 상태코드 | 상황 |
|-----|---------|------|
| /api/auth/register | 201 | 회원가입 성공 |
| /api/auth/register | 400 | 필수값 누락 |
| /api/auth/register | 409 | 이메일 중복 |
| /api/auth/register | 500 | 서버 오류 |
| /api/auth/login | 200 | 로그인 성공 |
| /api/auth/login | 400 | 필수값 누락 |
| /api/auth/login | 401 | 비밀번호 틀림 |
| /api/auth/login | 404 | 이메일 없음 |
| /api/auth/login | 500 | 서버 오류 |
