import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Copy, FileJson, FileText, HelpCircle, ImageDown, RotateCcw, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import './styles.css';

const typeRules = {
  Aberration: { pt: 'Aberração', hd: 8, bab: 0.75, saves: ['Will'], skills: 2 },
  Beast: { pt: 'Animal', hd: 8, bab: 0.75, saves: ['Fort', 'Ref'], skills: 2 },
  Celestial: { pt: 'Extra-planar', hd: 8, bab: 1, saves: ['Fort', 'Ref', 'Will'], skills: 8 },
  Construct: { pt: 'Constructo', hd: 10, bab: 0.75, saves: [], skills: 2 },
  Dragon: { pt: 'Dragão', hd: 12, bab: 1, saves: ['Fort', 'Ref', 'Will'], skills: 6 },
  Elemental: { pt: 'Elemental', hd: 8, bab: 0.75, saves: ['Ref'], skills: 2 },
  Fey: { pt: 'Fada', hd: 6, bab: 0.5, saves: ['Ref', 'Will'], skills: 6 },
  Fiend: { pt: 'Extra-planar', hd: 8, bab: 1, saves: ['Fort', 'Ref', 'Will'], skills: 8 },
  Giant: { pt: 'Gigante', hd: 8, bab: 0.75, saves: ['Fort'], skills: 2 },
  Humanoid: { pt: 'Humanoide', hd: 8, bab: 0.75, saves: ['Ref'], skills: 2 },
  Monstrosity: { pt: 'Besta Mágica', hd: 10, bab: 1, saves: ['Fort', 'Ref'], skills: 2 },
  Ooze: { pt: 'Limo', hd: 10, bab: 0.75, saves: [], skills: 2 },
  Plant: { pt: 'Planta', hd: 8, bab: 0.75, saves: ['Fort'], skills: 2 },
  Undead: { pt: 'Morto-vivo', hd: 12, bab: 0.5, saves: ['Will'], skills: 4 },
};

const sizeRules = {
  Tiny: { pt: 'Miúdo', ac: 2, atk: 2, grapple: -8, space: '2-1/2 ft.', reach: '0 ft.' },
  Small: { pt: 'Pequeno', ac: 1, atk: 1, grapple: -4, space: '5 ft.', reach: '5 ft.' },
  Medium: { pt: 'Médio', ac: 0, atk: 0, grapple: 0, space: '5 ft.', reach: '5 ft.' },
  Large: { pt: 'Grande', ac: -1, atk: -1, grapple: 4, space: '10 ft.', reach: '10 ft.' },
  Huge: { pt: 'Enorme', ac: -2, atk: -2, grapple: 8, space: '15 ft.', reach: '15 ft.' },
  Gargantuan: { pt: 'Imenso', ac: -4, atk: -4, grapple: 12, space: '20 ft.', reach: '20 ft.' },
};

const exampleMonster = {
  name: 'Orc Agressivo',
  size: 'Medium',
  type: 'Humanoid',
  subtype: 'Orc',
  alignment: 'Frequentemente caótico e mau',
  ac5e: 13,
  hp5e: 15,
  speed: '30 ft.',
  cr5e: '1/2',
  str: 16,
  dex: 12,
  con: 16,
  int: 7,
  wis: 11,
  cha: 10,
  naturalArmor: 0,
  armorBonus: 3,
  shieldBonus: 0,
  mainAttack: 'Machado grande',
  mainDamage: '1d12+4/x3',
  specialAttacks: 'Agressivo',
  specialQualities: 'Visão no escuro 60 ft., sensibilidade à luz',
  skills: 'Intimidar +2, Observar +1, Ouvir +1',
  feats: 'Foco em Arma (machado grande)',
  environment: 'Colinas temperadas ou subterrâneo',
  organization: 'Solitário, dupla, patrulha (3–8) ou bando (10–40)',
  treasure: 'Padrão',
  advancement: 'Por classe de personagem',
  levelAdjustment: '+0',
  abilityText: 'Agressivo (Ex): Uma vez por rodada, se o orc puder ver uma criatura hostil, ele pode se mover até seu deslocamento em direção a ela como uma ação de movimento.\n\nSensibilidade à Luz (Ex): Orcs ficam ofuscados sob luz solar intensa ou dentro da área de uma magia daylight.',
};

const emptyMonster = {
  name: '',
  size: 'Medium',
  type: 'Humanoid',
  subtype: '',
  alignment: '',
  ac5e: 10,
  hp5e: 1,
  speed: '',
  cr5e: '1',
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
  naturalArmor: 0,
  armorBonus: 0,
  shieldBonus: 0,
  mainAttack: '',
  mainDamage: '',
  specialAttacks: '',
  specialQualities: '',
  skills: '',
  feats: '',
  environment: '',
  organization: '',
  treasure: '',
  advancement: '',
  levelAdjustment: '',
  abilityText: '',
};

const help = {
  name: 'Nome final da criatura. Pode manter o nome da 5E ou adaptar para sua campanha.',
  size: 'Tamanho da criatura na 5E. O conversor usa isso para AC, ataque, Agarrar, espaço e alcance da 3.5E.',
  type: 'Tipo da criatura na 5E. Ele é mapeado para um tipo equivalente da 3.5E e define HD, BAB, saves e perícias.',
  subtype: 'Descritor entre parênteses na 3.5E, como Orc, Goblinoide, Fogo, Mal, Aquático ou Extraplanar.',
  alignment: 'Tendência típica da criatura. Ex.: Frequentemente caótico e mau, Geralmente neutro, Sempre leal e bom.',
  ac5e: 'Classe de Armadura original da 5E. Serve como referência, mas a CA 3.5 é recalculada por bônus separados.',
  hp5e: 'Pontos de vida médios da criatura na 5E. O conversor estima Dados de Vida 3.5 a partir deste valor.',
  speed: 'Deslocamento em formato 3.5E, preferencialmente em pés. Ex.: 30 ft.; voo 60 ft. (bom).',
  cr5e: 'Nível de Desafio da 5E. Use frações como 1/2 ou números como 3. O resultado 3.5 ainda precisa de revisão.',
  str: 'Força. Afeta ataque corpo a corpo, dano e Agarrar.',
  dex: 'Destreza. Afeta iniciativa, CA, Reflexos e ataques à distância.',
  con: 'Constituição. Afeta PV e Fortitude. Mortos-vivos e constructos podem precisar de ajuste manual.',
  int: 'Inteligência. Ajuda a decidir perícias, tática e idiomas.',
  wis: 'Sabedoria. Afeta Vontade, percepção e várias CDs de habilidades.',
  cha: 'Carisma. Afeta CDs de habilidades sobrenaturais, presença e algumas magias.',
  armorBonus: 'Bônus de armadura física na 3.5E. Ex.: couro +2, gibão de peles +3, cota de malha +5.',
  shieldBonus: 'Bônus de escudo na 3.5E. Use 0 se a criatura não carrega escudo.',
  naturalArmor: 'Bônus de armadura natural da criatura na 3.5E. Use para couro grosso, escamas, carapaça ou pele sobrenatural.',
  mainAttack: 'Ataque principal no formato narrativo. Ex.: Garra, Mordida, Machado grande, Pancada.',
  mainDamage: 'Dano convertido para 3.5E. Inclua crítico quando relevante. Ex.: 1d12+4/x3 ou 1d8+3.',
  specialAttacks: 'Ataques especiais da 3.5E. Ex.: agarrar aprimorado, sopro, veneno, investida poderosa.',
  specialQualities: 'Qualidades especiais. Ex.: visão no escuro, resistência a fogo 10, redução de dano, imunidades.',
  skills: 'Perícias finais da criatura na 3.5E. Ex.: Observar +6, Ouvir +6, Furtividade +8.',
  feats: 'Talentos finais da criatura. Ex.: Iniciativa Aprimorada, Ataque Poderoso, Foco em Arma.',
  environment: 'Ambiente típico. Ex.: Colinas temperadas, subterrâneo, pântanos quentes.',
  organization: 'Como a criatura aparece em encontro. Ex.: solitário, par, patrulha, bando.',
  treasure: 'Tesouro em termos de 3.5E. Ex.: Nenhum, Padrão, Dobro do padrão.',
  advancement: 'Como a criatura progride. Ex.: Por classe de personagem ou 4–8 HD (Médio).',
  levelAdjustment: 'Ajuste de nível para personagem jogador. Normalmente use — ou +0 se não for raça jogável.',
  abilityText: 'Texto completo das habilidades especiais convertidas. Use tags como (Ex), (Sob) ou (SM).',
};

function mod(score) {
  return Math.floor((Number(score || 10) - 10) / 2);
}

function signed(n) {
  const value = Number(n || 0);
  return value >= 0 ? `+${value}` : `${value}`;
}

function parseCr(cr) {
  if (String(cr).includes('/')) {
    const [a, b] = String(cr).split('/').map(Number);
    return a / b;
  }
  return Number(cr) || 1;
}

function estimateHd(monster, rule) {
  const targetHp = Math.max(1, Number(monster.hp5e) || 1);
  const conMod = mod(monster.con);
  const avgPerDie = rule.hd / 2 + 0.5 + conMod;
  return Math.max(1, Math.round(targetHp / Math.max(1, avgPerDie)));
}

function estimateCr(monster, hd) {
  const cr5 = parseCr(monster.cr5e);
  const hp = Number(monster.hp5e) || 1;
  let cr = Math.max(0.25, cr5);
  if (hp >= 15 && cr < 1) cr = 1;
  if (hd >= 8 && cr < 4) cr = Math.max(cr, Math.round(hd / 2));
  return cr % 1 === 0 ? String(cr) : String(monster.cr5e || '1');
}

function build35(monster) {
  const type = typeRules[monster.type] || typeRules.Humanoid;
  const size = sizeRules[monster.size] || sizeRules.Medium;
  const hd = estimateHd(monster, type);
  const conBonus = hd * mod(monster.con);
  const hp = Math.max(1, Math.round(hd * (type.hd / 2 + 0.5) + conBonus));
  const bab = Math.floor(hd * type.bab);
  const strMod = mod(monster.str);
  const dexMod = mod(monster.dex);
  const wisMod = mod(monster.wis);
  const armorBonus = Number(monster.armorBonus || 0);
  const shieldBonus = Number(monster.shieldBonus || 0);
  const naturalArmor = Number(monster.naturalArmor || 0);
  const ac = 10 + dexMod + size.ac + naturalArmor + armorBonus + shieldBonus;
  const touch = 10 + dexMod + size.ac;
  const flat = ac - Math.max(0, dexMod);
  const grapple = bab + strMod + size.grapple;
  const atk = bab + strMod + size.atk;
  const good = Math.floor(2 + hd / 2);
  const poor = Math.floor(hd / 3);
  const fort = (type.saves.includes('Fort') ? good : poor) + mod(monster.con);
  const ref = (type.saves.includes('Ref') ? good : poor) + dexMod;
  const will = (type.saves.includes('Will') ? good : poor) + wisMod;

  return {
    ...monster,
    displayName: monster.name?.trim() || 'Criatura sem nome',
    typePt: type.pt,
    sizePt: size.pt,
    hd,
    hdDie: type.hd,
    hp,
    bab,
    grapple,
    atk,
    ac,
    touch,
    flat,
    fort,
    ref,
    will,
    initiative: dexMod,
    space: size.space,
    reach: size.reach,
    cr35: estimateCr(monster, hd),
    typeRule: type,
  };
}

function makeTxt(m) {
  const conTotal = m.hd * mod(m.con);
  return `${m.displayName.toUpperCase()}\n${m.sizePt} ${m.typePt}${m.subtype ? ` (${m.subtype})` : ''}${m.alignment ? `, ${m.alignment}` : ''}\nDados de Vida: ${m.hd}d${m.hdDie}${signed(conTotal)} (${m.hp} PV)\nIniciativa: ${signed(m.initiative)}\nDeslocamento: ${m.speed || '—'}\nClasse de Armadura: ${m.ac} (${signed(mod(m.dex))} Des, ${signed(Number(m.armorBonus || 0))} armadura, ${signed(Number(m.shieldBonus || 0))} escudo, ${signed(Number(m.naturalArmor || 0))} natural), toque ${m.touch}, surpreso ${m.flat}\nBase de Ataque/Agarrar: ${signed(m.bab)}/${signed(m.grapple)}\nAtaque: ${m.mainAttack || 'Ataque'} ${signed(m.atk)} corpo a corpo (${m.mainDamage || '—'})\nAtaque Total: ${m.mainAttack || 'Ataque'} ${signed(m.atk)} corpo a corpo (${m.mainDamage || '—'})\nEspaço/Alcance: ${m.space}/${m.reach}\nAtaques Especiais: ${m.specialAttacks || '—'}\nQualidades Especiais: ${m.specialQualities || '—'}\nTestes de Resistência: Fort ${signed(m.fort)}, Ref ${signed(m.ref)}, Vont ${signed(m.will)}\nAtributos: For ${m.str}, Des ${m.dex}, Con ${m.con}, Int ${m.int}, Sab ${m.wis}, Car ${m.cha}\nPerícias: ${m.skills || '—'}\nTalentos: ${m.feats || '—'}\nAmbiente: ${m.environment || '—'}\nOrganização: ${m.organization || '—'}\nNível de Desafio: ${m.cr35}\nTesouro: ${m.treasure || '—'}\nAlinhamento: ${m.alignment || '—'}\nAvanço: ${m.advancement || '—'}\nAjuste de Nível: ${m.levelAdjustment || '—'}\n\n${m.abilityText || ''}\n`;
}

function downloadText(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function HelpTip({ text }) {
  return (
    <span className="help-wrap" tabIndex={0} aria-label={text}>
      <HelpCircle size={15} />
      <span className="help-popover">{text}</span>
    </span>
  );
}

function FieldLabel({ label, helpText }) {
  return (
    <span className="field-label">
      <span>{label}</span>
      {helpText && <HelpTip text={helpText} />}
    </span>
  );
}

function Field({ label, value, onChange, type = 'text', helpText }) {
  return (
    <label className="field-shell">
      <FieldLabel label={label} helpText={helpText} />
      <input className="input" type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} />
    </label>
  );
}

function SelectField({ label, value, onChange, options, helpText }) {
  return (
    <label className="field-shell">
      <FieldLabel label={label} helpText={helpText} />
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3, helpText }) {
  return (
    <label className="field-shell">
      <FieldLabel label={label} helpText={helpText} />
      <textarea className="input min-h-[88px] resize-y" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function FormSection({ title, description, children }) {
  return (
    <section className="form-section">
      <div className="mb-4">
        <h3 className="font-serif text-xl font-bold text-[#7d1f14]">{title}</h3>
        {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function StatLine({ label, children }) {
  return <p className="stat-line"><strong>{label}:</strong> <span>{children}</span></p>;
}

function StatBlock({ monster, innerRef }) {
  const conTotal = monster.hd * mod(monster.con);
  return (
    <article ref={innerRef} className="statblock w-full max-w-[760px] p-5 text-stone-950 shadow-parchment sm:p-7 md:p-8">
      <header className="min-w-0 border-b-4 border-[#7d1f14] pb-3">
        <h2 className="break-words font-serif text-3xl font-bold tracking-wide text-[#7d1f14] sm:text-4xl">{monster.displayName}</h2>
        <p className="break-words italic">{monster.sizePt} {monster.typePt}{monster.subtype ? ` (${monster.subtype})` : ''}{monster.alignment ? `, ${monster.alignment}` : ''}</p>
      </header>
      <section className="mt-4 grid gap-1.5 font-serif text-[14px] leading-snug sm:text-[15px]">
        <StatLine label="Dados de Vida">{monster.hd}d{monster.hdDie}{signed(conTotal)} ({monster.hp} PV)</StatLine>
        <StatLine label="Iniciativa">{signed(monster.initiative)}</StatLine>
        <StatLine label="Deslocamento">{monster.speed || '—'}</StatLine>
        <StatLine label="Classe de Armadura">{monster.ac} ({signed(mod(monster.dex))} Des, {signed(Number(monster.armorBonus || 0))} armadura, {signed(Number(monster.shieldBonus || 0))} escudo, {signed(Number(monster.naturalArmor || 0))} natural), toque {monster.touch}, surpreso {monster.flat}</StatLine>
        <StatLine label="Base de Ataque/Agarrar">{signed(monster.bab)}/{signed(monster.grapple)}</StatLine>
        <StatLine label="Ataque">{monster.mainAttack || 'Ataque'} {signed(monster.atk)} corpo a corpo ({monster.mainDamage || '—'})</StatLine>
        <StatLine label="Ataque Total">{monster.mainAttack || 'Ataque'} {signed(monster.atk)} corpo a corpo ({monster.mainDamage || '—'})</StatLine>
        <StatLine label="Espaço/Alcance">{monster.space}/{monster.reach}</StatLine>
        <StatLine label="Ataques Especiais">{monster.specialAttacks || '—'}</StatLine>
        <StatLine label="Qualidades Especiais">{monster.specialQualities || '—'}</StatLine>
        <StatLine label="Testes de Resistência">Fort {signed(monster.fort)}, Ref {signed(monster.ref)}, Vont {signed(monster.will)}</StatLine>
        <StatLine label="Atributos">For {monster.str}, Des {monster.dex}, Con {monster.con}, Int {monster.int}, Sab {monster.wis}, Car {monster.cha}</StatLine>
        <StatLine label="Perícias">{monster.skills || '—'}</StatLine>
        <StatLine label="Talentos">{monster.feats || '—'}</StatLine>
        <StatLine label="Ambiente">{monster.environment || '—'}</StatLine>
        <StatLine label="Organização">{monster.organization || '—'}</StatLine>
        <StatLine label="Nível de Desafio">{monster.cr35}</StatLine>
        <StatLine label="Tesouro">{monster.treasure || '—'}</StatLine>
        <StatLine label="Alinhamento">{monster.alignment || '—'}</StatLine>
        <StatLine label="Avanço">{monster.advancement || '—'}</StatLine>
        <StatLine label="Ajuste de Nível">{monster.levelAdjustment || '—'}</StatLine>
      </section>
      {monster.abilityText && <section className="mt-4 whitespace-pre-line break-words border-t-2 border-[#7d1f14]/40 pt-3 font-serif text-[14px] leading-snug sm:text-[15px]">{monster.abilityText}</section>}
    </article>
  );
}

function CalcCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-amber-200/15 bg-white/10 p-3">
      <p className="text-xs uppercase tracking-wide text-amber-200/80">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 text-xs text-stone-400">{note}</p>}
    </div>
  );
}

function App() {
  const [monster, setMonster] = useState(exampleMonster);
  const statRef = useRef(null);
  const converted = useMemo(() => build35(monster), [monster]);
  const set = (key, value) => setMonster((m) => ({ ...m, [key]: value }));

  async function downloadPng() {
    if (!statRef.current) return;
    const dataUrl = await toPng(statRef.current, {
      pixelRatio: 2,
      backgroundColor: '#f4ead6',
      cacheBust: true,
    });
    const safeName = converted.displayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'monstro';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${safeName}-3-5e.png`;
    a.click();
  }

  function clearFields() {
    setMonster(emptyMonster);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-950 bg-[radial-gradient(circle_at_top,#7c2d12_0,#1c1917_42%,#0c0a09_100%)] px-3 py-5 text-stone-100 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 rounded-3xl border border-amber-200/15 bg-white/10 p-5 shadow-2xl backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-sm font-bold text-stone-950"><Wand2 size={16} /> DNDMC</p>
              <h1 className="break-words font-serif text-3xl font-bold sm:text-5xl">Conversor 5E → 3.5E</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-300 sm:text-base">Reconstrução assistida de monstros com prévia editável, exportação em texto, JSON e imagem. Os números são ponto de partida para revisão do mestre.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button onClick={() => setMonster(exampleMonster)} className="btn-secondary"><Sparkles size={18} /> Exemplo</button>
              <button onClick={clearFields} className="btn-danger"><Trash2 size={18} /> Limpar</button>
              <button onClick={() => downloadText(`${converted.displayName}.txt`, makeTxt(converted))} className="btn"><FileText size={18} /> TXT</button>
              <button onClick={() => downloadText(`${converted.displayName}.json`, JSON.stringify(monster, null, 2), 'application/json')} className="btn"><FileJson size={18} /> JSON</button>
              <button onClick={downloadPng} className="btn col-span-2 sm:col-span-1"><ImageDown size={18} /> PNG</button>
            </div>
          </div>
        </header>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
          <aside className="min-w-0 rounded-3xl border border-amber-200/15 bg-stone-100 p-4 text-stone-950 shadow-2xl sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#7d1f14]">Entrada e ajustes</h2>
                <p className="mt-1 text-sm text-stone-600">Passe o mouse ou toque nos ícones de interrogação para ver o que preencher.</p>
              </div>
              <button onClick={clearFields} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"><RotateCcw size={16} /> Reset</button>
            </div>

            <div className="grid gap-5">
              <FormSection title="Identidade" description="Campos que definem como o monstro aparece no bloco final.">
                <Field label="Nome" value={monster.name} onChange={(v) => set('name', v)} helpText={help.name} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField label="Tamanho" value={monster.size} onChange={(v) => set('size', v)} options={Object.keys(sizeRules)} helpText={help.size} />
                  <SelectField label="Tipo 5E" value={monster.type} onChange={(v) => set('type', v)} options={Object.keys(typeRules)} helpText={help.type} />
                </div>
                <Field label="Subtipo 3.5" value={monster.subtype} onChange={(v) => set('subtype', v)} helpText={help.subtype} />
                <Field label="Alinhamento" value={monster.alignment} onChange={(v) => set('alignment', v)} helpText={help.alignment} />
              </FormSection>

              <FormSection title="Base 5E" description="Valores usados como referência para estimar a versão 3.5E.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="CA 5E" type="number" value={monster.ac5e} onChange={(v) => set('ac5e', v)} helpText={help.ac5e} />
                  <Field label="PV 5E" type="number" value={monster.hp5e} onChange={(v) => set('hp5e', v)} helpText={help.hp5e} />
                  <Field label="CR 5E" value={monster.cr5e} onChange={(v) => set('cr5e', v)} helpText={help.cr5e} />
                </div>
                <Field label="Deslocamento" value={monster.speed} onChange={(v) => set('speed', v)} helpText={help.speed} />
              </FormSection>

              <FormSection title="Atributos" description="Atributos base da criatura. Modificadores são calculados automaticamente.">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((key) => (
                    <Field key={key} label={key.toUpperCase()} type="number" value={monster[key]} onChange={(v) => set(key, v)} helpText={help[key]} />
                  ))}
                </div>
              </FormSection>

              <FormSection title="Defesa 3.5E" description="Separe a CA em armadura, escudo e armadura natural para evitar números confusos.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Armadura" type="number" value={monster.armorBonus} onChange={(v) => set('armorBonus', v)} helpText={help.armorBonus} />
                  <Field label="Escudo" type="number" value={monster.shieldBonus} onChange={(v) => set('shieldBonus', v)} helpText={help.shieldBonus} />
                  <Field label="Natural" type="number" value={monster.naturalArmor} onChange={(v) => set('naturalArmor', v)} helpText={help.naturalArmor} />
                </div>
              </FormSection>

              <FormSection title="Ataques e habilidades" description="Aqui entram as partes que mais exigem revisão manual do mestre.">
                <Field label="Ataque principal" value={monster.mainAttack} onChange={(v) => set('mainAttack', v)} helpText={help.mainAttack} />
                <Field label="Dano 3.5" value={monster.mainDamage} onChange={(v) => set('mainDamage', v)} helpText={help.mainDamage} />
                <TextArea label="Ataques especiais" value={monster.specialAttacks} onChange={(v) => set('specialAttacks', v)} helpText={help.specialAttacks} />
                <TextArea label="Qualidades especiais" value={monster.specialQualities} onChange={(v) => set('specialQualities', v)} helpText={help.specialQualities} />
                <TextArea label="Descrições das habilidades" rows={7} value={monster.abilityText} onChange={(v) => set('abilityText', v)} helpText={help.abilityText} />
              </FormSection>

              <FormSection title="Perícias, talentos e ecologia" description="Campos editoriais para completar o bloco no padrão 3.5E.">
                <TextArea label="Perícias" value={monster.skills} onChange={(v) => set('skills', v)} helpText={help.skills} />
                <TextArea label="Talentos" value={monster.feats} onChange={(v) => set('feats', v)} helpText={help.feats} />
                <Field label="Ambiente" value={monster.environment} onChange={(v) => set('environment', v)} helpText={help.environment} />
                <Field label="Organização" value={monster.organization} onChange={(v) => set('organization', v)} helpText={help.organization} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Tesouro" value={monster.treasure} onChange={(v) => set('treasure', v)} helpText={help.treasure} />
                  <Field label="Avanço" value={monster.advancement} onChange={(v) => set('advancement', v)} helpText={help.advancement} />
                  <Field label="Ajuste de nível" value={monster.levelAdjustment} onChange={(v) => set('levelAdjustment', v)} helpText={help.levelAdjustment} />
                </div>
              </FormSection>
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="rounded-3xl border border-amber-200/15 bg-white/10 p-4 backdrop-blur sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl font-bold">Prévia exportável</h2>
                  <p className="mt-1 text-sm text-stone-300">O bloco abaixo é a saída final. Ele foi ajustado para não estourar horizontalmente e para exportar melhor em PNG.</p>
                </div>
                <button onClick={() => navigator.clipboard.writeText(makeTxt(converted))} className="btn-secondary shrink-0"><Copy size={18} /> Copiar bloco</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CalcCard label="Tipo 3.5E" value={converted.typePt} note={`d${converted.hdDie}, BAB ${converted.typeRule.bab === 1 ? 'cheio' : converted.typeRule.bab === 0.75 ? '3/4' : '1/2'}`} />
                <CalcCard label="HD estimado" value={`${converted.hd}d${converted.hdDie}`} note={`${converted.hp} PV médios`} />
                <CalcCard label="CA 3.5E" value={converted.ac} note={`toque ${converted.touch}, surpreso ${converted.flat}`} />
                <CalcCard label="CR sugerido" value={converted.cr35} note="revise por comparação" />
              </div>
            </div>

            <div className="preview-wrap">
              <StatBlock monster={converted} innerRef={statRef} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
