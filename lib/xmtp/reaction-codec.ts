import { ContentTypeId, type ContentCodec, type EncodedContent } from "@xmtp/content-type-primitives"

export const ContentTypeReaction = ContentTypeId.fromString("phenix.chat/reaction:1.0")

export type ReactionContent = {
  refId: string
  emoji: string
}

export class ReactionCodec implements ContentCodec<ReactionContent> {
  contentType = ContentTypeReaction

  encode(content: ReactionContent): EncodedContent<Record<string, string>> {
    const json = JSON.stringify(content)
    const bytes = new TextEncoder().encode(json)
    return {
      type: ContentTypeReaction,
      parameters: { refId: content.refId, emoji: content.emoji },
      content: bytes,
    }
  }

  decode(encoded: EncodedContent<Record<string, string>>): ReactionContent {
    try {
      const json = new TextDecoder().decode(encoded.content)
      const parsed = JSON.parse(json) as ReactionContent
      if (parsed && typeof parsed.refId === "string" && typeof parsed.emoji === "string") {
        return parsed
      }
    } catch {}
    // Fallback to parameters if content isn't JSON
    return {
      refId: (encoded.parameters as any)?.refId || "",
      emoji: (encoded.parameters as any)?.emoji || "",
    }
  }

  fallback(content: ReactionContent): string | undefined {
    return `reacted ${content.emoji}`
  }

  shouldPush(): boolean {
    return true
  }
}

