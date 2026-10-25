import { useId, useState } from 'react'
import { practiceById } from '../data/practices.ts'
import { scenario } from '../data/scenario.ts'
import type { Checkpoint, Layout, PracticeId } from '../types.ts'

export function PracticeDrawing({ id, x, y, year = 15 }: { id: PracticeId; x: number; y: number; year?: Checkpoint }) {
  if (id === 'trees') {
    const scale = year === 0 ? 0.55 : year === 5 ? 0.8 : 1
    return <g transform={`translate(${x} ${y}) scale(${scale})`} className="practice-drawing">
      <ellipse cx="3" cy="7" rx="24" ry="10" fill="#31533b" opacity=".12" />
      <path d="M0 2V-35M0-18l-9-10M0-25l11-12" stroke="#77654b" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="-10" cy="-38" rx="19" ry="21" fill="#619864" />
      <ellipse cx="12" cy="-38" rx="20" ry="22" fill="#478655" />
      <ellipse cx="0" cy="-54" rx="21" ry="21" fill="#79aa70" />
      <path d="M-11-59c4-5 11-6 16-3" stroke="#b2cf91" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <circle cx="16" cy="-44" r="3" fill="#a7c588" />
    </g>
  }
  if (id === 'rain') {
    return <g transform={`translate(${x} ${y})`} className="practice-drawing">
      <path d="M-36-1Q-37-13-19-17L14-14Q38-9 37 0Q30 17 4 18L-23 9Z" fill="#6b9e8e" />
      <path d="M-23-3Q-19-11-3-9L19-5Q31 0 18 7L-4 11Q-26 7-23-3Z" fill="#9ec4c4" />
      <path d="M-12 0q11-5 21 1M-5 6q10-4 17-1" stroke="#dbe9de" strokeWidth="2" fill="none" strokeLinecap="round" />
      {[[-25, -9], [19, -6], [8, 9], [-15, 7]].map(([a, b], index) => <g key={index} transform={`translate(${a} ${b})`}>
        <path d="M0 0V-16M0-4l-5-8M0-5l5-7" stroke="#427957" strokeWidth="2" strokeLinecap="round" />
        <path d="M0-15v-6" stroke="#ad8550" strokeWidth="4" strokeLinecap="round" />
      </g>)}
      <ellipse cx="-32" cy="1" rx="5" ry="3" fill="#c8c6a5" />
      <ellipse cx="29" cy="6" rx="6" ry="3" fill="#c8c6a5" />
    </g>
  }
  if (id === 'food') {
    return <g transform={`translate(${x} ${y})`} className="practice-drawing">
      <path d="M-34-8L0-25L34-8L0 9Z" fill="#a77649" />
      <path d="M-34-8v8L0 17V9Z" fill="#bb9063" />
      <path d="M0 9L34-8V0L0 17Z" fill="#926c44" />
      <path d="M-27-8L0-21L27-8L0 5Z" fill="#675843" />
      {[[-15, -9], [0, -16], [15, -9], [0, -2]].map(([a, b], index) => <g key={index} transform={`translate(${a} ${b})`}>
        <path d="M0 0v-10" stroke="#789456" strokeWidth="2" />
        <ellipse cx="-4" cy="-8" rx="5" ry="3" fill="#7da55d" transform="rotate(30 -4 -8)" />
        <ellipse cx="4" cy="-11" rx="5" ry="3" fill="#91b575" transform="rotate(-30 4 -11)" />
        <circle cx="1" cy="-5" r="2.5" fill={index % 2 ? '#dcaa58' : '#c88153'} />
      </g>)}
    </g>
  }
  if (id === 'native') {
    return <g transform={`translate(${x} ${y})`} className="practice-drawing">
      <ellipse cx="0" cy="4" rx="35" ry="14" fill="#98ab70" opacity=".8" />
      {[[-20, -2], [-7, 3], [9, 4], [21, -3], [0, -8]].map(([a, b], index) => <g key={index} transform={`translate(${a} ${b})`}>
        <path d="M0 3V-18M0-4l-6-6M0-3l6-8" stroke="#638251" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="-5" cy="-8" rx="5" ry="2" fill="#81a264" transform="rotate(30 -5 -8)" />
        <circle cx="0" cy="-19" r="5" fill={index % 2 ? '#d1af67' : '#d9b5a1'} />
        <circle cx="0" cy="-19" r="2" fill="#f6e3a5" />
      </g>)}
      <path d="M-31 2l4-9 3 9M25 4l4-8 3 8" stroke="#749056" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  }
  return <g transform={`translate(${x} ${y})`} className="practice-drawing">
    <path d="M-41-1L-5-20L41 2L5 20Z" fill="#e1dfc8" />
    <path d="M-32-1L-4-15L32 2L4 15Z" fill="#c4c8b6" />
    <path d="M-22-6L14 12M-12-11L24 7M-12 9L15-5M-24 3L4-11" stroke="#f7f6e8" strokeWidth="3" />
    <path d="M-42 3l-5-6M37 9l5-6" stroke="#819563" strokeWidth="3" strokeLinecap="round" />
  </g>
}

function Hall({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} className="hall-drawing">
    <ellipse cx="5" cy="8" rx="40" ry="15" fill="#35523b" opacity=".13" />
    <path d="M-32-5L0 11V-29L-32-45Z" fill="#e0d7ba" />
    <path d="M0 11L32-5V-45L0-29Z" fill="#c6cbb8" />
    <path d="M-38-45L0-67L38-45L0-25Z" fill="#758675" />
    <path d="M-38-45L0-67L0-45L0-25Z" fill="#92a18a" />
    <path d="M7 7V-13L18-19V1Z" fill="#6c8170" />
    <path d="M-25-30l9 5v12l-9-5Z" fill="#9bada5" />
    <path d="M-12-23l8 4v12l-8-4Z" fill="#9bada5" />
    <path d="M20-28l7-4v11l-7 4Z" fill="#8caba5" />
    <path d="M9-51l8-5v-12l-8 4Z" fill="#adb6a0" />
    <text x="-26" y="-6" fontSize="6" fill="#6c765e" transform="rotate(27 -26 -6)" fontWeight="700" letterSpacing="1">HALL</text>
    <path d="M8 10l16-8 5 3-16 8Z" fill="#d4d3be" />
  </g>
}

function Neighbor({ x, y, color }: { x: number; y: number; color: string }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="5" rx="6" ry="2" fill="#50604c" opacity=".12" />
    <path d="M-2 0v5M2 0v5" stroke="#536151" strokeWidth="2" strokeLinecap="round" />
    <path d="M0-2v-9" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <circle cy="-15" r="3" fill="#a17e5b" />
  </g>
}

export function BlockScene({
  layout,
  year,
  tool = 'trees',
  onPlace,
  compact = false,
}: { layout: Layout; year: Checkpoint; tool?: PracticeId | 'remove'; onPlace?: (index: number) => void; compact?: boolean }) {
  const [hover, setHover] = useState<number | null>(null)
  const patternId = useId().replace(/:/g, '')
  const positions = layout.map((_, index) => {
    const column = index % scenario.columns
    const row = Math.floor(index / scenario.columns)
    return { x: 370 + (column - row) * 60, y: 112 + (column + row) * 30 }
  })
  return <svg className={`block-scene ${compact ? 'compact' : ''}`} viewBox="30 45 740 420" role={onPlace ? 'group' : 'img'} aria-label={onPlace ? 'Editable neighborhood block. Select a practice, then choose an open plot.' : 'Neighborhood design illustration'}>
    <defs>
      <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r=".7" fill="#bfc8b6" opacity=".6" />
      </pattern>
      <filter id={`${patternId}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#4d6045" floodOpacity=".08" />
      </filter>
    </defs>
    <rect width="800" height="490" fill={`url(#${patternId})`} />
    <g aria-hidden="true">
      <path d="M56 205L316 72L738 286L479 420Z" fill="#e7e9dc" />
      <path d="M60 250L331 113L723 310L454 449Z" fill="none" stroke="#d3d9c8" strokeWidth="29" />
      <path d="M60 250L331 113L723 310L454 449Z" fill="none" stroke="#eef0e6" strokeWidth="1.5" strokeDasharray="9 10" />
      <text x="98" y="287" fill="#8d9882" fontSize="11" letterSpacing="3" transform="rotate(27 98 287)">NEIGHBORHOOD WAY</text>
      <path d="M370 121L670 271L430 391L130 241V232L370 112Z" fill="#b4bda4" filter={`url(#${patternId}-shadow)`} />
      <path d="M130 232L430 382V391L130 241Z" fill="#b8c0a7" />
      <path d="M430 382L670 262V271L430 391Z" fill="#9da98e" />
      <Neighbor x={220} y={329} color="#ac7c55" />
      <Neighbor x={239} y={339} color="#718d83" />
      <Neighbor x={625} y={337} color="#a19c6a" />
      <path d="M655 160l24 12-8 4-24-12Z" fill="#bdc6ac" />
      <path d="M655 156l24 12v4l-24-12Z" fill="#7b9173" />
      <path d="M660 163v7M674 170v7" stroke="#7b9173" strokeWidth="2" />
      <path d="M81 360l29-15 20 10-29 15Z" fill="#ccd5ba" />
      <path d="M88 356l12-6 17 8-12 6Z" fill="#e8ead7" />
      <path d="M88 356v8l17 8v-8M105 372l12-6v-8" fill="#aab79d" />
      <g transform="translate(710 416)">
        <circle r="23" fill="#f4f5eb" stroke="#d7dece" />
        <path d="M0-14L5 7L0 3L-5 7Z" fill="#6f836b" />
        <text y="-30" textAnchor="middle" fontSize="10" fill="#7c8e75" letterSpacing="1">N</text>
      </g>
    </g>
    {positions.map(({ x, y }, index) => {
      const fixed = scenario.fixedPlots[index]
      const planted = layout[index]
      const hovered = hover === index && !fixed && Boolean(onPlace)
      const paving = scenario.pavement.includes(index)
      const points = `${x},${y} ${x + 60},${y + 30} ${x},${y + 60} ${x - 60},${y + 30}`
      const label = `Plot ${index + 1}: ${planted ? practiceById[planted].name : paving ? 'paving' : 'dry grass'}`
      return <g
        key={index}
        className={`plot ${onPlace && !fixed ? 'editable' : ''} ${hovered ? 'hovered' : ''}`}
        role={onPlace && !fixed ? 'button' : undefined}
        tabIndex={onPlace && !fixed ? 0 : undefined}
        aria-label={fixed ? undefined : label}
        aria-pressed={onPlace && !fixed ? Boolean(planted) : undefined}
        data-plot={index}
        onClick={() => !fixed && onPlace?.(index)}
        onMouseEnter={() => setHover(index)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(index)}
        onBlur={() => setHover(null)}
        onKeyDown={(event) => {
          if (onPlace && !fixed && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            onPlace(index)
          }
        }}
      >
        <title>{fixed === 'hall' ? 'Existing community hall — protected' : fixed === 'existing-tree' ? 'Existing tree — protected' : label}</title>
        <polygon className="plot-ground" points={points} fill={planted ? '#c8d5b8' : paving ? '#e4e3d5' : '#d7d6b5'} stroke="#f0f0df" strokeWidth="1.5" />
        <g pointerEvents="none" aria-hidden="true">
          {!planted && !fixed && (paving
            ? <path d={`M${x - 30} ${y + 15}l60 30M${x + 30} ${y + 15}l-60 30`} stroke="#d2d4c4" strokeWidth="1" />
            : <g stroke="#b9bd92" strokeWidth="1.5" fill="none" strokeLinecap="round">
              <path d={`M${x - 21} ${y + 29}l-3-6m3 6 3-4M${x + 18} ${y + 40}l-3-6m3 6 3-4M${x + 6} ${y + 16}l2-5`} />
              <circle cx={x - 4} cy={y + 43} r="1" fill="#b9bd92" />
            </g>)}
          {fixed === 'hall' && <Hall x={x} y={y + 29} />}
          {fixed === 'existing-tree' && <PracticeDrawing id="trees" x={x} y={y + 31} />}
          {planted && <PracticeDrawing id={planted} x={x} y={y + 29} year={year} />}
          {hovered && tool !== 'remove' && !planted && <g opacity=".45"><PracticeDrawing id={tool} x={x} y={y + 29} year={year} /></g>}
        </g>
        {onPlace && !fixed && <polygon className="plot-focus" points={points} fill={hovered && tool === 'remove' ? '#bb745522' : 'none'} stroke={tool === 'remove' ? '#b77455' : '#315f43'} strokeWidth="2" strokeDasharray="5 4" pointerEvents="none" />}
      </g>
    })}
    {!compact && <g aria-hidden="true">
      <path d="M42 431h20M52 421v20" stroke="#9aac8a" strokeWidth="1" />
      <text x="73" y="435" fontSize="11" fill="#8a967d" letterSpacing=".3">A little space. Many possible futures.</text>
    </g>}
  </svg>
}
