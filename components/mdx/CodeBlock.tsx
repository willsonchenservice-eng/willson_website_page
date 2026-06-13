"use client";

import { isValidElement, useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

type CodeElementProps = {
  className?: string;
  children?: ReactNode;
};

function getLanguage(className?: string) {
  const match = String(className || "").match(/(?:^|\s)language-([A-Za-z0-9_-]+)/);
  const language = match?.[1] || "";
  return /^(plain|plaintext|text)$/i.test(language) ? "" : language;
}

function getCodeChild(children: ReactNode) {
  if (!isValidElement(children)) return null;
  return children as ReactElement<CodeElementProps>;
}

function toPlainText(value: ReactNode): string {
  if (value === null || value === undefined || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toPlainText).join("");
  if (isValidElement(value)) return toPlainText((value as ReactElement<CodeElementProps>).props.children);
  return "";
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeChild = getCodeChild(children);
  const codeProps = codeChild?.props || {};
  const language = getLanguage(codeProps.className);
  const code = codeProps.children ?? children;
  const plainText = toPlainText(code).replace(/\n$/, "");

  async function copyCode() {
    if (!plainText) return;
    await writeClipboard(plainText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <figure className="mdx-code-block">
      <figcaption className="mdx-code-block__header">
        <span>{language || "代码"}</span>
        <button
          type="button"
          className="mdx-code-block__copy"
          onClick={copyCode}
          aria-label={copied ? "代码已复制" : "复制代码"}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          <span>{copied ? "已复制" : "复制"}</span>
        </button>
      </figcaption>
      <pre className="mdx-code-block__pre">
        <code className={codeProps.className}>{code}</code>
      </pre>
    </figure>
  );
}

export function InlineCode({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <code className={`mdx-inline-code${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </code>
  );
}
