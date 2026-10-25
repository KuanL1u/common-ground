import type { ReactNode } from 'react'
import type { FarmChoice, FarmResult, HotspotId, ParkChoice, ParkResult, Weather } from './types.ts'

export function Tree({ x = 0, y = 0, scale = 1, variant = 0, young = false }: { x?: number; y?: number; scale?: number; variant?: number; young?: boolean }) {
  const colors = ['#679465', '#7ca16b', '#4f855e', '#8ba66b']
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className="tree-art">
    <ellipse cx="4" cy="4" rx={young ? 17 : 33} ry="10" fill="#5d7447" opacity=".13" />
    <path d={young ? 'M0 0 Q-3-20 0-45' : 'M-5 0 L-4-44 L-16-58 M5 0 L3-50 L19-64'} fill="none" stroke="#896c4e" strokeWidth={young ? 5 : 11} strokeLinecap="round" />
    <g className="tree-leaves">
      {young ? <><ellipse cx="-6" cy="-47" rx="18" ry="14" fill={colors[variant % 4]} /><ellipse cx="9" cy="-57" rx="18" ry="18" fill="#80a572" /><path d="M-9-53 L3-62" stroke="#dce9b4" strokeWidth="3" strokeLinecap="round" /></>
        : <><path d="M-45-47 Q-64-71-36-85 Q-35-113-7-107 Q13-130 29-102 Q63-109 67-79 Q86-62 61-42 Q40-22 17-36 Q-11-16-31-35 Q-43-30-45-47Z" fill={colors[variant % 4]} stroke="#416c49" strokeWidth="1.7" /><path d="M-34-77 Q-30-93-13-88 M10-98 Q24-109 35-88 M39-65 Q54-75 58-60" fill="none" stroke="#c2dba3" strokeWidth="5" strokeLinecap="round" opacity=".7" /><path d="M-24-48 Q-5-40 4-51 M19-54 Q32-42 46-53" fill="none" stroke="#48774c" strokeWidth="3" strokeLinecap="round" opacity=".45" /></>}
    </g>
  </g>
}

export function Person({ x = 0, y = 0, scale = 1, color = '#ce8863', walking = false }: { x?: number; y?: number; scale?: number; color?: string; walking?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className={walking ? 'person-art walking' : 'person-art'}>
    <ellipse cy="2" rx="11" ry="4" fill="#435541" opacity=".16" />
    <path d="M-4-12 L-5 0 M4-12 L6 0" stroke="#4d5860" strokeWidth="5" strokeLinecap="round" className="person-legs" />
    <path d="M-6-31 Q0-35 7-30 L9-13 Q1-8-9-14Z" fill={color} stroke="#405849" strokeWidth=".8" />
    <path d="M-8-28 L-13-17 M8-28 L13-19" stroke="#b78058" strokeWidth="4" strokeLinecap="round" />
    <circle cy="-41" r="9" fill="#b78058" /><path d="M-9-40 Q-12-52 0-52 Q12-52 9-40 L6-44 Q0-42-7-45Z" fill="#3b3e33" />
    <path d="M-10-47 Q0-58 11-46 L17-45 L-9-44Z" fill="#debe72" />
    <path d="M7-29 Q15-34 16-23 L14-12 L8-14Z" fill="#779775" />
  </g>
}

export function Flower({ x, y, color = '#e7b667', scale = 1 }: { x: number; y: number; color?: string; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0 0 L1-17 M1-6 Q-12-15-9-5 M1-10 Q12-17 10-8" stroke="#648456" strokeWidth="2.5" fill="#83a06c" /><g fill={color}><circle cx="-5" cy="-19" r="5" /><circle cx="5" cy="-19" r="5" /><circle cy="-25" r="5" /><circle cy="-15" r="5" /></g><circle cy="-20" r="3" fill="#a77544" /></g>
}

export function Bench({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cx="4" cy="4" rx="41" ry="8" fill="#5b7044" opacity=".14" /><path d="M-28-8 L-30 5 M29-8 L31 5 M-28-8 L-28-31 M28-8 L28-31" stroke="#59695a" strokeWidth="5" strokeLinecap="round" /><path d="M-36-30 L36-30 L36-19 L-36-19Z M-38-14 L38-14 L44-7 L-38-7Z" fill="#c6a277" stroke="#9c7d5e" strokeWidth="1.5" /><path d="M-31-25 L29-25 M-31-10 L33-10" stroke="#e6c99a" strokeWidth="2" /></g>
}

export function House({ x = 0, y = 0, scale = 1, color = '#d9bba0' }: { x?: number; y?: number; scale?: number; color?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-32 0 L-32-35 L0-61 L35-38 L35 0Z" fill={color} stroke="#9d8c6e" strokeWidth="1.5" /><path d="M-37-33 L0-64 L40-35 L30-31 L0-52 L-29-27Z" fill="#ae806a" stroke="#956f5d" strokeWidth="1" /><path d="M-17-26 L-5-26 L-5-13 L-17-13Z M13-26 L26-26 L26-13 L13-13Z" fill="#b3cfcd" stroke="#f5eee0" strokeWidth="3" /><path d="M-2 0 L-2-22 L11-22 L11 0" fill="#766e5c" /><path d="M-35 1 L38 1" stroke="#c3bd9e" strokeWidth="5" /></g>
}

export function RaisedBed({ x = 0, y = 0, scale = 1, vitality = 80, covered = false }: { x?: number; y?: number; scale?: number; vitality?: number; covered?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-78-5 L50-22 L82 0 L-43 19Z" fill="#b89a73" stroke="#9c7d59" strokeWidth="2" /><path d="M-78-5 L-43 19 L-43 36 L-78 12Z" fill="#be9a6c" stroke="#99744f" strokeWidth="1" /><path d="M-43 19 L82 0 L82 17 L-43 36Z" fill="#ccac7d" stroke="#99744f" strokeWidth="1" /><path d="M-68-5 L49-18 L68-2 L-41 11Z" fill={covered ? '#b6a16e' : '#8f6d4d'} />
    {Array.from({ length: 8 }, (_, i) => <g key={i} transform={`translate(${-42 + (i % 4) * 27} ${-5 + Math.floor(i / 4) * 10 - (i % 4) * 3})`}><path d={vitality > 40 ? 'M0 0 Q-3-10 0-22' : 'M0 0 Q-3-18 9-16'} stroke={vitality > 40 ? '#597b48' : '#95825a'} strokeWidth="2.5" fill="none" /><path d="M0-9 Q-17-27-16-12 Q-8-4 0-9 M0-16 Q15-31 15-17 Q7-9 0-16Z" fill={vitality > 55 ? '#6e9a58' : vitality > 30 ? '#a5ac65' : '#bda16a'} /></g>)}
  </g>
}

export function CompostBin({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="5" rx="40" ry="10" fill="#536748" opacity=".12" /><path d="M-30-56 L29-64 L38-47 L35 1 L-25 9 L-33-7Z" fill="#baa077" stroke="#866b4f" strokeWidth="2" /><path d="M-30-56 L-22-42 L38-47 L29-64Z" fill="#7d7049" /><path d="M-22-42 L-25 9 L35 1 L38-47Z" fill="#d1b07e" /><path d="M-23-26 L37-33 M-24-9 L36-16" stroke="#ac895e" strokeWidth="4" /><path d="M4-65 Q-6-88-16-72 Q-12-62 4-65 M9-62 Q26-89 30-67 Q20-59 9-62Z" fill="#729466" /><ellipse cx="6" cy="-19" rx="12" ry="11" fill="#edddaf" /><path d="M6-26 Q-5-21 1-16 Q7-12 13-19" fill="none" stroke="#5f7f4b" strokeWidth="2" /></g>
}

export function LibraryBuilding({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cx="4" cy="7" rx="68" ry="15" fill="#7e7350" opacity=".13" /><path d="M-64-10 L-64-62 L44-62 L66-44 L66 5 L-43 5Z" fill="#d8b898" stroke="#a58568" strokeWidth="1.5" /><path d="M-64-62 L-42-79 L65-78 L44-62Z" fill="#7d9380" stroke="#61765f" strokeWidth="1.5" /><path d="M44-62 L65-78 L66 5 L44-10Z" fill="#b89c82" /><path d="M-55-44 L-17-44 L-17-16 L-55-16Z M-5-44 L32-44 L32-16 L-5-16Z" fill="#b6d0c7" stroke="#f3e7ce" strokeWidth="4" /><path d="M-36-44 L-36-16 M13-44 L13-16" stroke="#f3e7ce" strokeWidth="3" /><path d="M-15 5 L-15-23 L7-23 L7 5" fill="#6b7868" stroke="#e9d8b4" strokeWidth="3" /><rect x="-50" y="-63" width="84" height="13" rx="2" fill="#eaddbd" /><text x="-8" y="-53" textAnchor="middle" fill="#536753" fontSize="8" fontWeight="700" letterSpacing="1">LIBRARY</text><path d="M-57 6 L40 6 L51 17 L-66 17Z" fill="#d2c6a6" /></g>
}

export function FarmVignette({ small = false }: { small?: boolean }) {
  return <g><ellipse cx="0" cy="5" rx="90" ry="30" fill="#c6d39e" stroke="#a6b889" strokeWidth="1.5" /><path d="M-88 1 Q-58 33 57 20" fill="none" stroke="#ebddb6" strokeWidth="10" /><House x={48} y={-17} scale={.64} color="#d9c294" /><RaisedBed x={-31} y={-14} scale={.42} /><RaisedBed x={-28} y={13} scale={.38} covered /><CompostBin x={-65} y={-10} scale={.5} /><Tree x={77} y={10} scale={.62} variant={1} /><Tree x={-84} y={15} scale={.35} young />{!small && <Person x={18} y={18} scale={.55} />}<path d="M-72 34 L76 17" stroke="#b6a283" strokeWidth="2" strokeDasharray="7 4" /></g>
}

export function ParkVignette() {
  return <g><ellipse cy="5" rx="98" ry="38" fill="#bfd096" stroke="#9fb97d" strokeWidth="1.5" /><path d="M-83 6 Q-44 28 26 4 Q57-7 89 16" fill="none" stroke="#e5d9ac" strokeWidth="13" /><Tree x={-52} y={-5} scale={.75} /><Tree x={24} y={-16} scale={.9} variant={1} /><Tree x={70} y={18} scale={.53} variant={2} /><Bench x={-15} y={20} scale={.55} /><Person x={16} y={22} scale={.55} color="#9f8bac" /><path d="M-92 37 Q-60 28-44 43 Q-27 57-13 40" fill="none" stroke="#bcb7a0" strokeWidth="4" /></g>
}

export function Sky({ dry = false }: { dry?: boolean }) {
  return <><rect width="960" height="560" fill={dry ? '#f5ebcd' : '#e8f0df'} /><circle cx="824" cy="72" r="33" fill={dry ? '#e9be75' : '#eed392'} opacity=".85" /><g fill="#fbfcf4" opacity=".8"><path d="M100 79 Q88 65 106 58 Q105 39 127 43 Q142 24 160 44 Q184 39 188 61 Q207 74 186 80Z" /><path d="M581 54 Q570 42 591 37 Q591 19 611 25 Q632 10 646 30 Q664 29 669 47 Q684 58 663 61Z" /></g><path d="M0 192 Q130 151 288 190 Q453 143 611 183 Q795 145 960 185 L960 560 L0 560Z" fill="#cbd7b3" /><path d="M0 253 Q132 221 309 249 Q523 223 695 248 Q844 207 960 229 L960 560 L0 560Z" fill="#d7dfbd" /></>
}

export function Hotspot({ x, y, id, label, children, onSelect, completed, labelWidth = 130 }: { x: number; y: number; id: HotspotId; label: string; children: ReactNode; onSelect: (id: HotspotId) => void; completed?: boolean; labelWidth?: number }) {
  const sceneLabel = { compost: 'Compost', soil: 'Soil', water: 'Water', trees: 'Trees', shade: 'Shade', community: 'Gather', habitat: 'Plants', sharing: 'Pantry', journal: 'Journal', idea: 'Ideas' }[id]
  const width = Math.max(labelWidth, 200)
  return <g transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={label} className={`scene-hotspot ${completed ? 'completed' : ''}`} onClick={() => onSelect(id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(id) } }}>
    <ellipse className="hotspot-halo" cx="0" cy="0" rx="65" ry="32" fill="#f8f6c6" opacity=".55" stroke="#e7d284" strokeWidth="2" />
    {children}
    <g className="hotspot-label" transform="translate(0 46)"><rect x={-width / 2} y="-20" width={width} height="48" rx="24" fill="#fffdf0" stroke="#a9b58c" strokeWidth="2" /><circle cx={-width / 2 + 18} cy="4" r="7" fill={completed ? '#6a9458' : '#dba66b'} />{completed && <path d={`M${-width / 2 + 14}3 L${-width / 2 + 17}7 L${-width / 2 + 22}0`} stroke="#fff" strokeWidth="2" fill="none" />}<text x="12" y="14" textAnchor="middle" fontSize="28" fontWeight="600" fill="#345535">{sceneLabel}</text></g>
    <circle className="hotspot-spark" cx="45" cy="-50" r="19" fill="#fffcec" stroke="#c3aa68" strokeWidth="2" /><path d="M37-50 L53-50 M45-58 L45-42" stroke="#8e7138" strokeWidth="3" strokeLinecap="round" />
  </g>
}

export function PlaceArrivalArt({ place, onSelect, completed }: { place: 'farm' | 'park' | 'library'; onSelect: (id: HotspotId) => void; completed: Partial<Record<HotspotId, unknown>> }) {
  return <svg viewBox="0 0 960 560" className="place-art" aria-label={`Illustrated ${place === 'farm' ? 'farm park' : place === 'park' ? 'community park' : 'library'} scene`}>
    <Sky />
    {place === 'farm' ? <>
      <g opacity=".72"><House x={97} y={227} scale={1.1} /><House x={190} y={221} scale={.9} color="#b6c5b8" /><House x={730} y={223} scale={1.15} color="#dbc19f" /><House x={867} y={220} scale={1.1} color="#c7b19f" /></g>
      <path d="M0 250 Q458 238 960 253" stroke="#e8dfc6" strokeWidth="25" fill="none" /><path d="M27 266 L27 315 M72 264 L72 307 M117 263 L117 300 M839 263 L839 308 M891 265 L891 314 M943 267 L943 315" stroke="#b3a482" strokeWidth="6" /><path d="M11 279 L131 272 M825 273 L954 282" stroke="#c6b490" strokeWidth="6" />
      <path d="M80 560 Q272 426 469 404 Q605 388 832 560" fill="none" stroke="#efe2b9" strokeWidth="69" />
      <Tree x={61} y={431} scale={1.75} /><Tree x={894} y={422} scale={1.75} variant={1} />
      <g transform="translate(680 298)"><path d="M-61 0 L-61-59 L40-59 L75-39 L75 17 L-29 17Z" fill="#d2b57f" stroke="#a38d62" strokeWidth="2" /><path d="M-66-57 L-18-100 L81-53 L38-49 L-18-79 L-55-46Z" fill="#799979" /><path d="M-31 15 L-31-32 L5-32 L5 15" fill="#6b7959" /><path d="M21-35 L48-35 L48-12 L21-12Z" fill="#b2cebe" stroke="#ebdfb6" strokeWidth="4" /></g>
      <RaisedBed x={442} y={325} scale={.95} /><RaisedBed x={574} y={377} scale={.95} /><RaisedBed x={317} y={425} scale={.85} vitality={65} />
      <Hotspot x={216} y={348} id="compost" label="Explore the compost hub" onSelect={onSelect} completed={Boolean(completed.compost)} labelWidth={157}><CompostBin scale={1.5} /></Hotspot>
      <Hotspot x={426} y={450} id="soil" label="Inspect living soil" onSelect={onSelect} completed={Boolean(completed.soil)} labelWidth={139}><g><ellipse cy="-2" rx="47" ry="24" fill="#977c55" /><path d="M-35-3 Q-12-19 8-9 M-18 5 Q6-8 32 3" stroke="#bda479" strokeWidth="3" fill="none" /><path d="M2-9 Q-3-44 3-54 M3-27 Q-21-49-24-28 Q-17-17 3-27 M4-37 Q31-61 31-42 Q22-28 4-37Z" fill="#75a063" stroke="#5d824f" strokeWidth="3" /><circle cx="36" cy="-32" r="15" fill="#f3ecc8" fillOpacity=".8" stroke="#647a5b" strokeWidth="4" /><path d="M47-20 L61-7" stroke="#8c9872" strokeWidth="7" strokeLinecap="round" /></g></Hotspot>
      <Hotspot x={685} y={438} id="water" label="Try the water challenge" onSelect={onSelect} completed={Boolean(completed.water)} labelWidth={173}><RaisedBed scale={.95} /><path d="M37-37 L51-42 L67-34 L64-13 L46-12Z" fill="#86a9b0" stroke="#618791" strokeWidth="2" /><path d="M65-28 L88-41 L91-35 L67-16 M49-38 Q36-54 39-26" fill="none" stroke="#618791" strokeWidth="5" /></Hotspot>
      <Person x={531} y={440} scale={1.2} /><Person x={788} y={324} scale={.9} color="#a996b5" />
      {[100, 120, 142, 796, 818, 850].map((x, i) => <Flower key={x} x={x} y={494 + i % 3 * 14} scale={.9} color={i % 2 ? '#d7907f' : '#eed188'} />)}
      <g transform="translate(377 264)"><path d="M-92-12 L92-12 L92 13 L-92 13Z" fill="#f8edcc" stroke="#acaa82" /><text textAnchor="middle" y="5" fontSize="14" fontWeight="600" fill="#45654b">WEST OAKLAND FARM PARK</text></g>
    </> : place === 'park' ? <>
      <path d="M-12 507 Q252 311 492 411 Q766 548 984 331" fill="none" stroke="#ece1bd" strokeWidth="74" />
      <g transform="translate(737 255)"><path d="M-70 0 L-70-66 L65-66 L65 0Z" fill="#e0ccac" stroke="#ac987a" strokeWidth="2" /><path d="M-82-63 L-4-112 L80-63Z" fill="#758872" /><path d="M-33-43 L-5-43 L-5-16 L-33-16Z M13-43 L43-43 L43-16 L13-16Z" fill="#a7c9c5" stroke="#f5ebd3" strokeWidth="4" /><path d="M-13 0 L-13-26 L10-26 L10 0Z" fill="#88765b" /></g>
      <Tree x={83} y={375} scale={1.6} variant={1} /><Tree x={875} y={369} scale={1.75} variant={2} />
      <Hotspot x={322} y={355} id="trees" label="Explore the big trees" onSelect={onSelect} completed={Boolean(completed.trees)} labelWidth={154}><Tree scale={1.85} variant={0} /></Hotspot>
      <ellipse cx="473" cy="457" rx="142" ry="38" fill="#759364" opacity=".23" />
      <Hotspot x={467} y={455} id="shade" label="Follow the tree shade" onSelect={onSelect} completed={Boolean(completed.shade)} labelWidth={157}><Bench scale={1.45} /><Person x={-10} y={-17} scale={1} color="#a58aad" /></Hotspot>
      <Hotspot x={728} y={446} id="community" label="Plan a shared gathering space" onSelect={onSelect} completed={Boolean(completed.community)} labelWidth={200}><path d="M-67 0 Q-26-15 72-4 L51 31 L-70 18Z" fill="#e1c285" /><Person x={-27} y={6} scale={1.1} /><Person x={24} y={0} scale={1.12} color="#79969c" /><path d="M-11-2 L41-10 L52 4 L-12 12Z" fill="#c29c6f" stroke="#997d58" strokeWidth="2" /></Hotspot>
      <Person x={134} y={460} scale={1.15} color="#7d99a5" /><Person x={168} y={466} scale={.8} color="#d7b270" />
      <path d="M783 302 L865 290 L881 320 L796 326Z" fill="#b9bda3" stroke="#97a189" /><path d="M783 302 Q824 295 841 275 L853 296 L865 290" fill="none" stroke="#9da78f" strokeWidth="8" />
      <g transform="translate(474 239)"><rect x="-115" y="-13" width="230" height="31" rx="3" fill="#f5ebca" stroke="#a7b58a" /><text y="7" textAnchor="middle" fontSize="16" fontWeight="600" fill="#4b6e4c">deFremery Park</text></g>
    </> : <>
      <rect y="200" width="960" height="360" fill="#e7d9b8" /><path d="M0 200 L960 200 M0 449 L960 449" stroke="#c8b999" strokeWidth="3" /><path d="M0 560 L279 200 M330 560 L429 200 M680 560 L571 200 M960 560 L717 200" stroke="#d9c8a6" strokeWidth="2" />
      <rect x="378" y="52" width="211" height="137" rx="6" fill="#b9d5c7" stroke="#b2a482" strokeWidth="9" /><path d="M483 52 L483 189 M378 123 L589 123" stroke="#ebe3c9" strokeWidth="7" /><g transform="translate(487 165)"><Tree x={-33} scale={.6} /><House x={51} scale={.6} color="#d7b898" /></g>
      <g transform="translate(112 253)"><rect x="-80" y="-155" width="161" height="229" rx="4" fill="#c8aa7f" stroke="#a58c68" strokeWidth="3" />{[0, 1, 2].map(row => <g key={row}>{Array.from({ length: 12 }, (_, i) => <rect key={i} x={-69 + i * 11} y={-134 + row * 66 + i % 3 * 3} width="8" height={42 - i % 3 * 3} rx="1" fill={['#7e9c81', '#c98168', '#99abb2', '#bfa669'][i % 4]} />)}<path d={`M-74 ${-88 + row * 66} L73 ${-88 + row * 66}`} stroke="#9d805e" strokeWidth="6" /></g>)}</g>
      <g transform="translate(828 277)"><rect x="-79" y="-183" width="160" height="236" rx="4" fill="#c8aa7f" stroke="#a58c68" strokeWidth="3" />{[0, 1, 2].map(row => <g key={row}>{Array.from({ length: 11 }, (_, i) => <rect key={i} x={-67 + i * 12} y={-163 + row * 67 + i % 3 * 3} width="9" height={46 - i % 3 * 3} rx="1" fill={['#b299bd', '#d4b47f', '#94ac92', '#ae7465'][i % 4]} />)}<path d={`M-74 ${-114 + row * 67} L73 ${-114 + row * 67}`} stroke="#9d805e" strokeWidth="6" /></g>)}</g>
      <path d="M253 331 L639 323 L765 414 L350 432Z" fill="#d0ad7e" stroke="#ae8c66" strokeWidth="3" /><path d="M351 433 L351 491 M732 414 L732 470 M269 344 L269 389" stroke="#a18868" strokeWidth="15" />
      <Hotspot x={422} y={355} id="journal" label="Open the field journal desk" onSelect={onSelect} completed={Boolean(completed.journal)} labelWidth={172}><path d="M-63-33 Q-21-53 0-27 Q29-48 64-31 L58 13 Q20-1 0 14 Q-21-3-60 14Z" fill="#fff8e7" stroke="#b7a57d" strokeWidth="2" /><path d="M0-25 L0 14 M-47-23 L-14-17 M15-19 L47-24 M-47-12 L-18-8 M17-9 L45-13" stroke="#b5c399" strokeWidth="2" /><path d="M-46-29 Q-45-46-28-35 Q-16-28-31-20" fill="#91ac7b" /></Hotspot>
      <Hotspot x={622} y={391} id="idea" label="Visit the neighborhood ideas table" onSelect={onSelect} completed={Boolean(completed.idea)} labelWidth={199}><path d="M-42-50 L45-59 L51 11 L-33 22Z" fill="#fbf3d8" stroke="#b6a17a" strokeWidth="2" /><rect x="-22" y="-39" width="42" height="25" rx="4" fill="#ccdab4" transform="rotate(-7)" /><path d="M-12-14 Q-3-36 11-21 M-14-25 L-10-5" stroke="#779567" strokeWidth="3" fill="none" /><path d="M-18 1 L26-6 M-16 10 L22 4" stroke="#b6b28b" strokeWidth="3" /><path d="M39-20 L65-62" stroke="#d39760" strokeWidth="7" strokeLinecap="round" /></Hotspot>
      <Person x={267} y={475} scale={1.6} color="#739892" /><Person x={743} y={446} scale={1.2} color="#b196b3" />
      <g transform="translate(484 231)"><text textAnchor="middle" fill="#71806b" fontSize="15" letterSpacing="2" fontWeight="600">GOOD IDEAS BEGIN WITH CURIOSITY</text></g>
      <Flower x={713} y={343} scale={1.7} />
    </>}
  </svg>
}

function SoilTray({ x, label, result, choice, rain }: { x: number; label: string; result: FarmResult | null; choice: FarmChoice; rain: boolean }) {
  const vitality = result?.vitality ?? 65
  return <g transform={`translate(${x} 0)`}>
    <text className="art-label" x="0" y="184" textAnchor="middle" fontSize="28" fontWeight="600" fill="#526f50">{label}</text>
    <path d="M-175 277 L118 252 L167 286 L-130 322Z" fill={choice.cover === 'mulch' ? '#c5ad74' : choice.cover === 'living' ? '#91af67' : '#9d7f5d'} stroke="#9b815c" strokeWidth="2" />
    <path d="M-175 277 L-130 322 L-130 454 L-175 405Z" fill="#95734e" /><path d="M-130 322 L167 286 L167 416 L-130 454Z" fill={choice.compost ? '#8b6d49' : '#ac8a5c'} stroke="#997b52" strokeWidth="2" />
    <path d="M-130 357 L167 321 M-130 402 L167 366" stroke="#c3a471" strokeWidth="10" opacity=".55" />
    {Array.from({ length: 36 }, (_, i) => <ellipse key={i} cx={-111 + i % 9 * 30} cy={345 + Math.floor(i / 9) * 24 - i % 9 * 3} rx={2 + i % 3} ry="2" fill={i % 2 ? '#d8bd8d' : '#735b3e'} opacity=".55" />)}
    {[-92, -9, 74].map((cx, i) => <g key={cx} transform={`translate(${cx} ${293 - i * 8})`}><path d="M0 0 Q8 39-15 69 M0 8 Q-34 24-47 50 M-3 30 Q28 39 41 54" stroke="#e7d6a6" strokeWidth="2.5" fill="none" /><path d={vitality > 40 ? 'M0 0 Q-8-43 0-65' : 'M0 0 Q-15-35 16-37'} stroke={vitality > 40 ? '#66824c' : '#a7905c'} strokeWidth="4" fill="none" /><path d="M0-21 Q-37-62-34-29 Q-19-8 0-21 M-1-45 Q32-80 34-47 Q19-23-1-45Z" fill={vitality > 55 ? '#79a168' : vitality > 30 ? '#a5ac63' : '#bca16b'} /><ellipse cx="-21" cy="-38" rx="9" ry="4" fill="#abc88a" opacity=".55" /></g>)}
    {choice.cover === 'mulch' && Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${-147 + i % 6 * 46} ${288 + Math.floor(i / 6) * 8 - i % 6 * 4} l14-2`} stroke={i % 2 ? '#e4cc95' : '#a58b59'} strokeWidth="3" />)}
    {choice.compost && <><path d="M-97 399 Q-82 388-74 406 Q-57 422-47 399" fill="none" stroke="#d29b84" strokeWidth="4" strokeLinecap="round" /><path d="M89 350 Q70 337 66 354 Q66 368 54 364" fill="none" stroke="#d29b84" strokeWidth="3" strokeLinecap="round" /></>}
    {rain && result && <>
      <g className="falling-drops">{Array.from({ length: 20 }, (_, i) => <path key={i} d={`M${-136 + i % 10 * 29} ${211 + Math.floor(i / 10) * 30 - i % 3 * 5} l-5 13`} stroke="#7da8ba" strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: `${i % 5 * -.2}s` }} />)}</g>
      <g opacity=".8">{Array.from({ length: Math.round(result.infiltration / 7) }, (_, i) => <path key={i} d={`M${-111 + i % 8 * 34} ${333 + Math.floor(i / 8) * 47} l0 32 m-4-6 l4 6 l4-6`} fill="none" stroke="#88b7c0" strokeWidth="2" className="infiltration-arrow" />)}</g>
      <path d={`M161 304 Q${178 + result.runoff / 2} 312 191 335`} fill="none" stroke="#87b2bb" strokeWidth={3 + result.runoff / 10} opacity=".8" /><path d="M186 327 L191 335 L199 332" fill="none" stroke="#87b2bb" strokeWidth="3" />
    </>}
    {result && <g transform="translate(-106 480)"><rect width="255" height="50" rx="22" fill="#f8f7df" stroke="#b8c7a0" /><text className="art-label" x="127" y="34" textAnchor="middle" fill="#456345">{rain ? `${result.infiltration} ↓  ${result.runoff} →` : `${result.moisture} moisture`}</text></g>}
  </g>
}

export function SoilLabArt({ choice, result, baseline, weather, serial }: { choice: FarmChoice; result: FarmResult | null; baseline: FarmResult | null; weather: Weather; serial: number }) {
  return <svg viewBox="0 0 960 560" className={`place-art lab-art ${weather}`} aria-label="Illustrated comparison of two demonstration growing beds" key={serial}>
    <Sky dry={weather === 'dry'} /><path d="M0 522 Q468 490 960 535 L960 560 L0 560Z" fill="#c6d3ad" />
    <g transform="translate(480 93)"><rect x="-200" y="-28" width="400" height="58" rx="25" fill="#fbf9e9" stroke="#c9d1b1" /><text className="art-label" y="13" textAnchor="middle" fill="#456345" fontWeight="550">{result ? weather === 'rain' ? 'Same rain' : 'Same dry spell' : 'Pick a cover'}</text></g>
    <SoilTray x={270} label="Bare bed" result={baseline} choice={{ cover: 'bare', compost: false, watering: 'pour', water: choice.water }} rain={weather === 'rain'} />
    <SoilTray x={695} label="Your bed" result={result} choice={choice} rain={weather === 'rain'} />
    {weather === 'rain' && result && <g fill="#c0d2cf" opacity=".92"><path d="M102 145 Q80 126 111 115 Q110 87 141 93 Q164 60 190 91 Q228 84 236 116 Q262 144 227 153Z" /><path d="M540 139 Q520 117 554 111 Q554 84 587 91 Q611 68 634 94 Q669 88 677 116 Q699 138 668 148Z" /></g>}
  </svg>
}

export function CompostLabArt({ stage }: { stage: number }) {
  return <svg viewBox="0 0 960 560" className="place-art compost-lab" aria-label={`Compost learning illustration, stage ${stage + 1} of 3`}>
    <Sky /><path d="M0 452 Q462 414 960 455 L960 560 L0 560Z" fill="#c4d3a8" />
    <path d="M242 307 Q361 241 426 307 M542 307 Q652 245 714 307" fill="none" stroke="#c1b588" strokeWidth="3" strokeDasharray="7 8" /><path d="M414 298 L429 308 L410 313 M703 298 L717 308 L700 314" fill="none" stroke="#ad9e70" strokeWidth="3" />
    <g transform="translate(186 328)" opacity={stage === 0 ? 1 : .65}><path d="M-56-102 L58-102 L47 0 L-39 0Z" fill="#72966d" stroke="#4e7656" strokeWidth="3" /><path d="M-67-103 L67-103 L67-115 L-67-115Z" fill="#61865c" stroke="#4e7656" strokeWidth="2" /><circle cx="-28" cy="5" r="9" fill="#68775d" /><circle cx="36" cy="5" r="9" fill="#68775d" /><path d="M-35-87 Q-9-136 9-98 Q27-126 39-94" fill="#d1b070" stroke="#a9975c" strokeWidth="2" /><path d="M-6-56 Q-23-67-26-42 Q-17-25 0-35 Q20-41 14-59Z" fill="#e6dabc" /><path d="M-8-37 Q-3-54 9-47" stroke="#648259" strokeWidth="3" fill="none" /></g>
    <g transform="translate(474 333)" opacity={stage === 1 ? 1 : .7}><CompostBin scale={2} /><g className={stage === 1 ? 'compost-steam' : ''}><path d="M-24-114 Q-39-145-20-159 M0-123 Q15-145-2-174 M24-128 Q9-150 29-162" fill="none" stroke="#f8fae8" strokeWidth="5" strokeLinecap="round" opacity=".8" /></g><path d="M-21-71 Q-3-86 4-67 Q10-48 26-63" fill="none" stroke="#d19b7c" strokeWidth="4" strokeLinecap="round" /></g>
    <g transform="translate(783 321)" opacity={stage === 2 ? 1 : .65}><RaisedBed scale={1.3} covered vitality={90} /><Tree x={72} y={-28} scale={.7} young /><Flower x={-47} y={-8} scale={1.2} /></g>
    {['Scraps', 'Breakdown', 'Compost'].map((label, i) => <g key={label} transform={`translate(${186 + i * 297} 399)`}><circle cy="-24" r="12" fill={stage === i ? '#537d50' : '#f4f0d9'} stroke="#b4c398" /><text className="art-label" y="20" textAnchor="middle" fill="#486449" fontWeight="600">{label}</text></g>)}
    <g transform="translate(480 82)"><text className="art-label" textAnchor="middle" fill="#4d6d49">{stage === 0 ? 'Scraps to soil' : stage === 1 ? 'Tiny helpers' : 'Ready to grow'}</text></g>
  </svg>
}

export function ParkLabArt({ choice, result, year }: { choice: ParkChoice; result: ParkResult; year: 0 | 5 }) {
  const growing = choice.strategy === 'tree'
  const treeScale = year === 0 ? .85 : .85 + choice.care * .43
  return <svg viewBox="0 0 960 560" className="place-art park-lab" aria-label={`Hypothetical gathering-space illustration in year ${year}`}>
    <Sky dry /><path d="M0 466 Q233 359 465 446 Q676 511 960 438" fill="none" stroke="#ede0b9" strokeWidth="58" /><House x={113} y={269} scale={1.1} /><House x={836} y={263} scale={1.1} color="#bbcab6" />
    <Tree x={77} y={417} scale={1.6} variant={1} /><Tree x={872} y={429} scale={1.4} variant={2} />
    <ellipse cx="486" cy="391" rx={result.shade * 2.1} ry={result.shade * .65} fill="#829a63" opacity=".24" />
    {choice.strategy === 'canopy' ? <g><path d="M329 412 L329 260 M656 406 L656 255" stroke="#a19170" strokeWidth="12" /><path d="M306 265 L623 236 L688 270 L365 301Z" fill="#e3c286" stroke="#bf9c62" strokeWidth="3" /><path d="M368 300 L368 437 M688 270 L688 427" stroke="#a19170" strokeWidth="10" /></g>
      : <Tree x={496} y={365} scale={growing ? treeScale : 2.2} young={growing && year === 0} variant={growing && choice.care === 0 && year === 5 ? 3 : 0} />}
    {choice.seating ? <Bench x={430} y={432} scale={1.5} /> : <path d="M376 427 Q431 407 484 425 L471 447 L384 449Z" fill="#e2c388" />}
    <Person x={529} y={450} scale={1.6} /><Person x={569} y={446} scale={1.2} color="#a28eae" />{result.gathering > 60 && <Person x={400} y={409} scale={1.2} color="#779394" />}
    <g transform="translate(480 83)"><rect x="-179" y="-28" width="358" height="58" rx="25" fill="#fbf8e6" stroke="#cdc9a8" /><text className="art-label" y="13" textAnchor="middle" fill="#53663f">Plan some shade</text></g>
    <g transform="translate(756 160)"><rect x="-75" y="-28" width="150" height="58" rx="25" fill="#f9f4dd" stroke="#c8bf94" /><text className="art-label" y="13" textAnchor="middle" fill="#79613b" fontWeight="600">{year === 0 ? 'Today' : 'Year 5'}</text></g>
  </svg>
}

export function ShadeLabArt({ sun, bench, onBench }: { sun: number; bench: number; onBench: (value: number) => void }) {
  const shadowX = 510 + (sun - 50) * 2.2
  const shadeWidth = 177 - Math.abs(sun - 50) * .45
  return <svg viewBox="0 0 960 560" className="place-art shade-lab" aria-label="Move the sun and choose a bench to explore changing tree shade">
    <Sky dry /><circle cx={130 + sun * 6} cy={70 + Math.abs(sun - 50) * .8} r="32" fill="#ebbf70" stroke="#f5d795" strokeWidth="7" />
    <path d="M0 510 Q221 422 487 483 Q705 529 960 461" fill="none" stroke="#ede0b9" strokeWidth="49" />
    <ellipse cx={shadowX} cy="406" rx={shadeWidth} ry="68" fill="#738e5a" opacity=".3" className="moving-shadow" />
    <Tree x={491} y={356} scale={2.5} />
    {[350, 520, 690].map((x, i) => {
      const shaded = Math.abs(x - shadowX) < shadeWidth
      return <g key={x} transform={`translate(${x} 435)`} role="button" tabIndex={0} aria-label={`Try bench ${i + 1}`} onClick={() => onBench(i)} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); onBench(i) } }} className="bench-choice"><ellipse cy="5" rx="54" ry="17" fill={bench === i ? '#f8e8aa' : '#d2d9ac'} stroke={bench === i ? '#bd9656' : '#b1bf8b'} strokeWidth="2" /><Bench scale={1.1} />{bench === i && <Person y={-17} scale={1.1} color="#a18ead" />}<rect x="-65" y="29" width="130" height="48" rx="22" fill="#fbf8e8" stroke="#c7c99f" /><text className="art-label" y="62" textAnchor="middle" fill="#47613c">{shaded ? 'Shade' : 'Sun'}</text></g>
    })}
    <text className="art-label" x="480" y="104" textAnchor="middle" fill="#536d49">The shade moves</text>
  </svg>
}
