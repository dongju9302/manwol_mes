# ===================================
# Stage 1: Dependencies 설치
# ===================================
FROM node:22-alpine AS deps
WORKDIR /app

# package.json, package-lock.json 만 먼저 복사
# (의존성 변경 없으면 캐시 활용으로 빌드 속도 향상)
COPY package*.json ./

# 의존성 설치
RUN npm ci

# ===================================
# Stage 2: 빌드
# ===================================
FROM node:22-alpine AS builder
WORKDIR /app

# Stage 1 에서 설치한 node_modules 복사
COPY --from=deps /app/node_modules ./node_modules

# 전체 코드 복사 (.dockerignore 에 정의된 파일은 제외됨)
COPY . .

# Next.js 빌드 (standalone 모드로 .next/standalone 생성)
RUN npm run build

# ===================================
# Stage 3: 실행 (Runner)
# ===================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 보안: 별도의 비권한 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 빌드 결과만 복사 (소스 코드, devDependencies 미포함)
# - .next/standalone: 실행에 필요한 최소 파일
# - .next/static: 정적 파일
# - public: 정적 자산 (이미지, manifest 등)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 일반 유저로 전환
USER nextjs

# 컨테이너가 노출하는 포트
EXPOSE 3000

# 컨테이너 시작 시 실행할 명령
# standalone 모드는 server.js 를 자동 생성함
CMD ["node", "server.js"]
