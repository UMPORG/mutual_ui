"use client";

/**
 * `@umporg/ui/conversa` — the MUTU@L assistant's conversation components
 * (needs the optional peer @base-ui/react for menus and dialogs).
 */
export {
  ChatLayout,
  ThreadList,
  ConversationTitle,
  MessageList,
  ChatMessage,
  ThinkingIndicator,
  SourceList,
  ActionCard,
  SuggestionChips,
  ChatEmptyState,
  MessageFeedback,
  type ChatMessageProps,
  type MessageListProps,
  type ThreadListProps,
  type WorkStep,
  type ActionStatus,
} from "./conversa-componentes";
export { Composer, AttachmentChip, type ComposerProps } from "./conversa-compositor";
export { Markdown, CopyButton, type Citation, type MarkdownProps } from "./markdown";
export {
  agruparConversas,
  textoParaAnunciar,
  teclaEnvia,
  numerarFontes,
  type ChatMessageData,
  type ChatSource,
  type ChatThread,
  type ChatRole,
  type ChatStatus,
} from "./conversa-dados";
