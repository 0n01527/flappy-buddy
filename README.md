# Flappy Buddy

기둥 사이로 버디를 안전하게 날려보내는 미니 웹 게임입니다. 순수 HTML/CSS/JavaScript로만 만들어져 있어 별도 설치 없이 브라우저에서 바로 실행됩니다.

## 실행 방법

`index.html` 파일을 브라우저로 열면 바로 플레이할 수 있습니다.

```bash
# 간단한 로컬 서버로 실행하고 싶다면 (선택 사항)
python3 -m http.server 8000
# 이후 브라우저에서 http://localhost:8000 접속
```

## 조작 방법

- `Space` 키, 마우스 클릭, 또는 화면 탭: 날갯짓(flap)
- 시작 화면에서 "시작하기" 버튼으로 게임 시작
- 게임 오버 후 "다시 도전" 버튼으로 재시작
- 최고 점수는 브라우저의 `localStorage`에 저장됩니다

## 파일 구조

```
flappy-buddy/
├── index.html   # 화면 구조, 시작/게임오버 오버레이
├── style.css    # 비주얼 스타일 (황혼 하늘 팔레트)
└── game.js      # 게임 루프, 물리, 충돌, 점수 로직
```

## 커밋 히스토리

기능 단위로 나누어 커밋했습니다.

1. `Initial scaffold` — HTML/CSS 뼈대
2. `Add buddy character rendering and flap physics` — 캐릭터와 중력/날갯짓
3. `Add pillar obstacle spawning and scrolling` — 기둥 장애물 생성/스크롤
4. `Add collision detection, scoring, and start/game-over flow` — 충돌 판정, 점수, 상태 전환
5. `Polish visuals` — 별, 달, 배경 디테일
