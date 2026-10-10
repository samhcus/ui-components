import * as React from "react";

interface PushButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PushButton({ children, className, ...props }: PushButtonProps) {
  return (
    <button className={`push-btn${className ? ` ${className}` : ""}`} {...props}>
      <span className="push-btn-back" />
      <span className="push-btn-front">{children}</span>
    </button>
  );
}
