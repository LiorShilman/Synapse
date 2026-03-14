import { motion, AnimatePresence } from 'framer-motion';
import { useSimStore } from '../../store/useSimStore';

export default function ConsensusExplosion() {
  const activeEvent = useSimStore((s) =>
    s.consensusEvents.find((c) => c.active)
  );

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          className="consensus-explosion"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="consensus-burst"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
          <motion.div
            className="consensus-content"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="consensus-symbol">⬡</div>
            <div className="consensus-title">הושג קונצנזוס</div>
            <div className="consensus-insight">{activeEvent.insight}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
