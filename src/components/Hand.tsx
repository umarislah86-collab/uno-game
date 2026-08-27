import { AnimatePresence, motion } from 'framer-motion'
import type { Card, CardColor, CardType, GameMode } from '../lib/types'
import { isPlayable } from '../lib/gameLogic'
import CardSvg from './CardSvg'

interface HandProps {
  cards: Card[]
  isMyTurn: boolean
  topCard: Card
  currentColor: CardColor
  pendingStack?: number
  gameMode?: GameMode
  multiPlayType?: CardType | null
  onPlay: (card: Card) => void
}

export default function Hand({
  cards,
  isMyTurn,
  topCard,
  currentColor,
  pendingStack = 0,
  gameMode = 'standard',
  multiPlayType = null,
  onPlay,
}: HandProps) {
  return (
    // Outer wrapper: clip x-overflow but leave room for hover-lift above
    <div
      className="overflow-x-auto pb-2"
      style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' as never }}
    >
      {/* Inner row: padTop gives room for hover lift, px guards edges */}
      <div
        className="flex items-end px-3"
        style={{ paddingTop: 20, minWidth: 'max-content' }}
      >
        <AnimatePresence initial={false}>
          {cards.map((card, i) => {
            const playable = isMyTurn && isPlayable(card, topCard, currentColor, pendingStack, gameMode, multiPlayType)
            return (
              <motion.div
                key={card.id}
                layoutId={card.id}
                layout="position"
                initial={{ scale: 0.6, opacity: 0, x: -40 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                whileHover={playable ? { y: -18, scale: 1.08, zIndex: 50 } : {}}
                style={{ marginLeft: i === 0 ? 0 : -20, zIndex: i, position: 'relative' }}
              >
                <CardSvg
                  card={card}
                  onClick={playable ? () => onPlay(card) : undefined}
                  disabled={!playable}
                  highlighted={playable}
                  className={!playable ? 'opacity-55' : ''}
                />
                {playable && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
