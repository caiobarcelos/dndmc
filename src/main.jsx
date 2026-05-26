import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Copy, FileJson, FileText, HelpCircle, ImageDown, Plus, Shield, Skull, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import './styles.css';

const typeRules = {
  Aberration: { pt: 'Aberração', hd: 8, bab: 0.75, saves: ['Will'], skills: 2 },
  Animal: { pt: 'Animal', hd: 8, bab: 0.75, saves: ['Fort', 'Ref'], skills: 2 },
  Construct: { pt: 'Constructo', hd: 10, bab: 0.75, saves: [], skills: 2, noCon: true },
  Dragon: { pt: 'Dragão', hd: 12, bab: 1, saves: ['Fort', 'Ref', 'Will'], skills: 6 },
  Elemental: { pt: 'Elemental', hd: 8, bab: 0.75, saves: ['Ref'], skills: 2 },
  Fey: { pt: 'Fada', hd: 6, bab: 0.5, saves: ['Ref', 'Will'], skills: 6 },
  Giant: { pt: 'Gigante', hd: 8, bab: 0.75, saves: ['Fort'], skills: 2 },
  Humanoid: { pt: 'Humanoide', hd: 8, bab: 0.75, saves: ['Ref'], skills: 2 },
  MagicalBeast: { pt: 'Besta Mágica', hd: 10, bab: 1, saves: ['Fort', 'Ref'], skills: 2 },
  MonstrousHumanoid: { pt: 'Humanoide Monstruoso', hd: 8, bab: 1, saves: ['Ref', 'Will'], skills: 2 },
  Ooze: { pt: 'Limo', hd: 10, bab: 0.75, saves: [], skills: 2 },
  Outsider: { pt: 'Extra-planar', hd: 8, bab: 1, saves: ['Fort', 'Ref', 'Will'], skills: 8 },
  Plant: { pt: 'Planta', hd: 8, bab: 0.75, saves: ['Fort'], skills: 2 },
  Undead: { pt: 'Morto-vivo', hd: 12, bab: 0.5, saves: ['Will'], skills: 4, noCon: true },
  Vermin: { pt: 'Verme', hd: 8, bab: 0.75, saves: ['Fort'], skills: 2 },
};

const sizeRules = {
  Tiny: { pt: 'Miúdo', ac: 2, atk: 2, grapple: -8, space: '0,75 m', reach: '0 m' },
  Small: { pt: 'Pequeno', ac: 1, atk: 1, grapple: -4, space: '1,5 m', reach: '1,5 m' },
  Medium: { pt: 'Médio', ac: 0, atk: 0, grapple: 0, space: '1,5 m', reach: '1,5 m' },
  Large: { pt: 'Grande', ac: -1, atk: -1, grapple: 4, space: '3 m', reach: '3 m' },
  Huge: { pt: 'Enorme', ac: -2, atk: -2, grapple: 8, space: '4,5 m', reach: '4,5 m' },
  Gargantuan: { pt: 'Imenso', ac: -4, atk: -4, grapple: 12, space: '6 m', reach: '6 m' },
};

const roles = {
  Bruto: { hdRate: 1.9, atk: 0, note: 'PV e dano acima da média.' },
  Soldado: { hdRate: 1.35, atk: 1, note: 'Linha de frente equilibrada.' },
  Furtivo: { hdRate: 1.05, atk: 2, note: 'Ataque e perícias acima da média.' },
  Controlador: { hdRate: 1.1, atk: 0, note: 'Habilidades especiais importam mais que dano.' },
  Conjurador: { hdRate: 0.9, atk: -1, note: 'Magias e CDs compensam corpo frágil.' },
  Tanque: { hdRate: 1.7, atk: -1, note: 'Dura muito, causa menos dano.' },
  Elite: { hdRate: 2.3, atk: 1, note: 'Para chefe ou criatura solo.' },
};

function newAttack(kind = 'melee') {
  const isRanged = kind === 'ranged';
  const isSpecial = kind === 'special';
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: isSpecial ? 'Ação especial' : isRanged ? 'Arco curto' : 'Espada longa',
    category: kind,
    ability: isRanged ? 'dex' : 'str',
    extra: 0,
    manual: false,
    manualBonus: 0,
    damage: isSpecial ? '' : isRanged ? '1d6' : '1d8',
    crit: isSpecial ? '' : isRanged ? 'x3' : '19-20/x2',
    range: isRanged ? '18 m' : '',
    count: 1,
    includeFull: !isSpecial,
    notes: '',
  };
}

const exampleMonster = {
  name: 'Goblin das Ruínas', size: 'Small', type: 'Humanoid', subtype: 'Goblinoide', alignment: 'Geralmente neutro e mau', role: 'Furtivo', expectedUse: 'Bando',
  ac5e: 15, hp5e: 7, attack5e: 4, dpr5e: 5, dc5e: 0, cr5e: '1/4', cr35Target: '1/3',
  str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
  hdMode: 'manual', hdManual: 1, hpMode: 'average', hpManual: 5, babMode: 'auto', babManual: 0, babExtra: 0,
  speed: '9 m (6 quadrados)', armorBonus: 1, shieldBonus: 1, naturalArmor: 0, deflectionBonus: 0, dodgeBonus: 0, acOther: 0,
  fortExtra: 0, refExtra: 0, willExtra: 0, initiativeExtra: 0, grappleExtra: 0,
  attacks: [
    { ...newAttack('melee'), id: 'atk-melee-1', name: 'Cimitarra', ability: 'dex', damage: '1d4-1', crit: '18-20/x2', count: 1 },
    { ...newAttack('ranged'), id: 'atk-ranged-1', name: 'Arco curto', ability: 'dex', damage: '1d4', crit: 'x3', range: '18 m', count: 1 },
  ],
  specialAttacks: '—', specialQualities: 'Visão no escuro 18 m, escapada ágil',
  traits5e: 'Escapada Ágil: o goblin pode Desengajar ou Esconder-se com uma ação bônus.',
  abilityText: 'Escapada Ágil (Ex): Uma vez por rodada, como ação rápida, o goblin pode realizar um teste de Esconder-se após se mover, desde que tenha cobertura ou ocultação, ou pode se afastar 1,5 m de uma criatura adjacente sem provocar ataques de oportunidade dessa criatura.',
  skills: 'Esconder-se +6, Furtividade +6, Observar +2, Ouvir +2', feats: 'Prontidão',
  environment: 'Planícies temperadas ou subterrâneo', organization: 'Gangue, bando ou tribo', treasure: 'Padrão', advancement: 'Conforme a classe do personagem', levelAdjustment: '+0',
};

const emptyMonster = {
  ...exampleMonster, name: '', subtype: '', alignment: '', ac5e: 10, hp5e: 1, attack5e: 0, dpr5e: 0, dc5e: 0, cr5e: '1', cr35Target: '1',
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  hdMode: 'auto', hdManual: 1, hpMode: 'average', hpManual: 1, babMode: 'auto', babManual: 0, babExtra: 0,
  speed: '', armorBonus: 0, shieldBonus: 0, naturalArmor: 0, deflectionBonus: 0, dodgeBonus: 0, acOther: 0,
  fortExtra: 0, refExtra: 0, willExtra: 0, attacks: [], specialAttacks: '', specialQualities: '', traits5e: '', abilityText: '', skills: '', feats: '', environment: '', organization: '', treasure: '', advancement: '', levelAdjustment: '',
};

const help = {
  role: 'Função da criatura no combate. Isso muda sugestões de HD, ataque e alertas.',
  cr35Target: 'CR desejado na 3.5E. Normalmente comece igual ao ND 5E e ajuste depois.',
  hdMode: 'Automático usa CR alvo + papel + tipo. Manual permite controlar a estrutura real da 3.5E.',
  hdManual: 'Dados de Vida finais da 3.5E. HD mexe em PV, BAB, saves, perícias, talentos e CDs.',
  attack5e: 'Bônus de ataque original da 5E. Usado só para diagnóstico comparativo.',
  dpr5e: 'Dano médio por rodada na 5E. Some multiataques se houver.',
  dc5e: 'CD de resistência original da 5E, se a criatura tiver habilidades que exigem teste.',
  traits5e: 'Traços da 5E não são talentos 3.5E. Eles devem virar Ataques Especiais ou Qualidades Especiais.',
};

function mod(score) { return Math.floor((Number(score || 10) - 10) / 2); }
function signed(n) { const v = Number(n || 0); return v >= 0 ? `+${v}` : `${v}`; }
function parseCr(cr) { if (String(cr).includes('/')) { const [a, b] = String(cr).split('/').map(Number); return a / b || 1; } return Number(cr) || 1; }
function averageDie(die) { return die / 2 + 0.5; }
function parseDamageAverage(text) {
  const match = String(text || '').match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) return 0;
  return Number(match[1]) * averageDie(Number(match[2])) + Number(match[3] || 0);
}
function estimateHd(monster, type) {
  const cr = parseCr(monster.cr35Target || monster.cr5e || 1);
  const role = roles[monster.role] || roles.Soldado;
  return Math.max(1, Math.round(Math.max(0.5, cr) * role.hdRate + (cr < 1 ? 0 : 0.5)));
}
function baseSave(hd, good) { return good ? Math.floor(2 + hd / 2) : Math.floor(hd / 3); }
function abilityMod(monster, ability) { return ability === 'dex' ? mod(monster.dex) : ability === 'none' ? 0 : mod(monster.str); }
function attackBonus(monster, attack, bab, size, role) {
  if (attack.manual) return Number(attack.manualBonus || 0);
  const ability = attack.category === 'ranged' ? mod(monster.dex) : abilityMod(monster, attack.ability);
  return bab + ability + size.atk + Number(attack.extra || 0) + role.atk;
}
function formatAttack(a) {
  if (!a) return '—';
  const mode = a.category === 'ranged' ? 'à distância' : a.category === 'touch' ? 'toque' : a.category === 'special' ? 'especial' : 'corpo a corpo';
  const range = a.range ? `, ${a.range}` : '';
  const crit = a.crit ? `/${a.crit}` : '';
  const damage = a.damage ? ` (${a.damage}${crit}${range})` : '';
  return `${a.name || 'Ataque'} ${signed(a.bonus)} ${mode}${damage}`;
}
function fullAttackText(attacks) {
  const active = attacks.filter((a) => a.includeFull !== false);
  return (active.length ? active : attacks).map((a) => `${Number(a.count || 1) > 1 ? `${a.count}× ` : ''}${formatAttack(a)}`).join(' e ') || '—';
}
function acText(m) {
  return [['tamanho', m.acParts.tamanho], ['Des', m.acParts.Des], ['armadura', m.acParts.armadura], ['escudo', m.acParts.escudo], ['natural', m.acParts.natural], ['deflexão', m.acParts.deflexao], ['esquiva', m.acParts.esquiva], ['outros', m.acParts.outros]]
    .filter(([, v]) => Number(v || 0) !== 0)
    .map(([k, v]) => `${signed(v)} ${k}`).join(', ') || 'sem modificadores';
}
function hdText(m) {
  const conTotal = (m.typeRule.noCon ? 0 : mod(m.con)) * m.hd;
  return `${m.hd}d${m.hdDie}${conTotal ? signed(conTotal) : ''} (${m.hp} PV)`;
}

function build35(monster) {
  const type = typeRules[monster.type] || typeRules.Humanoid;
  const size = sizeRules[monster.size] || sizeRules.Medium;
  const role = roles[monster.role] || roles.Soldado;
  const conMod = type.noCon ? 0 : mod(monster.con);
  const hd = monster.hdMode === 'manual' ? Math.max(1, Number(monster.hdManual || 1)) : estimateHd(monster, type);
  const hpAverage = Math.max(1, Math.round(hd * (averageDie(type.hd) + conMod)));
  const hp = monster.hpMode === 'manual' ? Math.max(1, Number(monster.hpManual || hpAverage)) : hpAverage;
  const babAuto = Math.floor(hd * type.bab);
  const bab = monster.babMode === 'manual' ? Number(monster.babManual || 0) : babAuto + Number(monster.babExtra || 0);
  const dex = mod(monster.dex);
  const str = mod(monster.str);
  const wis = mod(monster.wis);
  const acParts = { tamanho: size.ac, Des: dex, armadura: Number(monster.armorBonus || 0), escudo: Number(monster.shieldBonus || 0), natural: Number(monster.naturalArmor || 0), deflexao: Number(monster.deflectionBonus || 0), esquiva: Number(monster.dodgeBonus || 0), outros: Number(monster.acOther || 0) };
  const ac = 10 + Object.values(acParts).reduce((a, b) => a + Number(b || 0), 0);
  const touch = 10 + acParts.tamanho + acParts.Des + acParts.deflexao + acParts.esquiva + acParts.outros;
  const flat = ac - Math.max(0, dex) - Math.max(0, acParts.esquiva);
  const fort = baseSave(hd, type.saves.includes('Fort')) + conMod + Number(monster.fortExtra || 0);
  const ref = baseSave(hd, type.saves.includes('Ref')) + dex + Number(monster.refExtra || 0);
  const will = baseSave(hd, type.saves.includes('Will')) + wis + Number(monster.willExtra || 0);
  const initiative = dex + Number(monster.initiativeExtra || 0);
  const grapple = bab + str + size.grapple + Number(monster.grappleExtra || 0);
  const attacks = (monster.attacks || []).map((a) => ({ ...a, bonus: attackBonus(monster, a, bab, size, role) }));
  const primaryAttack = attacks[0] || null;
  const dpr35 = attacks.filter((a) => a.includeFull !== false).reduce((sum, a) => sum + parseDamageAverage(a.damage) * Math.max(1, Number(a.count || 1)), 0);
  const warnings = [];
  const cr = parseCr(monster.cr35Target || 1);
  if (hd > Math.max(2, cr * 3)) warnings.push('HD alto para o CR alvo: BAB, saves e PV podem ficar inflados.');
  if (Number(monster.hp5e || 0) && hp > Number(monster.hp5e) * 1.8) warnings.push('PV 3.5E muito acima da referência 5E.');
  if (Number(monster.attack5e || 0) && attacks[0] && Math.abs(attacks[0].bonus - Number(monster.attack5e)) >= 4) warnings.push('Bônus de ataque principal 3.5E muito distante do ataque 5E informado.');
  if (Number(monster.dpr5e || 0) && dpr35 > Number(monster.dpr5e) * 1.8) warnings.push('Dano médio do Ataque Total parece alto comparado ao dano 5E informado.');
  if ((monster.traits5e || '').trim() && !(monster.abilityText || '').trim()) warnings.push('Há traços 5E informados, mas nenhuma habilidade 3.5E convertida.');
  if (/vis[aã]o no escuro|darkvision/i.test(monster.feats || '')) warnings.push('Visão no escuro parece estar em Talentos; normalmente deve ir em Qualidades Especiais.');
  if (!attacks.length) warnings.push('Nenhum ataque cadastrado. Adicione ao menos uma ação ou ataque.');
  if (!warnings.length) warnings.push('Sem alertas graves. Ainda assim, revise em comparação com o grupo e o encontro.');
  const built = { ...monster, displayName: monster.name?.trim() || 'Criatura sem nome', typePt: type.pt, sizePt: size.pt, hd, hdDie: type.hd, hp, bab, ac, touch, flat, fort, ref, will, initiative, grapple, space: size.space, reach: size.reach, attacks, primaryAttack, fullAttack: fullAttackText(attacks), dpr35, warnings, typeRule: type, roleRule: role, acParts };
  built.hdLine = hdText(built);
  return built;
}

function makeTxt(m) {
  return `${m.displayName.toUpperCase()}\n${m.sizePt} ${m.typePt}${m.subtype ? ` (${m.subtype})` : ''}${m.alignment ? `, ${m.alignment}` : ''}\nDados de Vida: ${m.hdLine}\nIniciativa: ${signed(m.initiative)}\nDeslocamento: ${m.speed || '—'}\nClasse de Armadura: ${m.ac} (${acText(m)}), toque ${m.touch}, surpreso ${m.flat}\nAtaque Base/Agarrar: ${signed(m.bab)}/${signed(m.grapple)}\nAtaque: ${formatAttack(m.primaryAttack)}\nAtaque Total: ${m.fullAttack}\nEspaço/Alcance: ${m.space}/${m.reach}\nAtaques Especiais: ${m.specialAttacks || '—'}\nQualidades Especiais: ${m.specialQualities || '—'}\nTestes de Resistência: Fort ${signed(m.fort)}, Ref ${signed(m.ref)}, Von ${signed(m.will)}\nHabilidades: For ${m.str}, Des ${m.dex}, Con ${m.typeRule.noCon ? '—' : m.con}, Int ${m.int}, Sab ${m.wis}, Car ${m.cha}\nPerícias: ${m.skills || '—'}\nTalentos: ${m.feats || '—'}\nAmbiente: ${m.environment || '—'}\nOrganização: ${m.organization || '—'}\nNível de Desafio: ${m.cr35Target || m.cr5e || '—'}\nTesouro: ${m.treasure || '—'}\nTendência: ${m.alignment || '—'}\nProgressão: ${m.advancement || '—'}\nAjuste de Nível: ${m.levelAdjustment || '—'}\n\n${m.abilityText || ''}\n`;
}

function downloadText(filename, content, type = 'text/plain;charset=utf-8') { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function HelpTip({ text }) { return <span className="help-wrap" tabIndex={0}><HelpCircle size={15} /><span className="help-popover">{text}</span></span>; }
function Label({ children, helpText }) { return <span className="field-label"><span>{children}</span>{helpText && <HelpTip text={helpText} />}</span>; }
function Field({ label, value, onChange, type = 'text', helpText }) { return <label className="field-shell"><Label helpText={helpText}>{label}</Label><input className="input" type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} /></label>; }
function SelectField({ label, value, onChange, options, helpText }) { return <label className="field-shell"><Label helpText={helpText}>{label}</Label><select className="input" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>; }
function TextArea({ label, value, onChange, rows = 3, helpText }) { return <label className="field-shell"><Label helpText={helpText}>{label}</Label><textarea className="input min-h-[92px] resize-y" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function Panel({ title, subtitle, icon, children }) { return <section className="codex-panel"><div className="panel-title">{icon}<div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div></div><div className="grid gap-4">{children}</div></section>; }
function Advanced({ title = 'Opções avançadas', children }) { return <details className="advanced-box"><summary>{title}</summary><div className="advanced-content">{children}</div></details>; }
function StatLine({ label, children }) { return <p className="stat-line"><strong>{label}:</strong> <span>{children}</span></p>; }
function Metric({ label, value, detail }) { return <div className="metric"><span>{label}</span><strong>{value}</strong>{detail && <em>{detail}</em>}</div>; }

function StatBlock({ monster, innerRef }) {
  return <article ref={innerRef} className="statblock"><header><h2>{monster.displayName}</h2><p>{monster.sizePt} {monster.typePt}{monster.subtype ? ` (${monster.subtype})` : ''}{monster.alignment ? `, ${monster.alignment}` : ''}</p></header><section>
    <StatLine label="Dados de Vida">{monster.hdLine}</StatLine>
    <StatLine label="Iniciativa">{signed(monster.initiative)}</StatLine>
    <StatLine label="Deslocamento">{monster.speed || '—'}</StatLine>
    <StatLine label="Classe de Armadura">{monster.ac} ({acText(monster)}), toque {monster.touch}, surpreso {monster.flat}</StatLine>
    <StatLine label="Ataque Base/Agarrar">{signed(monster.bab)}/{signed(monster.grapple)}</StatLine>
    <StatLine label="Ataque">{formatAttack(monster.primaryAttack)}</StatLine>
    <StatLine label="Ataque Total">{monster.fullAttack}</StatLine>
    <StatLine label="Espaço/Alcance">{monster.space}/{monster.reach}</StatLine>
    <StatLine label="Ataques Especiais">{monster.specialAttacks || '—'}</StatLine>
    <StatLine label="Qualidades Especiais">{monster.specialQualities || '—'}</StatLine>
    <StatLine label="Testes de Resistência">Fort {signed(monster.fort)}, Ref {signed(monster.ref)}, Von {signed(monster.will)}</StatLine>
    <StatLine label="Habilidades">For {monster.str}, Des {monster.dex}, Con {monster.typeRule.noCon ? '—' : monster.con}, Int {monster.int}, Sab {monster.wis}, Car {monster.cha}</StatLine>
    <StatLine label="Perícias">{monster.skills || '—'}</StatLine><StatLine label="Talentos">{monster.feats || '—'}</StatLine><StatLine label="Ambiente">{monster.environment || '—'}</StatLine><StatLine label="Organização">{monster.organization || '—'}</StatLine><StatLine label="Nível de Desafio">{monster.cr35Target || monster.cr5e || '—'}</StatLine><StatLine label="Tesouro">{monster.treasure || '—'}</StatLine><StatLine label="Tendência">{monster.alignment || '—'}</StatLine><StatLine label="Progressão">{monster.advancement || '—'}</StatLine><StatLine label="Ajuste de Nível">{monster.levelAdjustment || '—'}</StatLine></section>{monster.abilityText && <div className="ability-text">{monster.abilityText}</div>}</article>;
}

function AttackEditor({ attack, index, updateAttack, removeAttack }) {
  return <div className="attack-box"><div className="mb-3 flex items-center justify-between gap-3"><h4>Ataque/Ação {index + 1}</h4><button type="button" className="btn danger !min-h-9 !px-3" onClick={() => removeAttack(attack.id)}><X size={16} /> Remover</button></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Nome" value={attack.name} onChange={(v) => updateAttack(attack.id, 'name', v)} /><SelectField label="Tipo" value={attack.category} onChange={(v) => updateAttack(attack.id, 'category', v)} options={['melee', 'ranged', 'natural', 'touch', 'special']} /></div>
    <div className="grid gap-4 sm:grid-cols-3"><SelectField label="Atributo" value={attack.ability} onChange={(v) => updateAttack(attack.id, 'ability', v)} options={['str', 'dex', 'none']} /><Field label="Bônus extra" type="number" value={attack.extra} onChange={(v) => updateAttack(attack.id, 'extra', v)} /><Field label="Qtd. no total" type="number" value={attack.count} onChange={(v) => updateAttack(attack.id, 'count', v)} /></div>
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Dano" value={attack.damage} onChange={(v) => updateAttack(attack.id, 'damage', v)} /><Field label="Crítico" value={attack.crit} onChange={(v) => updateAttack(attack.id, 'crit', v)} /><Field label="Alcance/distância" value={attack.range} onChange={(v) => updateAttack(attack.id, 'range', v)} /></div>
    <div className="grid gap-2 sm:grid-cols-2"><label className="check-row"><input type="checkbox" checked={attack.manual} onChange={(e) => updateAttack(attack.id, 'manual', e.target.checked)} /> Usar bônus manual</label><label className="check-row"><input type="checkbox" checked={attack.includeFull !== false} onChange={(e) => updateAttack(attack.id, 'includeFull', e.target.checked)} /> Entra no Ataque Total</label></div>
    {attack.manual && <Field label="Bônus manual" type="number" value={attack.manualBonus} onChange={(v) => updateAttack(attack.id, 'manualBonus', v)} />}
    <Advanced title="Notas e detalhes desta ação"><TextArea label="Notas da ação" rows={2} value={attack.notes} onChange={(v) => updateAttack(attack.id, 'notes', v)} /></Advanced>
  </div>;
}

function App() {
  const [monster, setMonster] = useState(exampleMonster);
  const statRef = useRef(null);
  const converted = useMemo(() => build35(monster), [monster]);
  const set = (key, value) => setMonster((m) => ({ ...m, [key]: value }));
  const updateAttack = (id, key, value) => setMonster((m) => ({ ...m, attacks: (m.attacks || []).map((a) => (a.id === id ? { ...a, [key]: value } : a)) }));
  const addAttack = (kind = 'melee') => setMonster((m) => ({ ...m, attacks: [...(m.attacks || []), newAttack(kind)] }));
  const removeAttack = (id) => setMonster((m) => ({ ...m, attacks: (m.attacks || []).filter((a) => a.id !== id) }));
  async function downloadPng() { if (!statRef.current) return; const dataUrl = await toPng(statRef.current, { pixelRatio: 2, backgroundColor: '#ead8b7', cacheBust: true }); const a = document.createElement('a'); a.href = dataUrl; a.download = `${converted.displayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-') || 'monstro'}-3-5e.png`; a.click(); }

  return <main className="app-shell"><div className="arcane-glow" /><div className="mx-auto max-w-[1520px] px-3 py-5 sm:px-6 lg:px-8">
    <header className="hero-card"><div className="hero-kicker"><Skull size={18} /> DNDMC · Oficina de Conversão</div><div className="hero-grid"><div><h1>Forja de Monstros 5E → 3.5E</h1><p>Uma bancada de mestre para transformar perfil de ameaça da 5E em bloco mecânico de D&D 3.5E: CR alvo, papel, HD, CA por componentes, ataques dinâmicos e diagnóstico.</p></div><div className="action-rack"><button onClick={() => setMonster(exampleMonster)} className="btn ghost"><Sparkles size={18} /> Exemplo</button><button onClick={() => setMonster(emptyMonster)} className="btn danger"><Trash2 size={18} /> Limpar</button><button onClick={() => downloadText(`${converted.displayName}.txt`, makeTxt(converted))} className="btn"><FileText size={18} /> TXT</button><button onClick={() => downloadText(`${converted.displayName}.json`, JSON.stringify(monster, null, 2), 'application/json')} className="btn"><FileJson size={18} /> JSON</button><button onClick={downloadPng} className="btn gold"><ImageDown size={18} /> PNG</button></div></div></header>
    <div className="layout-grid"><aside className="left-rail">
      <Panel title="Identidade" subtitle="Conceito e estrutura-base" icon={<Wand2 size={20} />}><Field label="Nome" value={monster.name} onChange={(v) => set('name', v)} /><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Tamanho" value={monster.size} onChange={(v) => set('size', v)} options={Object.keys(sizeRules)} /><SelectField label="Tipo 3.5E" value={monster.type} onChange={(v) => set('type', v)} options={Object.keys(typeRules)} /></div><Field label="Tendência" value={monster.alignment} onChange={(v) => set('alignment', v)} /><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Papel" value={monster.role} onChange={(v) => set('role', v)} options={Object.keys(roles)} helpText={help.role} /><SelectField label="Uso esperado" value={monster.expectedUse} onChange={(v) => set('expectedUse', v)} options={['Solitário', 'Dupla', 'Grupo pequeno', 'Bando', 'Horda', 'Chefe com lacaios']} /></div><Advanced><Field label="Subtipo" value={monster.subtype} onChange={(v) => set('subtype', v)} /></Advanced></Panel>
      <Panel title="Referência 5E" subtitle="Não vira cálculo direto; serve de fotografia" icon={<Shield size={20} />}><div className="grid gap-4 sm:grid-cols-3"><Field label="CA 5E" type="number" value={monster.ac5e} onChange={(v) => set('ac5e', v)} /><Field label="PV 5E" type="number" value={monster.hp5e} onChange={(v) => set('hp5e', v)} /><Field label="ND 5E" value={monster.cr5e} onChange={(v) => set('cr5e', v)} /></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Ataque 5E" type="number" value={monster.attack5e} onChange={(v) => set('attack5e', v)} helpText={help.attack5e} /><Field label="DPR 5E" type="number" value={monster.dpr5e} onChange={(v) => set('dpr5e', v)} helpText={help.dpr5e} /><Field label="CD 5E" type="number" value={monster.dc5e} onChange={(v) => set('dc5e', v)} helpText={help.dc5e} /></div><Advanced title="Colar traços da 5E"><TextArea label="Traços 5E" value={monster.traits5e} onChange={(v) => set('traits5e', v)} helpText={help.traits5e} /></Advanced></Panel>
      <Panel title="Motor 3.5E" subtitle="Aqui nasce a ficha real" icon={<Skull size={20} />}><Field label="CR 3.5E alvo" value={monster.cr35Target} onChange={(v) => set('cr35Target', v)} helpText={help.cr35Target} /><div className="grid gap-4 sm:grid-cols-2"><SelectField label="HD" value={monster.hdMode} onChange={(v) => set('hdMode', v)} options={['auto', 'manual']} helpText={help.hdMode} />{monster.hdMode === 'manual' && <Field label="HD manual" type="number" value={monster.hdManual} onChange={(v) => set('hdManual', v)} helpText={help.hdManual} />}</div><div className="grid gap-4 sm:grid-cols-2"><SelectField label="PV" value={monster.hpMode} onChange={(v) => set('hpMode', v)} options={['average', 'manual']} />{monster.hpMode === 'manual' && <Field label="PV manual" type="number" value={monster.hpManual} onChange={(v) => set('hpManual', v)} />}</div><Advanced title="BAB e ajustes avançados"><div className="grid gap-4 sm:grid-cols-3"><SelectField label="BAB" value={monster.babMode} onChange={(v) => set('babMode', v)} options={['auto', 'manual']} />{monster.babMode === 'manual' && <Field label="BAB manual" type="number" value={monster.babManual} onChange={(v) => set('babManual', v)} />}<Field label="Bônus BAB" type="number" value={monster.babExtra} onChange={(v) => set('babExtra', v)} /></div></Advanced></Panel>
      <Panel title="Habilidades" subtitle="Atributos e ajustes de resistência" icon={<Sparkles size={20} />}><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{['str','dex','con','int','wis','cha'].map((k) => <Field key={k} label={k.toUpperCase()} type="number" value={monster[k]} onChange={(v) => set(k, v)} />)}</div><Advanced title="Ajustes de resistência"><div className="grid gap-4 sm:grid-cols-3"><Field label="Fort extra" type="number" value={monster.fortExtra} onChange={(v) => set('fortExtra', v)} /><Field label="Ref extra" type="number" value={monster.refExtra} onChange={(v) => set('refExtra', v)} /><Field label="Von extra" type="number" value={monster.willExtra} onChange={(v) => set('willExtra', v)} /></div></Advanced></Panel>
      <Panel title="Defesa" subtitle="CA por componentes, sem gambiarra" icon={<Shield size={20} />}><Field label="Deslocamento" value={monster.speed} onChange={(v) => set('speed', v)} /><div className="grid gap-4 sm:grid-cols-3"><Field label="Armadura" type="number" value={monster.armorBonus} onChange={(v) => set('armorBonus', v)} /><Field label="Escudo" type="number" value={monster.shieldBonus} onChange={(v) => set('shieldBonus', v)} /><Field label="Natural" type="number" value={monster.naturalArmor} onChange={(v) => set('naturalArmor', v)} /></div><Advanced title="Bônus avançados de CA"><div className="grid gap-4 sm:grid-cols-3"><Field label="Deflexão" type="number" value={monster.deflectionBonus} onChange={(v) => set('deflectionBonus', v)} /><Field label="Esquiva" type="number" value={monster.dodgeBonus} onChange={(v) => set('dodgeBonus', v)} /><Field label="Outros" type="number" value={monster.acOther} onChange={(v) => set('acOther', v)} /></div></Advanced></Panel>
      <Panel title="Ataques e ações" subtitle="Adicione só o que o monstro realmente usa" icon={<Wand2 size={20} />}><div className="grid gap-2 sm:grid-cols-3"><button type="button" className="btn gold" onClick={() => addAttack('melee')}><Plus size={18} /> Corpo a corpo</button><button type="button" className="btn ghost" onClick={() => addAttack('ranged')}><Plus size={18} /> Distância</button><button type="button" className="btn ghost" onClick={() => addAttack('special')}><Plus size={18} /> Especial</button></div>{(monster.attacks || []).map((attack, index) => <AttackEditor key={attack.id} attack={attack} index={index} updateAttack={updateAttack} removeAttack={removeAttack} />)}</Panel>
      <Panel title="Finalização" subtitle="O que entra no bloco 3.5E" icon={<FileText size={20} />}><TextArea label="Ataques Especiais" value={monster.specialAttacks} onChange={(v) => set('specialAttacks', v)} /><TextArea label="Qualidades Especiais" value={monster.specialQualities} onChange={(v) => set('specialQualities', v)} /><TextArea label="Habilidades convertidas" rows={6} value={monster.abilityText} onChange={(v) => set('abilityText', v)} /><TextArea label="Perícias" value={monster.skills} onChange={(v) => set('skills', v)} /><TextArea label="Talentos" value={monster.feats} onChange={(v) => set('feats', v)} /><Advanced title="Ecologia e tesouro"><div className="grid gap-4 sm:grid-cols-2"><Field label="Ambiente" value={monster.environment} onChange={(v) => set('environment', v)} /><Field label="Organização" value={monster.organization} onChange={(v) => set('organization', v)} /></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Tesouro" value={monster.treasure} onChange={(v) => set('treasure', v)} /><Field label="Progressão" value={monster.advancement} onChange={(v) => set('advancement', v)} /><Field label="Ajuste de Nível" value={monster.levelAdjustment} onChange={(v) => set('levelAdjustment', v)} /></div></Advanced></Panel>
    </aside><section className="right-stage"><div className="diagnostic-card"><div><h2>Diagnóstico da Forja</h2><p>{converted.roleRule.note}</p></div><button onClick={() => navigator.clipboard.writeText(makeTxt(converted))} className="btn ghost"><Copy size={18} /> Copiar bloco</button><div className="metrics-grid"><Metric label="CR alvo" value={converted.cr35Target || '—'} detail={`ND 5E ${converted.cr5e || '—'}`} /><Metric label="HD/PV" value={`${converted.hd}d${converted.hdDie}`} detail={`${converted.hp} PV`} /><Metric label="CA" value={converted.ac} detail={`toque ${converted.touch}, surpreso ${converted.flat}`} /><Metric label="Ataque" value={converted.attacks[0] ? signed(converted.attacks[0].bonus) : '—'} detail={`5E ${signed(monster.attack5e)}`} /><Metric label="Dano médio" value={converted.dpr35 ? converted.dpr35.toFixed(1) : '—'} detail={`5E ${monster.dpr5e || '—'}`} /><Metric label="Ações" value={converted.attacks.length} detail={monster.expectedUse} /></div><ul className="warnings">{converted.warnings.map((w) => <li key={w}>{w}</li>)}</ul></div><div className="preview-wrap"><StatBlock monster={converted} innerRef={statRef} /></div></section></div>
  </div></main>;
}

createRoot(document.getElementById('root')).render(<App />);
