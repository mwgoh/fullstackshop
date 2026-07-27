# tasks/

이 디렉터리는 `fullstackshop` 프로젝트의 작업 진행 상황을 추적하기 위한
`tasks.json` 하나로 구성됩니다. 요구사항 원문은 `../initial.md`에 있고,
`tasks.json`은 그 요구사항을 실행 가능한 작업 단위로 쪼갠 결과물입니다.

## tasks.json 구조

```json
{
  "project": "fullstackshop",
  "source": "initial.md",
  "lastUpdated": "YYYY-MM-DD",
  "activeTaskId": "8.3",
  "notes": ["..."],
  "statusValues": ["pending", "in_progress", "done", "blocked"],
  "tasks": [
    {
      "id": "1",
      "title": "...",
      "status": "done",
      "description": "...",
      "dependencies": ["..."],
      "subtasks": [
        { "id": "1.1", "title": "...", "status": "done", "description": "..." }
      ]
    }
  ]
}
```

- **project / source**: 프로젝트 이름과 요구사항 원문 파일.
- **lastUpdated**: `tasks.json`을 마지막으로 갱신한 날짜.
- **activeTaskId**: 현재 진행 중인(다음에 이어서 볼) task/subtask id.
- **notes**: 스키마 설계 원칙, 작업 중 발견한 특이사항, 사용자 액션이 필요했던
  이력 등 작업 전반에 걸쳐 참고할 내용을 시간순으로 누적.
- **statusValues**: task/subtask의 `status`가 가질 수 있는 값.
  - `pending`: 아직 시작 안 함
  - `in_progress`: 진행 중
  - `done`: 완료
  - `blocked`: 외부 요인(주로 사용자 액션)으로 막혀 있음
- **tasks[].dependencies**: 선행되어야 하는 다른 task의 id 목록.
- **tasks[].subtasks**: 세부 작업 단위. 최상위 task의 `status`는 하위
  subtask들의 진행 상황을 반영해 갱신한다.

## 사용 규칙

- 작업을 시작하거나 완료할 때마다 해당 task/subtask의 `status`와
  `activeTaskId`를 갱신한다.
- 외부 요인(예: 사용자가 API 키를 발급해야 하는 경우)으로 더 진행할 수 없으면
  `status: "blocked"`로 표시하고 `description`에 무엇이 필요한지 남긴다.
- 막힌 작업이 있어도 의존성이 없는 다른 task로 넘어가 계속 진행한다.
- Convex 관련 설계 원칙(시스템 필드, 외래키, 별도 테이블 분리, 인덱스 命名 등)은
  `notes` 배열에 정리되어 있으니 새 테이블/함수를 추가하기 전에 먼저 확인한다.

## 현재 상태 (2026-07-27 기준)

Task 1~7, 8.1, 8.2는 완료됐고, Stripe 테스트 키 등록도 끝나 task 5도 전부
완료 상태다. 남은 작업은 **8.3(전체 플로우 수동 테스트)** 하나로, 로그인
플로우는 사용자가 직접 브라우저로 검증 중이다. 최신 진행 상황은 항상
`tasks.json`의 `activeTaskId`와 각 task의 `status`를 기준으로 확인한다 — 이
README는 구조 설명용이며 진행 상황 자체는 추적하지 않는다.
