import type { Card } from '../lib/types'

const COLOR_MAP: Record<string, string> = {
  red: '#E8192C',
  blue: '#0066CC',
  green: '#1AAB56',
  yellow: '#FFCC00',
  wild: '#111',
}

const COLOR_DARK: Record<string, string> = {
  red: '#9e0010',
  blue: '#003e7a',
  green: '#0a6630',
  yellow: '#a08000',
  wild: '#000',
}

interface CardSvgProps {
  card: Card
  faceDown?: boolean
  small?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
  highlighted?: boolean
}

export default function CardSvg({
  card,
  faceDown = false,
  small = false,
  className = '',
  onClick,
  disabled = false,
  highlighted = false,
}: CardSvgProps) {
  const W = 70
  const H = 100
  const bg = COLOR_MAP[card.color] ?? '#111'
  const dark = COLOR_DARK[card.color] ?? '#000'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={small ? 42 : 70}
      height={small ? 60 : 100}
      className={[
        'select-none',
        onClick && !disabled ? 'cursor-pointer' : '',
        highlighted ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : '',
        className,
      ].join(' ')}
      onClick={!disabled ? onClick : undefined}
      role={onClick ? 'button' : undefined}
    >
      {faceDown ? <CardBack W={W} H={H} /> : <CardFace W={W} H={H} card={card} bg={bg} dark={dark} />}
    </svg>
  )
}

function CardBack({ W, H }: { W: number; H: number }) {
  return (
    <>
      {/* Outer card */}
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={8} fill="#cc0000" stroke="#111" strokeWidth={1.5} />
      {/* Inner border */}
      <rect x={5} y={5} width={W - 10} height={H - 10} rx={5} fill="none" stroke="#fff" strokeWidth={1.5} />
      {/* UNO text */}
      <text
        x={W / 2} y={H / 2 + 6}
        textAnchor="middle"
        fontSize={22}
        fontWeight="900"
        fontFamily="Arial Black, sans-serif"
        fill="#fff"
        stroke="#111"
        strokeWidth={1}
        transform={`rotate(-25, ${W / 2}, ${H / 2})`}
      >
        UNO
      </text>
    </>
  )
}

function CardFace({
  W, H, card, bg, dark,
}: { W: number; H: number; card: Card; bg: string; dark: string }) {
  return (
    <>
      {/* Outer card body */}
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={8} fill={bg} stroke="#111" strokeWidth={1.5} />

      {/* Inner white oval */}
      {card.type !== 'wild' && card.type !== 'wild4' ? (
        <ellipse
          cx={W / 2} cy={H / 2}
          rx={22} ry={30}
          fill="white"
          transform={`rotate(25, ${W / 2}, ${H / 2})`}
        />
      ) : (
        <WildCircle cx={W / 2} cy={H / 2} r={24} />
      )}

      {/* Center symbol */}
      <CenterSymbol card={card} cx={W / 2} cy={H / 2} />

      {/* Corner top-left */}
      <CornerLabel card={card} x={5} y={6} flip={false} />

      {/* Corner bottom-right (rotated 180°) */}
      <g transform={`rotate(180, ${W / 2}, ${H / 2})`}>
        <CornerLabel card={card} x={5} y={6} flip={false} />
      </g>

      {/* Color dot in corners for action/wild cards */}
      {(card.type === 'wild' || card.type === 'wild4') && (
        <>
          <circle cx={8} cy={8} r={5} fill={COLOR_MAP.red} stroke="#111" strokeWidth={0.8} />
          <circle cx={W - 8} cy={H - 8} r={5} fill={COLOR_MAP.blue} stroke="#111" strokeWidth={0.8} />
        </>
      )}

      {/* Bottom stripe */}
      <rect x={1} y={H - 12} width={W - 2} height={11} rx={0} fill={dark} opacity={0.35}
        style={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
      <rect x={1} y={H - 12} width={W - 2} height={11}
        clipPath="url(#bottomClip)" fill={dark} opacity={0.35} />
    </>
  )
}

function WildCircle({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      {/* 4-quadrant pie */}
      <path d={`M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 0,1 ${cx + r},${cy} Z`} fill={COLOR_MAP.red} />
      <path d={`M${cx},${cy} L${cx + r},${cy} A${r},${r} 0 0,1 ${cx},${cy + r} Z`} fill={COLOR_MAP.blue} />
      <path d={`M${cx},${cy} L${cx},${cy + r} A${r},${r} 0 0,1 ${cx - r},${cy} Z`} fill={COLOR_MAP.yellow} />
      <path d={`M${cx},${cy} L${cx - r},${cy} A${r},${r} 0 0,1 ${cx},${cy - r} Z`} fill={COLOR_MAP.green} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#111" strokeWidth={1} />
      {/* Inner white oval overlay */}
      <ellipse cx={cx} cy={cy} rx={14} ry={20} fill="black" opacity={0.6}
        transform={`rotate(25, ${cx}, ${cy})`} />
    </>
  )
}

function CenterSymbol({ card, cx, cy }: { card: Card; cx: number; cy: number }) {
  const baseStyle = {
    textAnchor: 'middle' as const,
    dominantBaseline: 'central' as const,
    fontFamily: 'Arial Black, sans-serif',
    fontWeight: '900' as const,
    fill: card.color === 'yellow' ? '#222' : card.color === 'wild' ? '#fff' : '#fff',
    stroke: card.color === 'yellow' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.4)',
    strokeWidth: 0.5,
  }

  switch (card.type) {
    case 'skip':
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <circle r={12} fill="none" stroke={baseStyle.fill} strokeWidth={3} />
          <line x1={-8} y1={8} x2={8} y2={-8} stroke={baseStyle.fill} strokeWidth={3} strokeLinecap="round" />
        </g>
      )

    case 'reverse':
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          {/* Two curved arrows */}
          <path d="M-10,-4 Q0,-16 10,-4" fill="none" stroke={baseStyle.fill} strokeWidth={2.5} strokeLinecap="round" />
          <polygon points="-10,-4 -15,1 -5,1" fill={baseStyle.fill} />
          <path d="M10,4 Q0,16 -10,4" fill="none" stroke={baseStyle.fill} strokeWidth={2.5} strokeLinecap="round" />
          <polygon points="10,4 15,-1 5,-1" fill={baseStyle.fill} />
        </g>
      )

    case 'draw2':
      return (
        <text x={cx} y={cy} fontSize={15} {...baseStyle}>+2</text>
      )

    case 'wild':
      return (
        <text x={cx} y={cy} fontSize={9} {...baseStyle} fill="#fff" stroke="none">
          WILD
        </text>
      )

    case 'wild4':
      return (
        <text x={cx} y={cy} fontSize={8} {...baseStyle} fill="#fff" stroke="none">
          +4
        </text>
      )

    default:
      return (
        <text x={cx} y={cy} fontSize={28} {...baseStyle}>
          {card.type}
        </text>
      )
  }
}

function CornerLabel({ card, x, y }: { card: Card; x: number; y: number; flip: boolean }) {
  const fill = card.color === 'yellow' ? '#222' : '#fff'
  const fontSize = 9

  const label = card.type === 'skip' ? '⊘'
    : card.type === 'reverse' ? '⇄'
    : card.type === 'draw2' ? '+2'
    : card.type === 'wild' ? 'W'
    : card.type === 'wild4' ? 'W4'
    : card.type

  return (
    <text
      x={x + 4} y={y + fontSize}
      fontSize={fontSize}
      fontWeight="900"
      fontFamily="Arial Black, sans-serif"
      fill={fill}
    >
      {label}
    </text>
  )
}
