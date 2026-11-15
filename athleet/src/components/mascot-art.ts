import { wordmarkPath, wordmarkWidth } from './athleet-wordmark';

// All layers share a canvas so limbs and props keep their alignment at every size.
export type MascotPose = 'start' | 'age' | 'gender' | 'height' | 'weight' | 'goal' | 'sport' | 'level' | 'results';

export const spinBallCenter = { x: 260, y: 82 };

function svg(markup: string) {
  return { uri: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">${markup}</svg>`)}` };
}

const body = `
  <path d="M140 221C108 253 73 266 43 240C28 227 26 246 38 265C59 301 122 286 156 263" fill="#e9ae10"/>
  <path d="M139 217C104 247 73 255 43 237C29 228 32 244 43 256C70 280 114 269 149 251" fill="#ffcf32"/>
  <path d="M131 246L126 277M183 246L193 277" stroke="#ffce32" stroke-width="24" stroke-linecap="round"/>
  <path d="M115 266L139 269M181 270L203 265" stroke="#fff3d5" stroke-width="14"/>
  <path d="M115 268L138 271M183 272L204 267" stroke="#eb5347" stroke-width="4"/>
  <path d="M114 275Q130 271 139 281L146 292Q146 301 131 301H94Q86 299 90 290Z" fill="#24345e"/>
  <path d="M182 280Q192 272 206 275L228 289Q239 300 225 302H187Q177 299 182 280" fill="#24345e"/>
  <path d="M92 294H143M183 295H229" stroke="#fff3d5" stroke-width="9" stroke-linecap="round"/>
  <path d="M114 283L130 287M117 277L132 282M190 282L204 280M192 288L211 285" stroke="#fff3d5" stroke-width="4" stroke-linecap="round"/>
  <path d="M115 174Q153 158 200 175L213 236Q164 255 105 236Z" fill="#24345e"/>
  <path d="M114 179L110 229M200 178L208 230" stroke="#ef5b4e" stroke-width="8"/>
  <path d="M123 174Q158 206 193 174" fill="none" stroke="#fff3d5" stroke-width="10"/>
  <path d="M124 172Q158 199 192 172" fill="none" stroke="#ed584b" stroke-width="4"/>
  <path d="M110 239L106 256L152 262L160 248L168 262L214 254L208 237" fill="#24345e" stroke="#fff3d5" stroke-width="5" stroke-linejoin="round"/>
  <g transform="translate(125 208) scale(${68 / wordmarkWidth})">${wordmarkPath('#fff3d5')}</g>`;

const head = `
  <path d="M131 88L116 51M181 86L195 42" stroke="#f6bc23" stroke-width="15" stroke-linecap="round"/>
  <circle cx="114" cy="47" r="16" fill="#ffcf32"/><circle cx="197" cy="39" r="16" fill="#ffcf32"/>
  <path d="M94 139C89 103 115 76 155 76C201 72 225 101 225 141C225 179 192 193 155 190C118 190 86 178 94 139" fill="#ffcf32"/>
  <ellipse cx="111" cy="158" rx="12" ry="7" fill="#f4a833"/><ellipse cx="206" cy="157" rx="11" ry="7" fill="#f4a833"/>`;
const eyes = `
  <ellipse cx="132" cy="132" rx="20" ry="27" fill="#fff9e9"/><ellipse cx="184" cy="130" rx="20" ry="27" fill="#fff9e9"/>
  <ellipse cx="138" cy="134" rx="11" ry="17" fill="#202a43"/><ellipse cx="189" cy="132" rx="11" ry="17" fill="#202a43"/>
  <circle cx="141" cy="127" r="4.5" fill="white"/><circle cx="192" cy="125" r="4.5" fill="white"/>`;
const smile = '<path d="M143 164Q159 175 177 160Q173 184 158 181Q148 180 143 164" fill="#73352b"/><path d="M153 177Q162 168 171 176Q163 185 153 177" fill="#ef685b"/>';
const thoughtful = '<path d="M149 172Q160 178 171 169" fill="none" stroke="#73352b" stroke-width="5" stroke-linecap="round"/>';
const happyEyes = '<path d="M116 133Q132 111 148 132M170 131Q185 109 200 130" fill="none" stroke="#202a43" stroke-width="7" stroke-linecap="round"/>';

function arm(path: string, x: number, y: number) {
  return `<path d="${path}" fill="none" stroke="#e9ae10" stroke-width="24" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#ffcf32" stroke-width="19" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="14" fill="#ffcf32"/>`;
}

const poses = {
  start: { left: 'M116 184Q74 201 72 157', lx: 72, ly: 157, right: 'M204 183Q266 204 260 132', rx: 260, ry: 132 },
  age: { left: 'M116 184Q88 196 77 174', lx: 77, ly: 174, right: 'M202 181Q232 164 240 128', rx: 240, ry: 128 },
  gender: { left: 'M115 183Q89 205 65 189', lx: 65, ly: 189, right: 'M203 183Q230 205 253 187', rx: 253, ry: 187 },
  height: { left: 'M115 184Q89 207 84 219', lx: 84, ly: 219, right: 'M204 182Q238 145 233 91', rx: 233, ry: 91 },
  weight: { left: 'M115 184Q88 190 63 173', lx: 63, ly: 173, right: 'M204 183Q233 188 255 173', rx: 255, ry: 173 },
  goal: { left: 'M115 184Q86 204 113 223', lx: 113, ly: 223, right: 'M204 182Q231 161 247 140', rx: 247, ry: 140 },
  sport: { left: 'M115 183Q88 175 85 148', lx: 85, ly: 148, right: 'M204 183Q237 175 259 192', rx: 259, ry: 192 },
  level: { left: 'M115 184Q76 198 74 155', lx: 74, ly: 155, right: 'M204 183Q244 198 245 154', rx: 245, ry: 154 },
  results: { left: 'M115 184Q85 161 72 124', lx: 72, ly: 124, right: 'M204 183Q234 161 246 122', rx: 246, ry: 122 },
};
const ball = '<circle cx="263" cy="225" r="25" fill="#ff873d"/><g fill="none" stroke="#983f26" stroke-width="2.5"><circle cx="263" cy="225" r="24"/><path d="M239 225H287M263 201V249M246 207Q271 225 246 243M280 207Q255 225 280 243"/></g>';
const spinBall = `<g transform="translate(${spinBallCenter.x} ${spinBallCenter.y})">
  <defs><radialGradient id="ball-light" cx="32%" cy="24%" r="77%">
    <stop stop-color="#ffc077"/><stop offset="1" stop-color="#eb642d"/>
  </radialGradient></defs>
  <circle r="33" fill="url(#ball-light)" stroke="#983f26" stroke-width="2.5"/>
  <path d="M-33 0Q0 13 33 0" fill="none" stroke="#983f26" stroke-width="2.5"/>
</g>`;
export const spinBallSeam = svg(`<path transform="translate(${spinBallCenter.x} ${spinBallCenter.y})"
  d="M0 -32A32 32 0 0 1 0 32" fill="none" stroke="#983f26" stroke-width="2.5"/>`);
const court = `<ellipse cx="155" cy="293" rx="132" ry="18" fill="#181d29" stroke="#303a51" stroke-width="1.5"/>
  <path d="M40 94L50 104M50 94L40 104M285 143L295 137M56 130H66" fill="none" stroke="#f4ab51" stroke-width="2.5" stroke-linecap="round"/>`;
const star = '<path d="M258 87L265 103L283 105L269 117L273 135L258 126L242 135L246 117L232 105L250 103Z" fill="#ffcf32"/><path d="M254 108L258 104" stroke="#fff3d5" stroke-width="4" stroke-linecap="round"/>';
const ruler = '<rect x="252" y="67" width="19" height="193" rx="5" fill="#fff3d5"/><path d="M253 83H264M253 102H260M253 121H264M253 140H260M253 159H264M253 178H260M253 197H264M253 216H260M253 235H264" stroke="#24345e" stroke-width="3"/>';
const confetti = '<g fill="#ffcf32"><path d="M52 64L56 76L68 80L56 84L52 97L48 84L36 80L48 76Z"/><path d="M269 51L272 60L282 63L272 66L269 76L266 66L256 63L266 60Z"/></g><g fill="none" stroke-width="6" stroke-linecap="round"><path d="M38 135L45 140M276 153L287 144" stroke="#ef685b"/><path d="M73 42L79 53M233 32L229 43" stroke="#81b7c9"/></g>';

export const mascotArt = Object.fromEntries(Object.entries(poses).map(([pose, p]) => [pose, {
  body: svg(body),
  face: svg(head + (pose === 'results' ? happyEyes : eyes) + (pose === 'height' ? thoughtful : smile)),
  left: svg((pose === 'start' ? court : '') + arm(p.left, p.lx, p.ly)),
  right: svg(arm(p.right, p.rx, p.ry) + (pose === 'start' ? '<path d="M260 131V115" stroke="#ffcf32" stroke-width="9" stroke-linecap="round"/>' : '')),
  prop: svg(({ start: spinBall, height: ruler, goal: star, sport: ball, results: confetti } as Record<string, string>)[pose] ?? ''),
}])) as Record<MascotPose, { body: ReturnType<typeof svg>; face: ReturnType<typeof svg>; left: ReturnType<typeof svg>; right: ReturnType<typeof svg>; prop: ReturnType<typeof svg> }>;
