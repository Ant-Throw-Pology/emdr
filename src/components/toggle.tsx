import { motion } from "motion/react";
import { type ReactNode } from "react";

export function Toggle({
  children,
  open,
  topGap = false,
}: {
  children?: ReactNode;
  open: boolean;
  topGap?: boolean;
}) {
  return (
    <motion.div
      className="toggle-contents"
      initial={false}
      animate={
        open
          ? { height: "auto", opacity: 1, marginBlockStart: topGap ? "8px" : 0 }
          : { height: 0, opacity: 0, marginBlockStart: 0 }
      }
      inert={!open}
    >
      {children}
    </motion.div>
  );
}
