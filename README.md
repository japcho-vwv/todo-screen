# 할일 데스크탑 앱

React + Vite + Electron으로 만든 할 일 관리 앱입니다.

---

## ✅ 빠른 배포 가이드 (GitHub 자동 빌드)

Node.js 설치 없이 GitHub에 코드만 올리면
Windows / macOS / Linux 설치 파일이 자동으로 만들어집니다.

---

### STEP 1 — GitHub 계정 만들기

1. https://github.com 접속
2. 우측 상단 Sign up 클릭
3. 이메일, 비밀번호, 사용자명 입력 후 가입

---

### STEP 2 — 새 저장소(Repository) 만들기

1. 로그인 후 우측 상단 + 버튼 → New repository
2. 설정:
   - Repository name: todo-app (원하는 이름)
   - 공개 여부: Public (배포할 경우 Public 권장)
   - 나머지는 기본값 그대로
3. Create repository 클릭

---

### STEP 3 — 코드 올리기

저장소를 만들면 빈 페이지가 나옵니다.
"uploading an existing file" 링크를 클릭하세요.

1. 이 ZIP 파일을 압축 해제합니다
2. 압축 해제된 todo-electron 폴더 안의 파일 전체를 끌어다 놓기(드래그 앤 드롭)

올려야 할 파일/폴더:
  .github/
  electron/
  src/
  index.html
  package.json
  vite.config.js
  README.md
  .gitignore

3. 페이지 아래 Commit changes 버튼 클릭

※ .github 폴더가 숨김 폴더일 수 있습니다.
  Windows: 파일 탐색기 → 보기 → 숨김 항목 체크
  macOS: Finder에서 Cmd+Shift+. 로 숨김 파일 표시

---

### STEP 4 — 빌드 실행 (태그 붙이기)

GitHub에서 새 버전 태그를 만들면 자동 빌드가 시작됩니다.

1. 저장소 페이지 오른쪽 Releases 클릭
2. Create a new release 클릭
3. Choose a tag 입력란에 v1.0.0 입력 → Create new tag 선택
4. Release title: 할일앱 v1.0.0
5. Publish release 클릭

→ 자동으로 빌드가 시작됩니다! (약 5~10분 소요)

---

### STEP 5 — 빌드 완료 확인

1. 저장소 상단 Actions 탭 클릭
2. 빌드 진행 중: 노란 원, 완료: 초록 체크
3. 완료 후 Releases 탭으로 이동
4. 아래에 설치 파일들이 자동으로 첨부됩니다:
   - 할일앱 Setup 1.0.0.exe  → Windows 설치파일
   - 할일앱-1.0.0.dmg        → macOS 설치파일
   - 할일앱-1.0.0.AppImage   → Linux 실행파일

---

### STEP 6 — 배포

Releases 페이지 URL을 공유하면 누구나 다운로드 가능합니다.

  https://github.com/[내아이디]/[저장소이름]/releases

---

## 앱 업데이트 방법

앱을 수정하고 싶을 때:

1. GitHub 저장소에서 수정할 파일 클릭 → 연필(편집) 아이콘
2. 수정 후 Commit changes
3. 새 Release를 v1.0.1, v1.1.0 등으로 만들면 자동 재빌드

---

## 로컬에서 직접 빌드하려면 (선택사항)

Node.js 18+ 설치 후:

  npm install
  npm start              # 개발 모드 실행
  npm run package:win    # Windows .exe 생성
  npm run package:mac    # macOS .dmg 생성
  npm run package:linux  # Linux .AppImage 생성

빌드 결과물은 dist-app/ 폴더에 생성됩니다.

---

## 자주 묻는 문제

Q. Actions 탭에서 빌드가 실패해요
A. Actions 탭 → 실패한 항목 클릭 → 로그 확인.
   잠시 후 Releases를 다시 만들어 재시도하면 대부분 해결됩니다.

Q. Windows에서 "알 수 없는 게시자" 경고가 떠요
A. 코드 서명 인증서가 없어서 나오는 정상 경고입니다.
   "추가 정보" → "실행" 클릭하면 설치됩니다.

Q. macOS에서 "손상된 파일" 오류가 떠요
A. 터미널에서 실행:
   xattr -cr /Applications/할일앱.app
