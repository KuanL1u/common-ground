import { Flower, Hotspot, House, Person, RaisedBed, Sky, Tree } from './Art.tsx'
import { gardenPlants, sharingGroups } from './model.ts'
import type { GardenChoice, GardenPlant, HotspotId, SharingChoice } from './types.ts'

function Elder({ x = 0, y = 0, scale = 1, young = false }: { x?: number; y?: number; scale?: number; young?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><Tree young={young} variant={2} />{(young ? [[-6, -50], [10, -58]] : [[-29, -78], [12, -99], [44, -73], [11, -48]]).map(([cx, cy], i) => <g key={i} fill="#f5efce">{[[0, 0], [-5, -3], [5, -3], [-3, 4], [4, 4]].map(([dx, dy], j) => <circle key={j} cx={cx + dx} cy={cy + dy} r="3" />)}</g>)}</g>
}
function Bee({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className="garden-bee"><ellipse cx="-3" cy="-6" rx="5" ry="7" fill="#fff9e7" stroke="#aec3b2" /><ellipse cx="4" cy="-6" rx="5" ry="7" fill="#fff9e7" stroke="#aec3b2" /><ellipse rx="9" ry="6" fill="#e5ba5f" stroke="#826544" /><path d="M-3-5 L-3 5 M3-5 L3 5" stroke="#806848" strokeWidth="3" /><circle cx="9" cy="-1" r="3" fill="#78684d" /></g>
}
function Basket({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-24-11 Q0-50 24-11" fill="none" stroke="#a28359" strokeWidth="5" /><path d="M-20-17 Q-16-35-4-20 Q9-45 18-22" fill="#8aa16a" /><circle cx="-11" cy="-17" r="9" fill="#c77957" /><circle cx="7" cy="-19" r="10" fill="#d5935e" /><path d="M-30-13 L30-13 L24 17 L-23 17Z" fill="#d5b783" stroke="#a88b62" strokeWidth="2" /><path d="M-27-3 L28-3 M-25 7 L26 7 M-12-12 L-10 17 M4-12 L4 17 M19-12 L17 17" stroke="#b5996e" strokeWidth="2" /></g>
}
function Pantry({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-47 0 L-47-83 L47-83 L47 0" fill="#d7ba8b" stroke="#a08c67" strokeWidth="2" /><path d="M-55-81 L0-115 L55-81" fill="#85a08a" stroke="#65836e" strokeWidth="3" /><path d="M-37-61 L37-61 L37-16 L-37-16Z" fill="#957d5e" /><Basket y={-34} scale={.7} /><path d="M-50-15 L50-15" stroke="#b59a71" strokeWidth="5" /><rect x="-43" y="-77" width="86" height="18" rx="3" fill="#fff0cc" /><text y="-65" textAnchor="middle" fontSize="9" fill="#607f54" fontWeight="600">TAKE · SHARE · CARE</text></g>
}
export function GardenVignette() {
  return <g><ellipse cy="4" rx="82" ry="29" fill="#c8d5a9" /><Elder x={-34} y={-9} scale={.73} /><RaisedBed x={25} y={-5} scale={.57} />{[[-61, 10], [-48, 18], [55, 13], [69, 7]].map(([x, y], i) => <Flower key={i} x={x} y={y} scale={.7} color={i % 2 ? '#dab173' : '#c59baa'} />)}<Basket x={19} y={22} scale={.43} /></g>
}
export function GravityArrivalArt({ onSelect, completed }: { onSelect: (id: HotspotId) => void; completed: Partial<Record<HotspotId, unknown>> }) {
  return <svg viewBox="0 0 960 560" className="place-art" aria-label="Illustrated Gravity Garden with a living garden and a community pantry">
    <Sky />
    <g opacity=".75"><House x={117} y={254} scale={1.4} color="#cdb3a1" /><House x={259} y={246} scale={1.35} color="#b9c7ba" /><House x={774} y={241} scale={1.6} color="#d1bc9c" /><House x={910} y={261} scale={1.4} color="#b4c7c6" /></g>
    <path d="M0 270 Q475 250 960 283" fill="none" stroke="#ede4ca" strokeWidth="25" />
    <path d="M105 560 Q347 388 502 391 Q684 402 880 560" fill="none" stroke="#ecddb9" strokeWidth="64" />
    <g stroke="#b3a27a" strokeWidth="6"><path d="M14 307 L311 279 M710 279 L951 316" /><path d="M25 294 L25 331 M91 285 L91 322 M159 279 L159 314 M233 272 L233 307 M733 270 L733 309 M815 280 L815 319 M893 291 L893 334" /></g>
    <Elder x={81} y={426} scale={1.7} /><Elder x={887} y={438} scale={1.5} />
    <RaisedBed x={484} y={306} scale={1.05} covered /><RaisedBed x={358} y={353} scale={.75} />
    <g transform="translate(460 228)"><rect x="-124" y="-16" width="248" height="34" rx="5" fill="#fff4d4" stroke="#b3ad80" strokeWidth="2" /><text textAnchor="middle" y="6" fontSize="20" letterSpacing="2" fill="#5c7750" fontWeight="600">GRAVITY GARDEN</text></g>
    <Hotspot x={307} y={427} id="habitat" label="Explore the living garden" labelWidth={169} onSelect={onSelect} completed={Boolean(completed.habitat)}><Elder x={-16} y={-6} scale={.83} /><Flower x={38} y={8} color="#cea1b2" scale={1.25} /><Flower x={52} y={-8} color="#e4c177" /><Bee x={52} y={-63} /></Hotspot>
    <Hotspot x={680} y={418} id="sharing" label="Explore the community pantry" labelWidth={194} onSelect={onSelect} completed={Boolean(completed.sharing)}><Pantry scale={1.2} /><Basket x={69} y={8} scale={.9} /></Hotspot>
    <Person x={499} y={448} scale={1.4} color="#9a9ab4" /><Person x={577} y={378} scale={1.05} />
    {[132, 163, 196, 219, 777, 807, 840].map((x, i) => <Flower key={x} x={x} y={484 + i % 3 * 16} scale={1.1} color={i % 2 ? '#daa172' : '#c89fb4'} />)}
    <Bee x={381} y={315} /><Bee x={808} y={434} scale={.9} />
  </svg>
}
export function GardenLabArt({ choice, plant, year, grown, onPlant }: { choice: GardenChoice; plant: GardenPlant | null; year: 0 | 5; grown: boolean; onPlant: (index: number) => void }) {
  return <svg viewBox="0 0 960 560" className="place-art" aria-label="Four clickable learning garden patches">
    <Sky /><House x={100} y={235} scale={1.3} /><House x={843} y={249} scale={1.5} color="#c1cbbb" />
    <path d="M0 277 Q477 231 960 275" fill="none" stroke="#d7ddbb" strokeWidth="35" />
    <text className="art-label" x="480" y="194" textAnchor="middle" fill="#536d49">{grown ? year === 5 ? 'Year 5' : 'Today' : 'Tap a patch'}</text>
    {choice.plots.map((value, i) => {
      const x = 298 + (i % 2) * 316, y = 326 + Math.floor(i / 2) * 148
      return <g key={i} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`${plant ? `Plant ${gardenPlants[plant].name}` : 'Leave open space'} in patch ${i + 1}`} className="garden-patch" onClick={() => onPlant(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPlant(i) } }}>
        <ellipse cy="10" rx="135" ry="42" fill="#cbd7af" stroke="#b0c496" strokeWidth="2" />
        <ellipse cy="8" rx="111" ry="31" fill={value ? '#b2a282' : '#d7ccad'} />
        {value === 'vegetables' ? <RaisedBed x={0} y={0} scale={grown ? 1.18 : .9} covered /> : value === 'flowers' ? <g>{[-66, -34, 0, 34, 64].map((fx, j) => <Flower key={fx} x={fx} y={j % 2 ? 16 : 0} scale={grown ? 1.5 : 1} color={j % 2 ? '#ddbc79' : '#c59aac'} />)}{grown && <><Bee x={-39} y={-65} /><Bee x={46} y={-38} scale={.8} /></>}</g> : value === 'elder' ? <Elder x={0} y={6} scale={grown && year === 5 ? 1.25 : 1} young={!grown || year === 0} /> : <path d="M-13 0 L13 0 M0-13 L0 13" stroke="#ac9b7b" strokeWidth="3" />}
        <rect x="-105" y="37" width="210" height="45" rx="22" fill="#fcf9e9" stroke="#a5ba8a" /><text className="art-label" y="68" textAnchor="middle" fill="#48683d">{i + 1}. {value === 'vegetables' ? 'Veg' : value === 'flowers' ? 'Flowers' : value === 'elder' ? 'Elder' : 'Open'}</text>
      </g>
    })}
    <Person x={80} y={469} scale={1.35} color="#b58e9d" />
  </svg>
}
export function SharingArt({ choice, onGive }: { choice: SharingChoice; onGive: (id: keyof SharingChoice) => void }) {
  return <svg viewBox="0 0 960 560" className="place-art" aria-label="A fictional garden harvest shared among three groups">
    <Sky /><Elder x={66} y={362} scale={1.6} /><Elder x={908} y={375} scale={1.6} />
    <text className="art-label" x="480" y="133" textAnchor="middle" fill="#536d49">8 baskets</text>
    <Pantry x={480} y={294} scale={1.05} /><Person x={554} y={291} color="#9c9db7" />
    <path d="M464 303 Q283 306 174 394 M480 309 L480 401 M501 304 Q678 303 787 394" fill="none" stroke="#e8d6aa" strokeWidth="26" />
    {sharingGroups.map((group, i) => {
      const x = 175 + i * 305
      return <g key={group.id} transform={`translate(${x} 427)`} className="harvest-station" role="button" tabIndex={0} aria-label={`Give one basket to ${group.name}`} onClick={() => onGive(group.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onGive(group.id) } }}>
        <ellipse rx="126" ry="54" fill="#d3ddbb" stroke="#b6c9a0" strokeWidth="2" />
        {i === 0 ? <House y={-36} scale={.65} /> : <><Person x={-23} y={-38} scale={.8} color={i === 1 ? '#b8a17d' : '#9aabc2'} /><Person x={23} y={-38} scale={.8} /><path d="M-55-28 L55-28 M-39-27 L-39-8 M39-27 L39-8" stroke="#b59b76" strokeWidth="6" /></>}
        {Array.from({ length: choice[group.id] }, (_, j) => <Basket key={j} x={-64 + j * 38} y={17} scale={.6} />)}
        <rect x="-127" y="63" width="254" height="52" rx="22" fill="#fbf8e8" stroke="#a5ba8a" /><text className="art-label" y="99" textAnchor="middle" fill="#48683d">{i === 0 ? 'Homes' : i === 1 ? 'Meal' : 'Helpers'} {choice[group.id]}/{group.requested}</text>
      </g>
    })}
  </svg>
}
