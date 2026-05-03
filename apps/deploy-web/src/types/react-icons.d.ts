import "react-icons/md";

// Fix react-icons type mismatch with React 18 types
// react-icons returns `IconType` which uses an older JSX return type
declare module "react-icons/lib" {
  import type { FC, SVGAttributes } from "react";
  export type IconType = FC<SVGAttributes<SVGElement> & { size?: string | number; color?: string; title?: string }>;
}
