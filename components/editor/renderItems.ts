import tippy, { Instance, Props } from "tippy.js";
import { CommandItem } from "./SlashCommands";

export function createSlashMenuRenderer() {
  let component: HTMLElement | null = null;
  let popup: Instance<Props>[] | null = null;
  let selectedIndex = 0;
  let currentItems: CommandItem[] = [];
  let currentCommand: ((item: CommandItem) => void) | null = null;

  function updateMenu() {
    if (!component) return;
    component.innerHTML = "";

    const container = document.createElement("div");
    container.className =
      "bg-paper border-2 border-ink p-1 w-64 shadow-none max-h-60 overflow-y-auto font-sketch";

    currentItems.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `w-full text-left px-3 py-2 flex flex-col gap-0.5 cursor-pointer font-sketch ${
        index === selectedIndex
          ? "bg-ink text-paper"
          : "text-ink hover:bg-ink/10"
      }`;

      const title = document.createElement("span");
      title.className = "font-bold text-sm leading-none";
      title.innerText = item.title;

      const desc = document.createElement("span");
      desc.className = `text-xs ${
        index === selectedIndex ? "text-paper/80" : "text-ink-soft"
      }`;
      desc.innerText = item.description;

      button.appendChild(title);
      button.appendChild(desc);

      button.addEventListener("click", () => {
        if (currentCommand) currentCommand(item);
      });

      container.appendChild(button);
    });

    component.appendChild(container);
  }

  return {
    onStart: (props: any) => {
      selectedIndex = 0;
      currentItems = props.items;
      currentCommand = props.command;

      component = document.createElement("div");
      updateMenu();

      if (!props.clientRect) return;

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate(props: any) {
      currentItems = props.items;
      currentCommand = props.command;
      selectedIndex = 0;
      updateMenu();

      if (!props.clientRect) return;

      popup?.[0]?.setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup?.[0]?.destroy();
        return true;
      }

      if (props.event.key === "ArrowUp") {
        selectedIndex =
          (selectedIndex + currentItems.length - 1) % currentItems.length;
        updateMenu();
        return true;
      }

      if (props.event.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        updateMenu();
        return true;
      }

      if (props.event.key === "Enter") {
        const item = currentItems[selectedIndex];
        if (item && currentCommand) {
          currentCommand(item);
          return true;
        }
      }

      return false;
    },

    onExit() {
      popup?.[0]?.destroy();
      component = null;
      popup = null;
    },
  };
}
