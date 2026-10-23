"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Placeholder from "@tiptap/extension-placeholder";
import { SlashCommands, getSuggestionItems } from "./SlashCommands";
import { createSlashMenuRenderer } from "./renderItems";

interface TiptapEditorProps {
  content: string;
  onChange: (jsonStr: string) => void;
  editable?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
}: TiptapEditorProps) {
  let initialParsed: any = "";
  try {
    initialParsed = content ? JSON.parse(content) : "";
  } catch {
    initialParsed = content || "";
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      TaskList,
      TaskItem.configure({ nested: true }),
      Blockquote,
      CodeBlock,
      HorizontalRule,
      Placeholder.configure({
        placeholder: "Type '/' for commands…",
      }),
      SlashCommands.configure({
        suggestion: {
          items: getSuggestionItems,
          render: createSlashMenuRenderer,
        },
      }),
    ],
    content: initialParsed,
    editable,
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none min-h-[350px] py-4",
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      onChange(json);
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  return <EditorContent editor={editor} />;
}
