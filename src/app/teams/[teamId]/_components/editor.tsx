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

const Editor = ({ teamId, content }: { teamId: string; content: string }) => {
  const updateContentMutation = api.teams.updateTeam.useMutation();
  const onUpdate = useDebouncedCallback(
    ({ editor }: EditorEvents["update"]) => {
      const content = editor.getJSON();
      updateContentMutation.mutate({
        id: teamId,
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
    immediatelyRender: false,
    onUpdate,
  });

  return <EditorContent editor={editor} />;
};

export default Editor;
