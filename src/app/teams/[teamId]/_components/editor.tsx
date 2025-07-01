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

const Editor = ({
  teamId,
  content,
}: {
  teamId: string;
  content: JSONContent;
}) => {
  const updateContentMutation = api.teams.updateTeam.useMutation();
  const onUpdate = useDebouncedCallback(
    ({ editor }: EditorEvents["update"]) => {
      const content = editor.getJSON();
      console.log(content);
      updateContentMutation.mutate({
        id: teamId,
        mdx: JSON.stringify(content),
      });
    },
    250,
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate,
  });

  return <EditorContent editor={editor} />;
};

export default Editor;
