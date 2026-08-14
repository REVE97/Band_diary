APP : <a href="https://band-diary.vercel.app">Bandiary</a>  
TEST ACCOUNT : test / 1234

<img width="800" height="450" alt="인트로" src="https://github.com/user-attachments/assets/b2a8f441-3a84-4422-bda7-d83d2db18117" />

# 🎸 Bandiary

> Current Version: 'v.0.3.4'

밴드 활동을 기록하고 관리할 수 있는 모바일 중심 웹앱입니다. ( 테스트 시 모바일 환경을 권장합니다. )
사용자는 자신의 밴드 프로필을 설정하고, 사진과 영상을 업로드하여 활동 기록을 남길 수 있습니다.<br />
또한 합주실, 식당 등의 장소 정보를 관리하고, 세션별 PDF 악보를 등록해 연습 자료로 활용할 수 있습니다.

## 📌 프로젝트 소개

`Bandiary`는 Band + Diary의 의미를 담은 밴드 활동 기록 서비스입니다.
밴드 멤버가 공연 사진, 합주 영상, 악보 PDF, 연습 장소 정보를 한 곳에서 관리할 수 있도록 제작했습니다.

모바일 환경에서 앱처럼 사용할 수 있도록 PWA 적용을 고려했으며, Supabase를 활용해 별도의 백엔드 서버 없이 데이터베이스와 파일 스토리지를 연동했습니다.

## ✨ 주요 기능

### 1. 로그인 / 회원가입

* Supabase 기반 로그인
* 회원가입 시 아이디, 패스워드, 사용자 이름 저장
* unique 제약조건을 통한 중복 가입 방지

### 2. 프로필 관리

* 사용자 이름, 밴드명, 메인 세션, 서브 세션 수정
* 프로필 이미지 업로드
* 기존 프로필 이미지 변경 시 Supabase Storage 파일 정리

### 3. 콘텐츠 관리

* 사진 / 비디오 / 오디오 콘텐츠 업로드
* Supabase Storage에 이미지, 영상, 오디오 파일 저장 (영상 30MB 제한 설정)
* 전체보기 / 비디오 / 사진 / 오디오 필터링
* 최신 등록순 카드 정렬
* 상세 모달에서 이미지, 영상, 오디오 확인
* 댓글 등록 가능

### 4. 장소 관리

* 스튜디오 / 식당 장소 정보 등록
* 카카오맵 API를 이용한 지도 표시
* 장소명 기반 위도 / 경도 입력
* 카카오맵 길찾기 연결

### 5. 악보 관리

* PDF 악보 업로드
* Vocal, Guitar, Bass, Keyboard, Drum 세션별 필터링
* PDF 미리보기 및 다운로드

### 6. 일정 관리

* FullCalendar 라이브러리 사용하여 일정 관리
* 밴드 일정 · 공연 일정 · 회의 일정 등을 추가·삭제

### 7. 공지사항 및 메모 - v0.3.0 업데이트

* 밴드 공지사항 및 메모 관리
* 중요 공지, 전체 목록 분리 후 필터링

### 8. 관리자 기능

* 콘텐츠 삭제
* 댓글 삭제
* 악보 삭제

## 🛠 기술 스택

### Frontend

* React
* JavaScript
* React Router
* Vite

### Backend / Database

* Supabase Database
* Supabase Storage

### Library

* react-pdf
* pdfjs-dist
* Kakao Map API
* FullCalendar
* FFmpeg

### Deploy

* Vercel

### AI

* Codex 프로젝트 적용 테스트 예정

### Function Test

* Microsoft Clarity

## 📦 Version History

### v0.4.0 - 2026.08.14 ~ Present
* 기존 일정 관리 페이지에 대한 리뉴얼

### v0.3.2 - 2026.08 ~ 2026.08.11
* 밴드 공지사항 및 메모 기능 추가

#### v0.3.3 - 2026.08.12
- 공지사항 및 메모 필터링 기능 추가
- 공지사항 및 메모 수정 기능 추가

#### v0.3.4 - 2026.08.12 ~ 2026.08.13
- 메인페이지 세션파트 카드 제거
- 메인페이지 레이아웃 UI / UX 개선
- 프로필 수정 모달 레이아웃 개선
- 콘텐츠 UI / UX 개선

### v0.2.0 - 2026.06 ~ 2026.07
* 사진 / 비디오 / 오디오 업로드 기능 추가 ( Supabase Storage 연동 )
* 댓글 기능 추가
* 일정 관리 기능 추가 ( FullCalendar 적용 )
* 콘텐츠 UI 개선

### v0.1.0 - 2026.05
* 프로젝트 초기 세팅
* 로그인 / 회원가입
* 프로필 관리
* 장소 및 악보 관리

## ✅ 향후 개선 사항

* Supabase Auth 기반 로그인 구조로 변경
* 비밀번호 암호화 또는 인증 시스템 개선
* 관리자 권한을 프론트엔드가 아닌 Supabase RLS 정책으로 관리
* 사용자별 콘텐츠 분리 조회 기능 추가
