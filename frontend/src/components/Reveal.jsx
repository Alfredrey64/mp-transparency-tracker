import { motion, useReducedMotion } from "framer-motion";

// Fades its content up the first time it scrolls into view. With reduced
// motion preferred it simply appears.
export default function Reveal({ children, delay = 0, y = 18 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
