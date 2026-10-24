import test from "node:test";
import assert from "node:assert/strict";

import {
  asCommunityCommentList,
  extractSavedCommunityComment,
  normalizeCommunityComment,
  readCommunityPostId,
} from "../src/Dashboard/Community/communityCommentsData.mjs";

test("comment list reader supports direct and wrapped arrays", () => {
  const rows = [{ id: "c-1", body: "hello" }];
  assert.deepEqual(asCommunityCommentList(rows), rows);
  assert.deepEqual(asCommunityCommentList({ comments: rows }), rows);
  assert.deepEqual(asCommunityCommentList({ data: { result: { comments: rows } } }), rows);
  assert.deepEqual(asCommunityCommentList({ data: { comments: [] } }), []);
});

test("saved comment reader recognizes the raw API resource and common envelopes", () => {
  const comment = { id: "c-1", body: "saved comment", author_user_id: "u-1" };
  assert.equal(extractSavedCommunityComment(comment), comment);
  assert.equal(extractSavedCommunityComment({ comment }), comment);
  assert.equal(extractSavedCommunityComment({ data: { result: { comment } } }), comment);
  assert.equal(extractSavedCommunityComment({ success: true, message: "ok" }), null);
});

test("comment normalization reads real author and timestamp fields", () => {
  const normalized = normalizeCommunityComment({
    id: "c-2",
    body: "  A helpful comment  ",
    author: { name: "Community Member", avatar_url: "https://example.test/avatar.png" },
    created_at: "2026-10-24T12:00:00Z",
  });

  assert.equal(normalized.id, "c-2");
  assert.equal(normalized.body, "A helpful comment");
  assert.equal(normalized.authorName, "Community Member");
  assert.equal(normalized.authorAvatar, "https://example.test/avatar.png");
  assert.equal(normalized.createdAt, "2026-10-24T12:00:00Z");
});

test("post ID reader supports Mongo extended JSON IDs", () => {
  assert.equal(readCommunityPostId({ _id: { $oid: "507f1f77bcf86cd799439011" } }), "507f1f77bcf86cd799439011");
  assert.equal(readCommunityPostId({ post_id: "post-123" }), "post-123");
  assert.equal(readCommunityPostId({}), "");
});
