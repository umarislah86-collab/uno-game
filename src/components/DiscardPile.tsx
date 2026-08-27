import { AnimatePresence, motion } from 'framer-motion'
import type { Card } from '../lib/types'
import CardSvg from './CardSvg'

interface DiscardPileProps {
  topCard: Card | null
}

export default function DiscardPile({ topCard }: DiscardPileProps) {
  const rotation = topCard
    ? ((topCard.id.charCodeAt(0) + topCard.id.charCodeAt(1)) % 22) - 11
    : 0

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white/50 text-xs uppercase tracking-wider">Discard</span>
      <div className="w-[70px] h-[100px] rounded-lg border-2 border-white/20 flex items-center justify-center overflow-visible relative">
        <AnimatePresence mode="popLayout">
          {topCard ? (
            <motion.div
              key={topCard.id}
              layoutId={topCard.id}
              initial={{ y: -200, scale: 0.75, opacity: 0.6, rotate: rotation + 30 }}
              animate={{ y: 0, scale: 1, opacity: 1, rotate: rotation }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              style={{ position: 'absolute' }}
            >
              <CardSvg card={topCard} />
            </motion.div>
          ) : (
            <span className="text-white/30 text-sm">Empty</span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
