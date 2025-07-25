"use client";

import {
  useEditor,
  EditorContent,
  type EditorEvents,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";
import { Placeholder } from "@tiptap/extensions";

const Editor = ({
  systemId,
  content,
}: {
  systemId: string;
  content: JSONContent;
}) => {
  const updateContentMutation = api.teams.updateSystem.useMutation();
  const onUpdate = useDebouncedCallback(
    ({ editor }: EditorEvents["update"]) => {
      const content = editor.getJSON();
      console.log(content);
      updateContentMutation.mutate({
        id: systemId,
        mdx: JSON.stringify(content),
      });
    },
    250,
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        // Use a placeholder:
        placeholder: "Write something …",
      }),
    ],
    content,
    onUpdate,
  });

  return <EditorContent editor={editor} />;
};

export default Editor;
