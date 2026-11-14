# QuizPaste

QuizPaste turns plain-text questions into a quiz you can take and review in your browser. Use the [How to use guide](/guide) for the question format and a prompt generator for creating questions with an AI.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quiz format

Number each question and put each answer option on its own line. Add `*` to every correct answer. For example:

```text
1. What is 2 + 2?
A) 3
B) 4 *
C) 5
D) 6
```

The app also supports true/false and multi-select questions. See the guide for examples and scoring details.

## Local data

Quiz history is saved in this browser on this device. QuizPaste does not upload pasted questions or results. If you upload study material to an AI service, that upload is handled by the service you choose.

## Logo and favicon

The logo and favicon use [`src/assets/icon.ico`](src/assets/icon.ico). The browser-served copy is [`public/icon.ico`](public/icon.ico); update both files when replacing the icon.

## Checks

```bash
npm run build
npm run test:guide
npm run lint
```

## Deploy

Import the repository into Vercel. Next.js deploys with the default settings.
