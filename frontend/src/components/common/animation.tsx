import React from "react";
import { motion, Variants } from "framer-motion";

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    flex: 1,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0.5,
  },
};

interface AnimationLoadProps {
  children: React.ReactNode;
}

const AnimationLoad: React.FC<AnimationLoadProps> = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};
export default AnimationLoad;
