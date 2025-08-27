"use client";

import {
  useEditor,
  EditorContent,
  type EditorEvents,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";

const FaqEditor = ({ faqId, content }: { faqId: string; content: string }) => {
  const updateFaqMutation = api.faq.updateFaq.useMutation();
  const onUpdate = useDebouncedCallback(
    ({ editor }: EditorEvents["update"]) => {
      const content = editor.getJSON();
      updateFaqMutation.mutate({
        id: faqId,
        mdx: JSON.stringify(content),
      });
    },
    250,
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write FAQ content …",
      }),
    ],
    content,
    onUpdate,
    immediatelyRender: false,
  });

  return <EditorContent editor={editor} />;
};

export default FaqEditor;
