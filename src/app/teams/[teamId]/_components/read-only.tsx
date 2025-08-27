"use client";

const ReadOnly = ({ content }: { content: string | null }) => {
  if (!content) {
    return null;
  }

  return (
    <div
      className="tiptap"
      dangerouslySetInnerHTML={{
        __html: content,
      }}
    />
  );
};
export default ReadOnly;
