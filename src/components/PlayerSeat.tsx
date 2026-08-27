import { motion } from 'framer-motion'

interface PlayerSeatProps {
  name: string
  cardCount: number
  isCurrentTurn: boolean
  isMe: boolean
  isConnected: boolean
}

export default function PlayerSeat({ name, cardCount, isCurrentTurn, isConnected }: PlayerSeatProps) {
  return (
    <motion.div
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-xl transition',
        isCurrentTurn ? 'bg-yellow-400/15 ring-1 ring-yellow-400' : 'bg-white/5',
        !isConnected ? 'opacity-40' : '',
      ].join(' ')}
      animate={isCurrentTurn ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.5 }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-sm">
          {name[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="absolute -top-1 -right-1.5 bg-yellow-500 text-black text-[10px] font-black w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center leading-none px-0.5">
          {cardCount}
        </span>
      </div>

      {/* Name + turn */}
      <div className="min-w-0">
        <p className="text-white text-sm font-bold leading-tight truncate max-w-[80px]">{name}</p>
        {isCurrentTurn && (
          <motion.p
            className="text-yellow-400 text-[10px] font-bold leading-tight"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            ▶ TURN
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
