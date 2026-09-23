# Todoアプリ開発体験ガイド

このワークスペースは、Codexと一緒にゼロからTodoアプリを作る学習環境です。Gmailから予定を抽出し、Google Calendarへ登録するアプリをTypeScriptで実装します。

## 注意事項

Codexは指示に基づいてコマンドの実行、ファイルの変更、依存パッケージのインストールを行います。提案された操作と実行結果は利用者自身で確認してください。

実際のGoogleアカウントを扱うため、個人情報や本番データでの試行は避け、APIキー、OAuthクライアントシークレット、トークンをチャットやリポジトリへ貼り付けないでください。

## 前提環境

- macOS
- Codexのローカル環境
- Googleアカウント

Node.jsやGitなどの開発ツールは、セットアップスキルで確認できます。

## セットアップ

このリポジトリをCodexのローカル環境で開き、次のように依頼します。

```text
$setup を使って開発環境をセットアップしてください
```

`$setup` は次を行います。

1. Node.js、npm、Git、GitHub CLIの確認
2. 不足しているツールのインストール提案
3. Gmail APIとGoogle Calendar APIの設定案内
4. OAuth資格情報の安全な配置
5. TypeScript、Vitest、ESLint、Prettierの初期化
6. ビルド、テスト、Lintの確認

Googleの資格情報はワークスペース外の `~/.todo-app/` に保存します。Codexにはファイルの中身を読ませず、存在確認と配置だけを行わせてください。

## 開発を始める

複数ステップの作業は、最初にチェックリストを作成します。

```text
$plan-checklist を使って、Gmailからメールを取得する機能の作業計画を作ってください
```

実装はTDDスキルを使います。

```text
$dev-tdd を使って、作成したチェックリストに沿って実装してください
```

Codexは依頼内容がスキルの説明と一致する場合、スキルを自動的に選ぶこともあります。確実に使用させたい場合は、上記のように `$スキル名` を明示してください。

## 利用できるスキル

| スキル | 用途 |
| --- | --- |
| `$setup` | macOSの開発環境、Google API、プロジェクトツールをセットアップする |
| `$plan-checklist` | 複数ステップの作業をチェックリストで管理する |
| `$dev-tdd` | Red-Green-Refactorで機能追加や修正を行う |
| `$cleanup` | 完了済みのチェックリストを確認して整理する |
| `$help` | 環境、コード、Codex、Google APIの問題を診断する |

新しいスキルを作る場合は、Codex組み込みの `$skill-creator` を使用します。

## 困ったとき

エラーメッセージや状況を添えて、次のように依頼します。

```text
$help を使って、このエラーの原因を調べてください。
```

- エラーメッセージは省略せず共有してください。ただし秘密値は取り除いてください。
- 画面が説明と異なる場合は、秘密情報が映っていないことを確認してスクリーンショットを共有してください。
- Codexが停止しているように見える場合は、進捗と現在の障害を尋ねてください。

## 開発コマンド

プロジェクト初期化後は、次のコマンドを使用できます。

```bash
npm run build
npm test
npm run lint
npm run lint:fix
npm run format
npm audit
```

## ワークスペース構成

```text
.
├── README.md
├── AGENTS.md
├── .gitignore
└── .agents/
    └── skills/
        ├── setup/
        │   ├── SKILL.md
        │   └── scripts/
        ├── plan-checklist/
        │   └── SKILL.md
        ├── dev-tdd/
        │   └── SKILL.md
        ├── cleanup/
        │   └── SKILL.md
        └── help/
            └── SKILL.md
```

`AGENTS.md` には常時適用されるプロジェクト規則を、`.agents/skills/` には目的別の作業手順を置いています。
