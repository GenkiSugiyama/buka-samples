# Gmail To-Do Calendar 詳細仕様書

| 項目 | 内容 |
| --- | --- |
| 文書状態 | MVP仕様・初版 |
| 作成日 | 2026-09-23 |
| 対象環境 | macOS、Node.js 20.19以上 |
| 実装言語 | TypeScript（strict mode、ES Modules） |
| 想定利用者 | 単一のGoogleアカウントを利用する個人ユーザー |

## 1. 目的

本アプリケーションは、Gmailの受信トレイに届いた新着メールから対応すべき作業を抽出し、優先順位と締切区分ごとに整理したTo-Doリストを提供する。締切を高い信頼度で抽出できたタスクはGoogle Calendarへ自動登録し、曖昧な抽出結果はユーザーの確認後に反映する。

本仕様のMVPは、1台のMac上で1人が利用するローカルWebアプリケーションとする。

## 2. 設計原則

1. メール本文の解析はMac内で完結させ、外部AIサービスへ送信しない。
2. GmailおよびGoogle Calendarへの権限は必要最小限にする。
3. 誤った予定の自動登録を防ぐため、抽出信頼度による確認ゲートを設ける。
4. Gmail message IDとアプリ内タスクIDを用いて処理を冪等にする。
5. API連携、ドメインロジック、永続化、UIを分離する。
6. プロダクションコードはテストを先に作成するTDDで実装する。

## 3. スコープ

### 3.1 MVPに含む機能

- Google OAuth 2.0による単一アカウント認証
- Gmail受信トレイの新着メール差分同期
- プレーンテキストおよびHTMLメール本文のテキスト化
- ルールベースによるタスク、締切、優先順位の抽出
- 抽出信頼度の算出
- To-Do一覧、確認待ち一覧、タスク詳細のローカルWeb UI
- タスクの追加、編集、承認、却下、完了
- 高信頼タスクのGoogle Calendar自動登録
- Calendarイベントの更新および完了状態の反映
- SQLiteによるローカル永続化
- 手動同期およびmacOS `launchd`による5分間隔の自動同期
- 同期履歴とエラー状態の表示

### 3.2 MVPに含まない機能

- 複数ユーザー、複数Googleアカウント
- Gmail以外のメールサービス
- 添付ファイル、画像、PDF内のタスク抽出
- 外部生成AIまたはクラウド自然言語処理への本文送信
- Gmailメールの変更、削除、既読化、ラベル変更
- 他ユーザーとのタスク共有
- iPhone、iPad、Windows向けネイティブアプリ
- Cloud Pub/Subによるリアルタイム通知
- Google Tasks APIとの同期
- 繰り返しタスクの自動生成

## 4. 確定した前提

- 対象は同期開始後に受信トレイへ新規到着したメール全体とする。
- 初回認証時は同期開始点を保存し、既存の過去メールを自動処理しない。
- タスク抽出はルールベースとし、日本語と英語の基本表現を対象にする。
- 締切が存在し、抽出信頼度が自動登録基準以上のタスクだけCalendarへ自動登録する。
- 基準未満のタスクは確認待ちとし、ユーザーが承認するまでCalendarへ登録しない。
- 締切のないタスクはTo-Doリストには保存するが、Calendarへは登録しない。
- 日付と時刻の解釈にはMacのローカルタイムゾーンを使用し、既定値は `Asia/Tokyo` とする。

## 5. ユースケース

### UC-01 新着メールからタスクを自動作成する

1. 定期同期がGmailの新着を検出する。
2. アプリがメール本文を取得し、タスク候補を抽出する。
3. アプリが締切、優先順位、信頼度を算出する。
4. 高信頼の候補をオープンタスクとして保存する。
5. 締切がある場合はCalendarイベントを作成する。

### UC-02 曖昧な抽出結果を確認する

1. ユーザーが「確認待ち」を開く。
2. 抽出されたタイトル、締切、優先順位、根拠を確認する。
3. 必要に応じて内容を編集する。
4. 承認するとオープンタスクになり、締切があればCalendarへ登録される。
5. 却下すると、同じ候補は再作成されない。

### UC-03 タスクを完了する

1. ユーザーがタスクを完了にする。
2. 完了日時を保存する。
3. Calendar連携済みの場合、イベント名の先頭に `✅` を付け、説明へ完了日時を追記する。

### UC-04 締切を変更する

1. ユーザーがタスクの締切を編集する。
2. アプリが入力値を検証して保存する。
3. Calendar連携済みの場合、既存イベントを更新する。
4. Calendar未連携で新しい締切が設定された場合、イベントを新規作成する。

### UC-05 手動でタスクを追加する

1. ユーザーがタイトル、締切、優先順位を入力する。
2. タスクをオープン状態で保存する。
3. 締切があればCalendarへ登録する。

## 6. システム構成

```text
┌──────────────┐       OAuth 2.0       ┌──────────────────┐
│ Gmail API    │◀─────────────────────▶│                  │
└──────┬───────┘                       │ Node.js Backend  │
       │ messages/history              │                  │
       ▼                               │ - Gmail Service  │
┌──────────────┐                       │ - Task Extractor │
│ Sync Service │──────────────────────▶│ - Calendar Sync │
└──────────────┘                       │ - REST API       │
                                       └───────┬──────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                    ┌──────────┐       ┌─────────────┐      ┌──────────────┐
                    │ SQLite   │       │ React UI    │      │ Calendar API │
                    └──────────┘       │ localhost   │      └──────────────┘
                                       └─────────────┘
```

### 6.1 技術スタック

| レイヤー | 採用技術 |
| --- | --- |
| ランタイム | Node.js 20.19以上 |
| 言語 | TypeScript、strict mode、ES Modules |
| Gmail・Calendar | `googleapis` |
| HTTPサーバー | Fastify |
| UI | React、Vite |
| データベース | SQLite（ドライバーはリポジトリ層で抽象化） |
| 入力検証 | Zod |
| テスト | Vitest |
| 静的解析 | ESLint、`eslint-plugin-security` |
| フォーマット | Prettier |
| 定期起動 | macOS `launchd` |

ライブラリのバージョンは実装開始時にNode.js 20.19以上と互換性のある安定版へ固定する。SQLiteドライバーはNode.js対応状況、macOS向け配布形式、脆弱性監査結果を確認して実装開始時に選定し、ドメイン層へ依存を漏らさない。

### 6.2 論理モジュール

```text
src/
├── domain/
│   ├── task.ts
│   ├── task-extractor.ts
│   ├── deadline-parser.ts
│   ├── priority-classifier.ts
│   └── confidence-calculator.ts
├── services/
│   ├── gmail-service.ts
│   ├── gmail-sync-service.ts
│   ├── calendar-service.ts
│   └── task-service.ts
├── repositories/
│   ├── task-repository.ts
│   ├── message-repository.ts
│   ├── sync-state-repository.ts
│   └── calendar-link-repository.ts
├── routes/
├── infrastructure/
│   ├── google-auth.ts
│   ├── database.ts
│   └── logger.ts
└── ui/
```

ドメイン層はGoogle APIやSQLiteへ直接依存せず、外部I/Oはサービス層およびリポジトリ層のインターフェース越しに扱う。

## 7. 機能要件

### 7.1 認証

| ID | 要件 |
| --- | --- |
| AUTH-001 | Desktop App用OAuth 2.0クライアントを使用する。 |
| AUTH-002 | Gmailは読み取り専用の `gmail.readonly` を使用する。 |
| AUTH-003 | Calendarはアプリ専用Calendarの作成とそのイベント操作だけを許可する `calendar.app.created` を使用する。 |
| AUTH-004 | 初回認証はローカルブラウザを通してユーザー同意を取得する。 |
| AUTH-005 | トークン更新が必要な場合はrefresh tokenを使って自動更新する。 |
| AUTH-006 | 認証失効時は同期を停止し、UIに再認証要求を表示する。 |

### 7.2 Gmail同期

| ID | 要件 |
| --- | --- |
| GMAIL-001 | 初回認証時に `users.getProfile` から現在の `historyId` を取得して同期位置へ保存し、既存メールを処理しない。 |
| GMAIL-002 | 以後は保存した `historyId` から `users.history.list` で差分取得する。 |
| GMAIL-003 | `INBOX` ラベルを持つ新規追加メッセージだけを抽出対象にする。 |
| GMAIL-004 | `SPAM`、`TRASH`、`DRAFT`、`SENT` のメッセージは対象外にする。 |
| GMAIL-005 | `historyId` が無効でHTTP 404となった場合、現在位置を安全に再構築する。再構築時も古いメールは自動タスク化しない。 |
| GMAIL-006 | 同一message IDを複数回処理してもタスクを重複生成しない。 |
| GMAIL-007 | 1回の同期はページネーションを最後まで処理し、成功後に同期位置を更新する。 |
| GMAIL-008 | 一部メッセージの処理失敗は記録し、他のメッセージ処理を継続する。 |
| GMAIL-009 | 手動同期と自動同期を同時実行せず、プロセス内ロックで直列化する。 |

### 7.3 メール本文の正規化

| ID | 要件 |
| --- | --- |
| MAIL-001 | `text/plain` を優先し、存在しない場合は `text/html` を安全にテキスト化する。 |
| MAIL-002 | multipartメールを再帰的に探索する。 |
| MAIL-003 | 引用返信、署名、配信停止文、追跡URLを可能な範囲で除外する。 |
| MAIL-004 | 添付ファイルの内容は解析しない。 |
| MAIL-005 | 解析入力は件名と正規化本文を合わせて最大50,000文字とし、超過分を切り捨てる。 |
| MAIL-006 | データベースへ完全なメール本文を保存しない。 |

### 7.4 タスク抽出

| ID | 要件 |
| --- | --- |
| TASK-001 | 1通のメールから0件以上のタスク候補を抽出できる。 |
| TASK-002 | 「お願いします」「してください」「要対応」「提出」「確認」「返信」などの日本語表現を認識する。 |
| TASK-003 | `please`、`action required`、`submit`、`review`、`reply` などの英語表現を認識する。 |
| TASK-004 | ニュースレター、広告、単なる通知は、明示的な依頼がない限りタスク化しない。 |
| TASK-005 | タスクタイトルは具体的な動作を表す120文字以内の文に正規化する。 |
| TASK-006 | 同一メール内で動作と対象が異なる場合は複数タスクとして抽出する。 |
| TASK-007 | メールごとに抽出ルールのバージョンを記録する。 |
| TASK-008 | message IDと正規化したタスク内容のハッシュを一意キーとして重複を防ぐ。 |

### 7.5 締切抽出

絶対日付、曜日、相対日付を対象とする。

- 絶対日付例：`2026/10/05`、`10月5日`、`October 5, 2026`
- 相対日付例：`今日`、`明日`、`3日以内`、`today`、`tomorrow`
- 曜日例：`今週金曜日`、`next Monday`
- 時刻例：`17時まで`、`15:30`、`by 5 PM`

| ID | 要件 |
| --- | --- |
| DUE-001 | 年のない月日は、メール受信日時以後で最も近い妥当な日付として解釈する。 |
| DUE-002 | 相対日付はメール受信日時を基準に解釈する。 |
| DUE-003 | 日付だけの場合は、その日を締切とする終日イベントを作成する。 |
| DUE-004 | 日付と時刻がある場合は、その時刻を開始、30分後を終了とするイベントを作成する。 |
| DUE-005 | 複数の締切候補が競合する場合、自動登録せず確認待ちにする。 |
| DUE-006 | `なるべく早く`、`後ほど` など日付に確定できない表現は締切未設定とする。 |
| DUE-007 | 解釈結果には原文の根拠文字列を保持する。保存は最大500文字とする。 |
| DUE-008 | 日付が過去になる解釈は原則として確認待ちにする。 |

### 7.6 優先順位

優先順位は `high`、`medium`、`low` の3段階とし、次の点数を合算する。

| 条件 | 点数 |
| --- | ---: |
| `至急`、`緊急`、`urgent`、`ASAP` などの明示表現 | +40 |
| 締切まで24時間以内 | +30 |
| 締切まで3日以内 | +20 |
| ユーザー設定の重要送信者 | +20 |
| Gmailの `IMPORTANT` ラベル | +10 |
| 明示的に任意・参考とされている | -30 |

- `high`：60点以上
- `medium`：30～59点
- `low`：29点以下

点数と判定根拠を保存し、詳細画面で確認できるようにする。同点数でもユーザーが手動変更した値を優先し、その後の自動再計算で上書きしない。

### 7.7 抽出信頼度

信頼度は0.00～1.00で表し、以下を合算する。

| 判定要素 | 最大値 |
| --- | ---: |
| 明確な依頼動詞と作業対象がある | 0.35 |
| ユーザー本人への依頼と判断できる | 0.20 |
| 締切表現が一意に解釈できる | 0.30 |
| 件名と本文の内容が整合する | 0.15 |

Calendar自動登録条件は次のすべてを満たすこととする。

1. 信頼度が0.80以上である。
2. 締切日時が一意に決定している。
3. 締切が過去ではない。
4. 同じタスクに未解決の競合候補がない。

タスクそのものの抽出信頼度が0.60未満の場合は確認待ちとする。0.60以上で締切がない候補はオープンタスクとして保存するが、Calendarへは登録しない。

### 7.8 タスク管理

| ID | 要件 |
| --- | --- |
| TODO-001 | タスク状態は `pending_review`、`open`、`completed`、`dismissed` とする。 |
| TODO-002 | ユーザーはタイトル、説明、締切、優先順位を編集できる。 |
| TODO-003 | ユーザーは確認待ちタスクを承認または却下できる。 |
| TODO-004 | ユーザーはタスクを完了および再オープンできる。 |
| TODO-005 | ユーザーはメール由来でないタスクを手動追加できる。 |
| TODO-006 | 期限区分は「期限超過」「今日」「3日以内」「今週」「それ以降」「期限なし」とする。 |
| TODO-007 | 一覧は期限区分、優先順位、状態、送信者で絞り込める。 |
| TODO-008 | 一覧の既定順序は期限超過、締切昇順、優先順位降順、作成日時降順とする。 |
| TODO-009 | メール由来タスクにはGmailで元メールを開くリンクを表示する。 |

### 7.9 Google Calendar同期

| ID | 要件 |
| --- | --- |
| CAL-001 | 専用カレンダー名の既定値を `Gmail To-Do` とする。 |
| CAL-002 | 専用カレンダーが存在しない場合は、初期設定時にユーザー確認の上で作成する。 |
| CAL-003 | イベント件名は優先度記号とタスクタイトルから構成する。例：`[高] 見積書を提出`。 |
| CAL-004 | イベント説明には元メール情報、抽出根拠、アプリ内タスクIDを記録する。メール本文全体は記録しない。 |
| CAL-005 | `extendedProperties.private` にアプリ識別子、タスクID、Gmail message IDを保存する。 |
| CAL-006 | 日付のみの締切は終日イベント、日時指定は30分の時間指定イベントとする。 |
| CAL-007 | タスク編集時は新規イベントを追加せず、保存済みevent IDのイベントを更新する。 |
| CAL-008 | 完了時はイベント件名へ `✅` を付け、再オープン時は取り除く。 |
| CAL-009 | アプリが作成したイベントだけを更新対象とする。 |
| CAL-010 | Calendar上でイベントが削除されていた場合、タスクを保持したまま「連携解除」とし、再登録操作を提供する。 |
| CAL-011 | Calendar同期失敗時もタスク保存を取り消さず、再試行待ちとする。 |

## 8. 画面仕様

### 8.1 初期設定画面

- Googleアカウント接続状態
- GmailおよびCalendar APIの権限状態
- アプリ専用Calendarの作成
- 重要送信者の登録
- 自動同期間隔の表示
- 「同期を開始」操作

### 8.2 ダッシュボード

- 最終同期日時と同期状態
- 「今すぐ同期」ボタン
- 期限超過件数、今日の件数、確認待ち件数、同期エラー件数
- 期限区分ごとのタスクリスト
- 優先順位を色だけに依存せず、文字とアイコンでも表示

### 8.3 確認待ち画面

- 抽出タイトル
- 推定締切と根拠文字列
- 推定優先順位と判定理由
- 信頼度
- 送信者、件名、受信日時、Gmailリンク
- 編集、承認、却下操作

### 8.4 タスク詳細・編集画面

- タイトル、説明、状態、優先順位、締切
- 元メールのメタデータ
- Calendar連携状態
- 抽出ルールバージョンと判定根拠
- 保存、完了、再オープン、却下、Calendar再同期操作

### 8.5 設定画面

- 接続中のGoogleアカウント
- アプリ専用CalendarのIDと接続状態
- 重要送信者一覧
- タイムゾーン
- 自動登録信頼度しきい値（既定0.80）
- 再認証、同期位置の再初期化

## 9. 内部HTTP API

サーバーは `127.0.0.1` のみにバインドし、外部ネットワークへ公開しない。

| Method | Path | 概要 |
| --- | --- | --- |
| `GET` | `/api/health` | プロセス、DB、認証状態を返す |
| `GET` | `/api/tasks` | フィルター付きタスク一覧 |
| `POST` | `/api/tasks` | 手動タスク作成 |
| `GET` | `/api/tasks/:id` | タスク詳細 |
| `PATCH` | `/api/tasks/:id` | タスク編集 |
| `POST` | `/api/tasks/:id/approve` | 確認待ちタスク承認 |
| `POST` | `/api/tasks/:id/dismiss` | タスク却下 |
| `POST` | `/api/tasks/:id/complete` | タスク完了 |
| `POST` | `/api/tasks/:id/reopen` | タスク再オープン |
| `POST` | `/api/tasks/:id/calendar-sync` | Calendar再同期 |
| `POST` | `/api/sync` | Gmail手動同期開始 |
| `GET` | `/api/sync/status` | 最終同期結果取得 |
| `GET` | `/api/settings` | 設定取得 |
| `PATCH` | `/api/settings` | 設定更新 |

- 変更系APIはJSONのみを受け付け、Zodスキーマで検証する。
- 不正な入力は `400`、未発見は `404`、競合は `409`、内部障害は `500` とする。
- エラーレスポンスは機密情報を含まないエラーコードと表示用メッセージを返す。

## 10. データモデル

### 10.1 `tasks`

| 列 | 型 | 制約・説明 |
| --- | --- | --- |
| `id` | TEXT | UUID、主キー |
| `source_type` | TEXT | `gmail` または `manual` |
| `gmail_message_id` | TEXT NULL | Gmail由来の場合に設定 |
| `task_fingerprint` | TEXT | 重複防止用ハッシュ |
| `title` | TEXT | 1～120文字 |
| `description` | TEXT NULL | ユーザー編集可能 |
| `status` | TEXT | `pending_review/open/completed/dismissed` |
| `priority` | TEXT | `high/medium/low` |
| `priority_score` | INTEGER | 自動判定点数 |
| `priority_overridden` | INTEGER | 手動変更フラグ |
| `due_at` | TEXT NULL | ISO 8601 |
| `due_is_all_day` | INTEGER | 真偽値 |
| `timezone` | TEXT | IANAタイムゾーン |
| `confidence` | REAL | 0.00～1.00 |
| `evidence` | TEXT NULL | 最大500文字 |
| `extractor_version` | TEXT NULL | 抽出規則バージョン |
| `completed_at` | TEXT NULL | ISO 8601 |
| `created_at` | TEXT | ISO 8601 |
| `updated_at` | TEXT | ISO 8601 |

一意制約は `gmail_message_id` と `task_fingerprint` の組み合わせに設定する。

### 10.2 `source_messages`

| 列 | 型 | 制約・説明 |
| --- | --- | --- |
| `gmail_message_id` | TEXT | 主キー |
| `gmail_thread_id` | TEXT | スレッドID |
| `subject` | TEXT | 件名 |
| `sender_name` | TEXT NULL | 表示名 |
| `sender_address` | TEXT | メールアドレス |
| `received_at` | TEXT | ISO 8601 |
| `gmail_permalink` | TEXT | 元メールリンク |
| `processing_status` | TEXT | `processed/ignored/error` |
| `error_code` | TEXT NULL | 本文やトークンを含めない |
| `processed_at` | TEXT NULL | ISO 8601 |

完全なメール本文は保存しない。

### 10.3 `calendar_links`

| 列 | 型 | 制約・説明 |
| --- | --- | --- |
| `task_id` | TEXT | 主キー、`tasks.id` 外部キー |
| `calendar_id` | TEXT | Calendar ID |
| `event_id` | TEXT | Event ID、一意 |
| `sync_status` | TEXT | `pending/synced/error/detached` |
| `last_error_code` | TEXT NULL | 機密情報を含めない |
| `last_synced_at` | TEXT NULL | ISO 8601 |

### 10.4 `sync_state`

| 列 | 型 | 制約・説明 |
| --- | --- | --- |
| `account_id` | TEXT | 主キー、メールアドレスを直接使わずハッシュ化 |
| `gmail_history_id` | TEXT | 次回差分同期の開始位置 |
| `last_started_at` | TEXT NULL | ISO 8601 |
| `last_succeeded_at` | TEXT NULL | ISO 8601 |
| `last_status` | TEXT | `idle/running/succeeded/partial/error` |
| `last_error_code` | TEXT NULL | 機密情報を含めない |

### 10.5 `settings`

設定キーとJSON値を保存する。OAuthクライアント秘密情報とトークンは保存しない。重要送信者、Calendar ID、タイムゾーン、信頼度しきい値を対象とする。

## 11. 状態遷移

```text
抽出候補
  ├─ 信頼度不足・競合あり ─▶ pending_review
  │                              ├─ 承認 ─▶ open
  │                              └─ 却下 ─▶ dismissed
  └─ 判定条件を満たす ─────────▶ open

open ──完了──▶ completed
  ▲               │
  └──再オープン───┘

open / pending_review ──却下──▶ dismissed
```

Calendar同期状態はタスク状態と分離し、`pending`、`synced`、`error`、`detached` で管理する。

## 12. 同期処理フロー

1. 同期ロックを取得する。取得できなければ `409 SYNC_ALREADY_RUNNING` とする。
2. OAuthトークンを確認し、必要なら更新する。
3. 保存済み `historyId` から変更履歴をページ単位で取得する。
4. `INBOX` へ追加された新規message IDを収集して重複を除く。
5. 未処理メッセージを取得し、MIME本文を正規化する。
6. タスク候補、締切、優先順位、信頼度を算出する。
7. DBトランザクションでメッセージメタデータとタスクを保存する。
8. 自動登録条件を満たすタスクごとにCalendar upsertを実行する。
9. 部分失敗を記録し、再試行可能な項目を `pending` または `error` にする。
10. Gmail履歴取得が完了した場合だけ最新 `historyId` を保存する。
11. 同期結果を保存してロックを解放する。

プロセスが途中終了しても、message IDとタスクfingerprintの一意制約により次回実行で安全に再処理できること。

## 13. エラー処理と再試行

| 障害 | 処理 |
| --- | --- |
| OAuth失効 | 自動同期を停止し、再認証を要求する |
| Gmail `429` / `5xx` | 指数バックオフとランダムジッターで最大3回再試行 |
| Calendar `429` / `5xx` | タスクを保持し、最大3回再試行後に同期エラー表示 |
| Gmail history `404` | 同期位置を現在値へ安全に再初期化し、古いメールを処理しない |
| メール形式不正 | 当該メールを `error` として記録し、次へ進む |
| SQLite書き込み失敗 | トランザクションをロールバックし、同期位置を進めない |
| Calendarイベント削除済み | `detached` として表示し、ユーザー操作で再作成可能にする |
| ネットワーク切断 | 現在の処理を失敗として記録し、次回定期同期で再試行する |

再試行ログには本文、OAuthトークン、Authorizationヘッダーを含めない。

## 14. セキュリティ・プライバシー要件

| ID | 要件 |
| --- | --- |
| SEC-001 | `credentials.json` と `token.json` は `~/.todo-app/` に保存する。 |
| SEC-002 | `~/.todo-app/` は所有者のみアクセス可能な権限、認証ファイルは所有者のみ読み書き可能な権限とする。 |
| SEC-003 | 認証情報をワークスペース、Git、ログ、画面へ出力しない。 |
| SEC-004 | メール本文をDBへ永続保存しない。 |
| SEC-005 | ログへメール本文、Authorizationヘッダー、access token、refresh tokenを出力しない。 |
| SEC-006 | HTTPサーバーは `127.0.0.1` のみにbindする。 |
| SEC-007 | UIとAPIを同一オリジンで配信し、変更要求にはCSRF対策を適用する。 |
| SEC-008 | HTMLメールはスクリプト、スタイル、外部リソースを実行せずテキスト化する。 |
| SEC-009 | API入力、パスパラメータ、設定値をスキーマ検証する。 |
| SEC-010 | SQLはプレースホルダーを用い、文字列連結で構築しない。 |
| SEC-011 | 依存関係はlockfileで固定し、PR前に `npm audit` を実行する。 |
| SEC-012 | 公開配布へ進む前にGmail制限付きスコープのOAuth検証要件を再評価する。 |

## 15. 非機能要件

### 15.1 性能

- 通常の差分同期は新着50通以内を想定する。
- 1,000件のタスクを保持した状態で、ローカル一覧の初期表示を2秒以内にすることを目標とする。
- UI操作をGmail同期処理でブロックしない。
- SQLiteに必要なインデックスを設定する。

### 15.2 可用性と回復性

- Macスリープ中の実行は保証しない。復帰後の次回実行で差分を取得する。
- アプリ再起動後も未同期Calendarイベントを再試行する。
- DB更新はトランザクションで行う。
- DBスキーマにはバージョンを持たせ、前方移行用マイグレーションを提供する。

### 15.3 アクセシビリティ

- キーボードだけで主要操作を完了できる。
- 優先度やエラー状態を色だけで表現しない。
- フォーム要素にラベルと検証メッセージを関連付ける。
- 基本的なWCAG 2.2 AA相当のコントラストを目標とする。

### 15.4 保守性

- exported functionには明示的な戻り値型を付ける。
- `any` を原則使用しない。
- ドメインロジックは外部APIなしで単体テスト可能にする。
- Gmail・Calendar応答は境界でアプリ内型へ変換する。

## 16. ログと監視

- ログはJSON形式とし、時刻、レベル、イベント名、相関ID、件数、エラーコードを含める。
- 既定ログレベルは `info` とする。
- 同期ごとに取得件数、処理件数、生成タスク数、Calendar同期数、失敗数を記録する。
- UIには最終成功時刻、前回結果、エラーコードを表示する。
- ログは `~/.todo-app/logs/` に保存し、7日または合計50MBを上限にローテーションする。
- ログへメール件名や送信者を出力しない。

## 17. `launchd` 運用仕様

- 5分間隔で同期用CLIコマンドを起動する。
- Macへのログイン後に開始するユーザーLaunchAgentとする。
- 同期中に次の起動時刻になった場合は二重実行せず終了する。
- アプリが未認証の場合はAPI呼び出しをせず、再認証が必要な状態を記録する。
- LaunchAgentの導入と削除は明示的なセットアップコマンドで行う。
- 開発環境では自動登録せず、手動同期を利用できるようにする。

## 18. テスト方針

### 18.1 単体テスト

- 日本語・英語のタスク表現抽出
- 相対日付、年省略日付、曜日、時刻の解釈
- 年末年始、うるう年、夏時間を含むタイムゾーン処理
- 優先順位スコア境界値
- 信頼度しきい値境界値
- MIME multipart探索とHTMLテキスト化
- タスク状態遷移
- Calendarイベントへの変換

### 18.2 結合テスト

- Gmail APIクライアントをモックした初回同期と差分同期
- 複数ページのhistory取得
- `historyId` 失効時の再初期化
- 同一message IDの再処理
- SQLiteトランザクションのロールバック
- Calendar作成、更新、削除済みイベント検出
- API入力検証とエラーレスポンス

### 18.3 UIテスト

- 期限区分および優先順位表示
- 確認待ちの編集、承認、却下
- 手動タスク追加、完了、再オープン
- 同期中、同期成功、同期失敗状態
- キーボード操作と主要アクセシビリティ属性

### 18.4 セキュリティ検証

- `npm run lint` でエラーおよびsecurity警告がないこと
- `npm audit` でmoderate以上の未解決脆弱性がないこと
- リポジトリとログに認証情報が含まれないこと
- HTMLメールに含まれるスクリプトや外部画像が実行されないこと
- ローカルサーバーが外部インターフェースでlistenしていないこと

## 19. 受入基準

| ID | 受入条件 |
| --- | --- |
| AC-001 | 初回認証前の既存メールからタスクが作成されない。 |
| AC-002 | 認証後の新着受信メールを次回同期で検出できる。 |
| AC-003 | 明確な依頼と締切を含むメールから正しいタスクが作成される。 |
| AC-004 | 高信頼・締切ありのタスクが専用Calendarへ1回だけ登録される。 |
| AC-005 | 曖昧または競合する締切は自動登録されず確認待ちになる。 |
| AC-006 | 締切なしのタスクは保存されるがCalendarイベントは作成されない。 |
| AC-007 | 同じメールを再処理してもタスクとイベントが重複しない。 |
| AC-008 | タスクの締切変更が既存Calendarイベントへ反映される。 |
| AC-009 | タスク完了時に既存Calendarイベントへ完了表示が反映される。 |
| AC-010 | Calendar障害時もタスクが失われず、後から再同期できる。 |
| AC-011 | メール本文とOAuthトークンがDB、ログ、Gitへ保存されない。 |
| AC-012 | Mac復帰後に停止中の新着を差分同期できる。 |
| AC-013 | ビルド、テスト、lint、依存関係監査がすべて成功する。 |

## 20. 実装フェーズ

### Phase 1: プロジェクト基盤

- TypeScript、Vitest、ESLint、Prettierの初期化
- ディレクトリ構成と設定読込
- SQLiteスキーマとマイグレーション

### Phase 2: Google認証とGmail同期

- OAuth認証
- 初回同期位置設定
- Gmail差分取得、MIME正規化、冪等保存

### Phase 3: タスク抽出

- 日英タスク表現
- 締切抽出
- 優先順位と信頼度算出
- 確認待ち判定

### Phase 4: Calendar連携

- 専用Calendar設定
- イベント作成、更新、再試行
- 重複防止と連携解除検出

### Phase 5: Web UI

- ダッシュボード
- 確認待ち
- タスク編集
- 設定と同期状態

### Phase 6: macOS運用と品質保証

- LaunchAgent
- ログローテーション
- E2E確認
- セキュリティおよび脆弱性ゲート

各フェーズはTDDで進め、完了時に `npm run build`、`npm test`、`npm run lint` を実行する。

## 21. 将来拡張

- Cloud Pub/SubとGmail `watch` による即時同期
- ローカルモデルまたは許可済みAIによる曖昧文解析
- 添付ファイル解析
- Google Tasks連携
- Gmailラベルによる対象範囲設定
- 複数アカウント対応
- タスクの繰り返し、リマインダー、通知
- macOSメニューバーアプリ

## 22. 参考資料

- [Gmail API Node.js quickstart](https://developers.google.com/workspace/gmail/api/quickstart/nodejs)
- [Gmailクライアント同期](https://developers.google.com/workspace/gmail/api/guides/sync)
- [Gmail API OAuthスコープ](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Gmail push通知](https://developers.google.com/workspace/gmail/api/guides/push)
- [Gmail users.getProfile](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile)
- [Google Calendar API OAuthスコープ](https://developers.google.com/workspace/calendar/api/auth)
- [Google Calendar Calendars: insert](https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert)
- [Google Calendar Events: insert](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)
- [Fastify TypeScriptリファレンス](https://fastify.dev/docs/latest/Reference/TypeScript/)
- [Vite Getting Started](https://vite.dev/guide/)
