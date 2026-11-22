# Memory Mate — Study Chat

A chat app with persistent conversations. Ask questions, keep the thread,
come back to it later.

## What it does

- Chat interface with a conversation sidebar — start new chats, switch
  between past ones, delete them.
- Messages and conversations are stored in Supabase, so history survives
  a page reload.
- Suggested prompts to get a conversation started.
- Assistant replies are served by a Supabase edge function (`chat-with-ai`).

## Stack

React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui (Radix), TanStack
Query, Supabase.

## Run it

```bash
npm install
npm run dev
```

You need a Supabase project with the conversations/messages tables and the
`chat-with-ai` edge function deployed, and the Supabase URL/key in `.env`.
