import pool from "@/lib/db";

// posts, comments, post_likes 테이블 생성 마이그레이션
// 실행 명령어: npx ts-node lib/db/migrate_posts.ts
async function migrate(): Promise<void> {
  // 트랜잭션으로 묶어 중간 실패 시 전체 롤백
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 게시글 테이블: 작성자(user_id)가 삭제되면 게시글도 삭제 (ON DELETE CASCADE)
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title      VARCHAR(255) NOT NULL,
        content    TEXT         NOT NULL,
        created_at TIMESTAMP    DEFAULT NOW(),
        updated_at TIMESTAMP    DEFAULT NOW()
      )
    `);

    // 댓글 테이블: parent_id가 NULL이면 최상위 댓글, 값이 있으면 대댓글
    // 부모 댓글 삭제 시 대댓글도 자동 삭제 (ON DELETE CASCADE)
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id         SERIAL    PRIMARY KEY,
        post_id    INTEGER   NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
        user_id    INTEGER   NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        parent_id  INTEGER            REFERENCES comments(id) ON DELETE CASCADE,
        content    TEXT      NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 좋아요/싫어요 테이블: 사용자당 게시글 하나에 하나의 반응만 허용 (UNIQUE 제약)
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id         SERIAL      PRIMARY KEY,
        post_id    INTEGER     NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       VARCHAR(10) NOT NULL CHECK (type IN ('like', 'dislike')),
        created_at TIMESTAMP   DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      )
    `);

    await client.query("COMMIT");
    console.log("마이그레이션 완료: posts, comments, post_likes 테이블 생성");
  } catch (error) {
    // 오류 발생 시 전체 롤백하여 부분 생성 방지
    await client.query("ROLLBACK");
    console.error("마이그레이션 실패:", error);
    throw error;
  } finally {
    // 연결 반환 (Pool에 재사용 가능하도록)
    client.release();
  }
}

migrate().catch(() => process.exit(1));
