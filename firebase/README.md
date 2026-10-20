# Firebase 보안 규칙

비밀번호 잠금은 로그인해서 받은 출입증(토큰)을 모든 데이터 요청에 붙여 보낸다 (`index.html`의 `curl`).
하지만 실제로 막는 건 Firebase 쪽 규칙이다. 규칙이 열려 있으면 잠금 화면은 겉모습일 뿐이고,
데이터베이스 주소만 알면 누구나 일기·예산·사진을 읽고 지울 수 있다.

`database.rules.json`은 다음만 허용한다.

- `rooms/` 아래만 읽고 쓸 수 있다 (앱이 쓰는 곳은 `rooms/<방>/data`, `updatedAt`, `imgs`, `imgsOrphan` 뿐).
- 그것도 `us@to-in-one.app` 계정으로 로그인한 경우에만. `auth != null`만 쓰지 않는 이유:
  Firebase는 기본으로 아무나 웹 API 키로 새 계정을 만들 수 있어서, 로그인만 확인하면 남이 만든 계정도 통과한다.

## 적용하기

1. [Firebase 콘솔](https://console.firebase.google.com/project/to-in-one-82b37/database) → Realtime Database → **규칙** 탭
2. 지금 들어 있는 내용을 `database.rules.json` 내용으로 바꾸고 **게시**
3. Authentication → **설정** → 사용자 작업 → **사용자 계정 생성(가입) 허용** 끄기 (있으면). 위 규칙만으로도 막히지만, 쓸데없는 계정이 생기지 않게 한다.

## 잘 막혔는지 확인하기

로그인하지 않은 브라우저(시크릿 창)에서 아래 주소를 연다. `<DB 주소>`와 `<방>`은 앱의 공유·백업 화면에 있는 값.

```
<DB 주소>/rooms/<방>/updatedAt.json
```

- `"Permission denied"`가 나오면 잠긴 것.
- 숫자나 `null`이 나오면 아직 열려 있는 것. 규칙이 게시됐는지 다시 확인.

규칙을 바꾼 뒤에도 앱은 그대로 동기화돼야 한다 (화면 위 동기화 표시가 정상).
동기화 오류가 나면 앱에 로그인한 계정의 이메일이 `index.html`의 `LOCK.email`과 같은지 확인.
