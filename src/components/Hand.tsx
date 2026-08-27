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
    <div className="flex items-end justify-center gap-1 flex-wrap px-2 pb-2">
      <AnimatePresence>
        {cards.map((card, i) => {
          const playable = isMyTurn && isPlayable(card, topCard, currentColor, pendingStack, gameMode, multiPlayType)
          return (
            <motion.div
              key={card.id}
              initial={{ scale: 0, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, y: -30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.04 }}
              whileHover={playable ? { y: -14, scale: 1.12 } : {}}
              className="relative"
            >
              <CardSvg
                card={card}
                onClick={playable ? () => onPlay(card) : undefined}
                disabled={!playable}
                highlighted={playable}
                className={!playable ? 'opacity-60' : ''}
              />
              {playable && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-white"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
