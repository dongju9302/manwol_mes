-- 시스템 초기 데이터: 페이지 권한 설정
-- ON CONFLICT DO NOTHING: 이미 같은 page_path 가 있으면 무시 (멱등성 보장, 재실행 안전)

INSERT INTO public.page_permissions (page_path, page_name, admin_access, user_access) VALUES
  ('/board', '게시판', true,  true),
  ('/admin', '계정관리', false, false)
ON CONFLICT (page_path) DO NOTHING;
