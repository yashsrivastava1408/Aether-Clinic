import React from "react";

// Section titles of the final assessment (ml/consult/prompts.py)
const SECTION_TITLES = new Set(["summary", "general possibilities", "suggestions", "when to seek urgent care", "next step"]);

const BULLET = /^\s*[-*•]\s+(.*)$/;

const titleOf = (line) => {
  const plain = line.trim().replace(/^[#*\s]+|[*:\s]+$/g, "");
  return SECTION_TITLES.has(plain.toLowerCase()) ? plain : null;
};

// **bold** becomes <strong>; everything else stays plain text.
const inline = (text) => text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) => (
  part.startsWith("**") && part.endsWith("**") && part.length > 4
    ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    : part
));

/**
 * Shows a reply as paragraphs, bullet lists and section titles. The text is
 * rendered as React text nodes, never as HTML.
 */
export default function MessageText({ text = "" }) {
  const blocks = [];
  let list = null;

  for (const line of String(text).split(/\r?\n/)) {
    const bullet = line.match(BULLET);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ type: "list", items: list });
      }
      list.push(bullet[1]);
      continue;
    }
    list = null;
    if (!line.trim()) continue;
    const title = titleOf(line);
    blocks.push(title ? { type: "title", text: title } : { type: "text", text: line.trim() });
  }

  return (
    <div className="space-y-2 break-words">
      {blocks.map((block, i) => {
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {block.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
            </ul>
          );
        }
        if (block.type === "title") return <p key={i} className="pt-1 font-semibold">{block.text}</p>;
        return <p key={i}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
