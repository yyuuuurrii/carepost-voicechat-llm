# Care Post Voice Chat LLM

[openai/openai-realtime-console](https://github.com/openai/openai-realtime-console)をベースに必要機能のみに削ぎ落とした実証実験用のデモアプリケーションです。Next.jsで構築されています。

URL: https://yyuuuurrii.github.io/carepost-voicechat-llm/

## 実行方法

#### 1. クローン後、以下を実行しパッケージをダウンロードしてください

```sh
npm i
```

#### 2. ルートディレクトリで以下のコマンドを実行すると、[http://localhost:3000](http://localhost:3000)でアクセスできるようになります

```sh
npm run dev
```

## デプロイ

mainブランチにプッシュされると、GitHub Actions経由で自動デプロイされます。

## 使用方法

1. サイトアクセス後、右上の「API Key」からOpenAI APIキーを入力し「Save API Key」ボタン押下で保存
    - ブラウザのlocalStorageに保持されるため2回目以降の操作は不要
1. 右の「Controls」にある「Start Conversation」ボタンを押下し会話開始
    - 必要に応じてマイクやスピーカーのブラウザ許可をしてください
1. 会話が終了したら「Stop Conversation」ボタンを押下し修了
