import * as React from "react";

interface EmailTemplateProps {
  name: string;
}

export function EmailTemplate({ name }: EmailTemplateProps) {
  return (
    <div>
      <p>{name}</p>
      <br />
      <p>
        There has been an update to your application for Longhorn Racing. Please
        log in to your account to view the latest status of your application.
        Longhorn Racing https://recruiting.longhornracing.org/
      </p>
    </div>
  );
}
