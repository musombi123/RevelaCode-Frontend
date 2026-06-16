// utils/messageEmotion.js

export const getMessageEmotion = (message) => {
  const text = (message.text || "").toLowerCase();

  if (message.status === "thinking") return "thinking";

  if (text.includes("bible") || text.includes("verse")) {
    return "spiritual";
  }

  if (text.includes("prophecy")) {
    return "prophetic";
  }

  if (text.includes("code") || text.includes("error")) {
    return "technical";
  }

  if (message.role === "user") {
    return "user";
  }

  return "neutral";
};