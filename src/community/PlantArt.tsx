import { plantById } from './plants.ts'
import type { PlantId } from './types.ts'

export function PlantArt({ id }: { id: PlantId }) {
  const plant = plantById[id]
  return <svg viewBox="0 0 80 80" aria-hidden="true" className="plant-art">
    <ellipse cx="40" cy="68" rx="26" ry="6" fill="#7a7651" opacity=".12" />
    {plant.icon === 'tomato' ? <>
      <path d="M39 30 Q31 9 48 11" fill="none" stroke="#58814e" strokeWidth="5" strokeLinecap="round" />
      <path d="M43 17 Q59 6 64 19 Q53 27 43 17" fill="#78985d" />
      <path d="M39 34 Q12 23 14 47 Q16 70 41 69 Q68 68 67 45 Q65 23 39 34" fill={plant.color} stroke="#a65642" strokeWidth="2" />
      <path d="M40 31 L29 36 L39 38 L41 47 L45 37 L56 33 L45 32 L40 22 Z" fill="#60864b" />
      <path d="M24 47 Q20 56 28 60" fill="none" stroke="#f0b28b" strokeWidth="4" strokeLinecap="round" />
    </> : plant.icon === 'leaf' ? <>
      <path d="M40 67 Q24 60 19 46 Q9 43 13 32 Q10 19 23 19 Q30 9 41 16 Q51 7 60 20 Q73 18 69 34 Q77 43 64 49 Q61 64 40 67" fill={plant.color} stroke="#56764a" strokeWidth="2" />
      <path d="M40 66 L40 29 M39 48 L25 34 M40 55 L57 36" fill="none" stroke="#bed0a0" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 18 Q34 23 30 29 M60 24 Q54 23 52 29" fill="none" stroke="#9db586" strokeWidth="2" />
    </> : <>
      <path d="M40 68 Q32 53 41 33 M37 56 Q57 40 63 44 M37 59 Q21 49 18 54" fill="none" stroke="#648449" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M40 52 Q61 55 60 41 Q46 40 40 52 M36 62 Q15 64 18 51 Q28 49 36 62" fill="#92a864" stroke="#6c874a" strokeWidth="1.5" />
      {id === 'fuchsia' ? <>
        <path d="M42 27 Q51 14 66 20 L66 34 Q53 41 42 30" fill={plant.color} stroke="#a85345" strokeWidth="2" />
        <path d="M64 27 L74 31 M64 25 L75 25" stroke="#ddab65" strokeWidth="2" />
        <path d="M38 34 Q26 20 14 26 L14 40 Q26 44 38 37" fill={plant.color} stroke="#a85345" strokeWidth="2" />
      </> : <>
        {[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cx="40" cy="22" rx={id === 'poppy' ? 11 : 9} ry="15" fill={plant.color} stroke="#b4894f" strokeWidth="1" transform={`rotate(${angle} 40 33)`} />)}
        <circle cx="40" cy="33" r="7" fill={id === 'poppy' ? '#9c7537' : '#e6d7b7'} />
      </>}
    </>}
  </svg>
}

export function GardenPreview({ selected, kind = 'new-garden' }: { selected: PlantId[]; kind?: string }) {
  const choices = selected.length ? selected : ['poppy', 'kale', 'fuchsia'] as PlantId[]
  return <svg className="garden-preview" viewBox="0 0 520 175" role="img" aria-label="An illustrative garden made from your planting choices">
    <rect width="520" height="175" rx="24" fill="#e8ecd8" />
    <path d="M0 129 Q82 109 184 132 T376 128 T520 122 L520 175 L0 175Z" fill="#d5dfbe" />
    <path d="M25 133 L501 133" stroke="#bbca9f" strokeWidth="3" strokeLinecap="round" />
    <circle cx="468" cy="33" r="16" fill="#e4d492" opacity=".65" />
    {[0, 1, 2, 3].map(index => {
      const plant = plantById[choices[index % choices.length]]
      const x = 45 + index * 117
      return <g key={index} transform={`translate(${x} 0)`}>
        <ellipse cx="42" cy="140" rx="52" ry="9" fill="#80956a" opacity=".2" />
        <path d="M-5 111 L82 111 L97 134 L7 134 Z" fill={kind === 'landscape' ? '#9b9362' : '#ad805c'} stroke="#795d45" strokeWidth="2" />
        <path d="M7 134 L97 134 L97 143 L7 143Z" fill="#b58c6a" stroke="#795d45" strokeWidth="2" />
        <path d="M2 113 L77 113 L88 129 L13 129Z" fill="#6f654d" />
        <path d="M25 118 Q16 91 28 74 M47 116 Q43 90 54 69 M65 121 Q63 105 76 91" fill="none" stroke="#567c43" strokeWidth="4" strokeLinecap="round" />
        {plant.icon === 'tomato' ? <g fill={plant.color} stroke="#ad5f46"><circle cx="24" cy="85" r="10" /><circle cx="56" cy="83" r="11" /><circle cx="72" cy="103" r="8" /></g> : plant.icon === 'leaf' ? <g fill={plant.color} stroke="#51774d"><ellipse cx="19" cy="88" rx="12" ry="20" transform="rotate(-25 19 88)" /><ellipse cx="51" cy="85" rx="14" ry="23" transform="rotate(21 51 85)" /><ellipse cx="77" cy="100" rx="11" ry="15" /></g> : <g fill={plant.color} stroke="#a4804b">{[[26, 72], [55, 70], [76, 91]].map(([cx, cy], i) => <g key={i}>{[0, 90, 180, 270].map(angle => <ellipse key={angle} cx={cx} cy={cy - 5} rx="6" ry="9" transform={`rotate(${angle} ${cx} ${cy})`} />)}<circle cx={cx} cy={cy} r="4" fill="#e9d8a4" /></g>)}</g>}
      </g>
    })}
    <g transform="translate(230 33)" stroke="#9c925e" strokeWidth="1.4"><path d="M0 0 Q-14 -14 -17 -2 Q-15 9 0 4 Q15 13 18 0 Q14 -9 0 2" fill="#e2be73" /><path d="M0 0 L0 9" /></g>
  </svg>
}
