import React from "react";

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  className = "w-4 h-4",
  size,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size || 24}
      height={size || 24}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Outer Bold Target Ring */}
      <circle cx="16" cy="16" r="12.5" strokeWidth="2.8" />
      {/* Inward Crosshair Ticks */}
      <line x1="16" y1="1" x2="16" y2="7" strokeWidth="3.2" />
      <line x1="16" y1="25" x2="16" y2="31" strokeWidth="3.2" />
      <line x1="1" y1="16" x2="7" y2="16" strokeWidth="3.2" />
      <line x1="25" y1="16" x2="31" y2="16" strokeWidth="3.2" />
      {/* Center Agent Keyhole */}
      <path
        d="M16 10.2 a3.2 3.2 0 0 1 2.3 5.4 L19.6 21 a0.5 0.5 0 0 1 -0.5 0.6 H12.9 a0.5 0.5 0 0 1 -0.5 -0.6 L13.7 15.6 A3.2 3.2 0 0 1 16 10.2 z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
};
