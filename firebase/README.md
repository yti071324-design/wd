# Firebase 보안 규칙

비밀번호 잠금은 로그인해서 받은 출입증(토큰)을 모든 데이터 요청에 붙여 보낸다 (`index.html`의 `curl`).
하지만 실제로 막는 건 Firebase 쪽 규칙이다. 규칙이 열려 있으면 잠금 화면은 겉모습일 뿐이고,
데이터베이스 주소만 알면 누구나 일기·예산·사진을 읽고 지울 수 있다.

`database.rules.json`은 다음만 허용한다.

- `rooms/` 아래만 읽고 쓸 수 있다 (앱이 쓰는 곳은 `rooms/<방>/data`, `updatedAt`, `imgs`, `imgsOrphan` 뿐).
- 그것도 `toinone4321@gmail.com` 계정으로 로그인한 경우에만. `auth != null`만 쓰지 않는 이유:
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

## 웹 API 키 (GitHub "Secret scanning" 경고)

`index.html`의 `LOCK.apiKey`(AIza…)는 Firebase **웹 API 키**다. 브라우저에서 로그인하려면 반드시 페이지에 들어 있어야 해서
숨길 수 없고, 숨길 필요도 없다 (비밀번호가 아니라 "이 앱은 어느 Firebase 프로젝트 것"이라는 이름표).
데이터는 위 규칙 + 비밀번호 로그인이 지킨다. 키를 바꿔도(재발급) 새 키 역시 공개되므로 의미가 없다.

대신 이 키를 **다른 용도로 못 쓰게 제한**한다. 같은 프로젝트에 지도 같은 유료 API가 켜져 있으면
제한 없는 키로 남이 그 API를 써서 요금이 나올 수 있기 때문.

1. [Google Cloud 콘솔 → 사용자 인증 정보](https://console.cloud.google.com/apis/credentials?project=to-in-one-82b37)
2. 끝이 `…GbGbm9c`인 키(이름: Browser key (auto created by Firebase)) 클릭
3. **애플리케이션 제한사항** → 웹사이트 → `https://yti071324-design.github.io/*` 추가
4. **API 제한사항** → 키 제한 → `Identity Toolkit API`, `Token Service API` 두 개만 선택 → 저장
5. 몇 분 뒤 앱에서 "이 기기 잠그기" → 비밀번호로 다시 들어가지는지 확인
6. GitHub 경고는 **Close as → Won't fix** (메모: Firebase 웹 키, 공개용·사이트/API 제한 적용)

앱이 쓰는 구글 주소: `identitytoolkit.googleapis.com`(로그인), `securetoken.googleapis.com`(로그인 유지).
데이터베이스(`firebaseio.com`)는 API 키가 아니라 로그인 토큰으로 접근한다.

## 로그인 계정 이메일

예전 로그인 이메일 `us@to-in-one.app`은 아무도 등록하지 않은 도메인이라, 누가 그 도메인을 사서 비밀번호 재설정 메일을 받으면
계정을 가져갈 수 있었다. 그래서 두 사람이 관리하는 Gmail(`toinone4321@gmail.com`, 2단계 인증 필수)로 옮겼다.
앱의 `LOCK.email`, 이 규칙 파일, Firebase 콘솔 규칙의 이메일이 모두 같아야 한다.
이 Gmail 계정이 곧 앱의 열쇠다 (재설정 메일이 여기로 온다).
