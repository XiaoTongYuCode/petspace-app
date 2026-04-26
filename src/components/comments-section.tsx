"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2, Reply, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Avatar } from "@/components/avatar";
import { formatDate } from "@/lib/format";
import type { PostComment } from "@/lib/types";

type CommentsSectionProps = {
  postId: string;
  initialComments: PostComment[];
  canComment: boolean;
  disabledReason?: string | null;
};

type CommentFormProps = {
  body: string;
  canComment: boolean;
  disabledReason: string | null;
  isSubmitting: boolean;
  replyingTo: PostComment | null;
  onBodyChange: (value: string) => void;
  onCancelReply: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type CommentItemProps = {
  comment: PostComment;
  depth?: number;
  onReply: (comment: PostComment) => void;
};

function CommentForm({
  body,
  canComment,
  disabledReason,
  isSubmitting,
  replyingTo,
  onBodyChange,
  onCancelReply,
  onSubmit,
}: CommentFormProps) {
  const isDisabled = !canComment || isSubmitting;

  return (
    <form
      onSubmit={onSubmit}
      className="pb-4"
    >
      {replyingTo ? (
        <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-[#fff3df] px-3 py-1 text-xs font-bold text-[#8a5b2c] ring-1 ring-black/5">
          <span className="truncate">回复 @{replyingTo.author.handle}</span>
          <button
            type="button"
            onClick={onCancelReply}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-black/10"
            aria-label="取消回复"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      <div className="relative">
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          disabled={isDisabled}
          maxLength={500}
          rows={4}
          placeholder={disabledReason ?? "发条评论，说说你的感受"}
          className="min-h-32 w-full resize-none rounded-lg border border-black/10 bg-white/90 px-4 pb-14 pt-3 text-sm leading-6 text-[#17120d] shadow-sm outline-none transition placeholder:text-[#9a826d] focus:border-[#e46645] focus:ring-2 focus:ring-[#e46645]/15 disabled:cursor-not-allowed disabled:bg-white/55 disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className="absolute bottom-5 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e46645] text-white shadow-sm transition hover:bg-[#d3583b] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="发表评论"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
}

function CommentItem({ comment, depth = 0, onReply }: CommentItemProps) {
  return (
    <div className={depth > 0 ? "border-l border-black/10 pl-3 sm:pl-4" : ""}>
      <div className="flex gap-3">
        <Avatar src={comment.author.avatarUrl} name={comment.author.displayName} />
        <div className="min-w-0 flex-1 rounded-md bg-white/58 px-3 py-2 ring-1 ring-black/5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold text-[#17120d]">
              {comment.author.displayName}
            </span>
            <span className="text-xs font-medium text-[#8a715b]">
              @{comment.author.handle}
            </span>
            <span className="text-xs font-medium text-[#8a715b]">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#3b3027]">
            {comment.body}
          </p>
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-[#8a5b2c] transition hover:bg-[#fff3df] hover:text-[#d75d3f]"
          >
            <Reply className="h-3.5 w-3.5" />
            回复
          </button>
        </div>
      </div>

      {comment.replies.length > 0 ? (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentsSection({
  postId,
  initialComments,
  canComment,
  disabledReason = null,
}: CommentsSectionProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmitComment =
    !disabledReason && (canComment || (isLoaded && Boolean(isSignedIn)));
  const effectiveDisabledReason =
    disabledReason ?? (canSubmitComment ? null : "登录后参与评论。");

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canSubmitComment) {
      setError(effectiveDisabledReason ?? "请先登录后再评论。");
      return;
    }

    if (!body.trim()) {
      setError("请输入评论内容。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body,
          parentId: replyingTo?.id ?? null,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { comments?: PostComment[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "评论失败。");
      }

      setComments(result?.comments ?? comments);
      setBody("");
      setReplyingTo(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "评论失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="comments" className="space-y-4">
      <CommentForm
        body={body}
        canComment={canSubmitComment}
        disabledReason={effectiveDisabledReason}
        isSubmitting={isSubmitting}
        replyingTo={replyingTo}
        onBodyChange={setBody}
        onCancelReply={() => setReplyingTo(null)}
        onSubmit={submitComment}
      />

      {error ? (
        <p className="rounded-md bg-white/70 px-4 py-3 text-sm font-medium text-[#b23b2b] ring-1 ring-black/5">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={setReplyingTo}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-[#dfbd8a] bg-[#fffaf1] px-3 py-3 text-sm font-medium text-[#8a715b]">
            还没有评论，来写第一条吧。
          </p>
        )}
      </div>
    </section>
  );
}
