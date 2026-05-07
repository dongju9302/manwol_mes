import { Pool } from "pg";

// 개발 환경의 핫 리로드 시 Pool이 중복 생성되지 않도록 global 객체에 저장
// Next.js 개발 서버는 파일 변경마다 모듈을 재실행하므로, global로 관리해야 연결이 누적되지 않음
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

// 이미 생성된 Pool이 있으면 재사용, 없으면 새로 생성
const pool: Pool =
  global.pgPool ??
  new Pool({
    // .env.local의 DATABASE_URL을 사용 (postgresql://host:port/dbname 형식)
    connectionString: process.env.DATABASE_URL,
  });

// 개발 환경에서만 global에 저장 (프로덕션은 모듈이 한 번만 로드되므로 불필요)
if (process.env.NODE_ENV !== "production") {
  global.pgPool = pool;
}

export default pool;
