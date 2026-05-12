<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 프로젝트 개요
- 프로젝트명: manwol_mes
- 프레임워크: Next.js 16 (TypeScript, Tailwind, App Router)
- 목표: 이메일 + 비밀번호 로그인 기능 구현 후 GitHub 연동 및 Vercel 배포
- DB: users.json (학습용)
- 인증: JWT + 쿠키 방식
- 비밀번호 암호화: bcrypt