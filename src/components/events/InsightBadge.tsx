import { motion, AnimatePresence } from 'framer-motion';

interface InsightBadgeProps {
  text: string;
  color: string;
  visible: boolean;
}

export default function InsightBadge({ text, color, visible }: InsightBadgeProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="insight-badge text-agent"
          style={{ '--agent-color': color, borderColor: color } as React.CSSProperties}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ duration: 0.4 }}
        >
          ✦ {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
