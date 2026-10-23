import { Extension } from "@tiptap/react";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";

export interface CommandItem {
  title: string;
  description: string;
  command: (editor: any) => void;
}

export const getSuggestionItems = ({ query }: { query: string }): CommandItem[] => {
  const items: CommandItem[] = [
    {
      title: "Text",
      description: "Plain text paragraph",
      command: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      title: "Heading 1",
      description: "Large section heading",
      command: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      command: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      command: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
    },
    {
      title: "To-do list",
      description: "Track tasks with a to-do list",
      command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Bullet list",
      description: "Simple bulleted list",
      command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered list",
      description: "Numbered ordered list",
      command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Quote",
      description: "Capture a quote",
      command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Code block",
      description: "Code snippet with formatting",
      command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Divider",
      description: "Visually divide blocks",
      command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  return items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
};

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: any) => {
          props.command(editor);
          editor.commands.deleteRange(range);
        },
      } as SuggestionOptions,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
