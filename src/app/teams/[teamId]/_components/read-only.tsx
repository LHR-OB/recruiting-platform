"use client";

const ReadOnly = ({ content }: { content: string }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: content,
      }}
    />
  );
};
export default ReadOnly;
