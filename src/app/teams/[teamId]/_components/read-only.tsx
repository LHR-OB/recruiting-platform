"use client";

const ReadOnly = ({ content }: { content: string | null }) => {
  if (!content) {
    return null;
  }

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: content,
      }}
    />
  );
};
export default ReadOnly;
