import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Download, FileJson, FileText, ImageDown, Wand2 } from 'lucide-react';
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

const initialMonster = {
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

function mod(score) {
  return Math.floor((Number(score || 10) - 10) / 2);
}

function signed(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

function parseCr(cr) {
  if (String(cr).includes('/')) {
    const [a, b] = String(cr).split('/').map(Number);
    return a / b;
  }
  return Number(cr) || 1;
}

function estimateHd(monster, rule) {
  const targetHp = Number(monster.hp5e) || 8;
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
  return cr % 1 === 0 ? String(cr) : String(monster.cr5e);
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
  const ac = 10 + dexMod + size.ac + Number(monster.naturalArmor || 0) + Number(monster.armorBonus || 0) + Number(monster.shieldBonus || 0);
  const touch = 10 + dexMod + size.ac;
  const flat = ac - dexMod;
  const grapple = bab + strMod + size.grapple;
  const atk = bab + strMod + size.atk;
  const good = Math.floor(2 + hd / 2);
  const poor = Math.floor(hd / 3);
  const fort = (type.saves.includes('Fort') ? good : poor) + mod(monster.con);
  const ref = (type.saves.includes('Ref') ? good : poor) + dexMod;
  const will = (type.saves.includes('Will') ? good : poor) + wisMod;

  return {
    ...monster,
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
  };
}

function makeTxt(m) {
  return `${m.name.toUpperCase()}\n${m.sizePt} ${m.typePt}${m.subtype ? ` (${m.subtype})` : ''}\nDados de Vida: ${m.hd}d${m.hdDie}${m.hd * mod(m.con) >= 0 ? '+' : ''}${m.hd * mod(m.con)} (${m.hp} PV)\nIniciativa: ${signed(m.initiative)}\nDeslocamento: ${m.speed}\nClasse de Armadura: ${m.ac} (${signed(mod(m.dex))} Des, ${signed(Number(m.armorBonus || 0))} armadura, ${signed(Number(m.naturalArmor || 0))} natural), toque ${m.touch}, surpreso ${m.flat}\nBase de Ataque/Agarrar: ${signed(m.bab)}/${signed(m.grapple)}\nAtaque: ${m.mainAttack} ${signed(m.atk)} corpo a corpo (${m.mainDamage})\nAtaque Total: ${m.mainAttack} ${signed(m.atk)} corpo a corpo (${m.mainDamage})\nEspaço/Alcance: ${m.space}/${m.reach}\nAtaques Especiais: ${m.specialAttacks || '—'}\nQualidades Especiais: ${m.specialQualities || '—'}\nTestes de Resistência: Fort ${signed(m.fort)}, Ref ${signed(m.ref)}, Vont ${signed(m.will)}\nAtributos: For ${m.str}, Des ${m.dex}, Con ${m.con}, Int ${m.int}, Sab ${m.wis}, Car ${m.cha}\nPerícias: ${m.skills || '—'}\nTalentos: ${m.feats || '—'}\nAmbiente: ${m.environment || '—'}\nOrganização: ${m.organization || '—'}\nNível de Desafio: ${m.cr35}\nTesouro: ${m.treasure || '—'}\nAlinhamento: ${m.alignment || '—'}\nAvanço: ${m.advancement || '—'}\nAjuste de Nível: ${m.levelAdjustment || '—'}\n\n${m.abilityText || ''}\n`;
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

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-stone-700">{label}</span>
      <input className="rounded-xl border border-stone-300 bg-white/80 px-3 py-2 outline-none ring-amber-700/20 transition focus:ring-4" type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-stone-700">{label}</span>
      <textarea className="rounded-xl border border-stone-300 bg-white/80 px-3 py-2 outline-none ring-amber-700/20 transition focus:ring-4" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function StatLine({ label, children }) {
  return <p><strong>{label}:</strong> {children}</p>;
}

function StatBlock({ monster, innerRef }) {
  return (
    <article ref={innerRef} className="statblock mx-auto max-w-3xl bg-[#f4ead6] p-8 text-stone-950 shadow-parchment">
      <header className="border-b-4 border-[#7d1f14] pb-2">
        <h2 className="font-serif text-4xl font-bold tracking-wide text-[#7d1f14]">{monster.name}</h2>
        <p className="italic">{monster.sizePt} {monster.typePt}{monster.subtype ? ` (${monster.subtype})` : ''}, {monster.alignment}</p>
      </header>
      <section className="mt-3 grid gap-1 font-serif text-[15px] leading-snug">
        <StatLine label="Dados de Vida">{monster.hd}d{monster.hdDie}{signed(monster.hd * mod(monster.con))} ({monster.hp} PV)</StatLine>
        <StatLine label="Iniciativa">{signed(monster.initiative)}</StatLine>
        <StatLine label="Deslocamento">{monster.speed}</StatLine>
        <StatLine label="Classe de Armadura">{monster.ac} ({signed(mod(monster.dex))} Des, {signed(Number(monster.armorBonus || 0))} armadura, {signed(Number(monster.naturalArmor || 0))} natural), toque {monster.touch}, surpreso {monster.flat}</StatLine>
        <StatLine label="Base de Ataque/Agarrar">{signed(monster.bab)}/{signed(monster.grapple)}</StatLine>
        <StatLine label="Ataque">{monster.mainAttack} {signed(monster.atk)} corpo a corpo ({monster.mainDamage})</StatLine>
        <StatLine label="Ataque Total">{monster.mainAttack} {signed(monster.atk)} corpo a corpo ({monster.mainDamage})</StatLine>
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
      {monster.abilityText && <section className="mt-4 whitespace-pre-line border-t-2 border-[#7d1f14]/40 pt-3 font-serif text-[15px] leading-snug">{monster.abilityText}</section>}
    </article>
  );
}

function App() {
  const [monster, setMonster] = useState(initialMonster);
  const statRef = useRef(null);
  const converted = useMemo(() => build35(monster), [monster]);
  const set = (key, value) => setMonster((m) => ({ ...m, [key]: value }));

  async function downloadPng() {
    if (!statRef.current) return;
    const dataUrl = await toPng(statRef.current, { pixelRatio: 2, backgroundColor: '#f4ead6' });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${converted.name.toLowerCase().replaceAll(' ', '-')}-3-5e.png`;
    a.click();
  }

  return (
    <main className="min-h-screen bg-stone-950 bg-[radial-gradient(circle_at_top,#7c2d12_0,#1c1917_42%,#0c0a09_100%)] px-4 py-8 text-stone-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-amber-200/15 bg-white/10 p-6 shadow-2xl backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-sm font-bold text-stone-950"><Wand2 size={16} /> DNDMC</p>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Conversor 5E → 3.5E</h1>
            <p className="mt-2 max-w-2xl text-stone-300">MVP estático para reconstruir monstros da 5E em bloco de estatística compatível com D&D 3.5.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadText(`${converted.name}.txt`, makeTxt(converted))} className="btn"><FileText size={18} /> TXT</button>
            <button onClick={() => downloadText(`${converted.name}.json`, JSON.stringify(monster, null, 2), 'application/json')} className="btn"><FileJson size={18} /> JSON</button>
            <button onClick={downloadPng} className="btn"><ImageDown size={18} /> PNG</button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-amber-200/15 bg-stone-100 p-5 text-stone-950 shadow-2xl">
            <h2 className="mb-4 font-serif text-2xl font-bold text-[#7d1f14]">Entrada 5E e ajustes 3.5E</h2>
            <div className="grid gap-3">
              <Field label="Nome" value={monster.name} onChange={(v) => set('name', v)} />
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm"><span className="font-semibold text-stone-700">Tamanho</span><select className="select" value={monster.size} onChange={(e) => set('size', e.target.value)}>{Object.keys(sizeRules).map(k => <option key={k}>{k}</option>)}</select></label>
                <label className="grid gap-1 text-sm"><span className="font-semibold text-stone-700">Tipo 5E</span><select className="select" value={monster.type} onChange={(e) => set('type', e.target.value)}>{Object.keys(typeRules).map(k => <option key={k}>{k}</option>)}</select></label>
              </div>
              <Field label="Subtipo 3.5" value={monster.subtype} onChange={(v) => set('subtype', v)} />
              <Field label="Alinhamento" value={monster.alignment} onChange={(v) => set('alignment', v)} />
              <div className="grid grid-cols-3 gap-3"><Field label="CA 5E" type="number" value={monster.ac5e} onChange={(v) => set('ac5e', v)} /><Field label="PV 5E" type="number" value={monster.hp5e} onChange={(v) => set('hp5e', v)} /><Field label="CR 5E" value={monster.cr5e} onChange={(v) => set('cr5e', v)} /></div>
              <Field label="Deslocamento" value={monster.speed} onChange={(v) => set('speed', v)} />
              <div className="grid grid-cols-3 gap-3">{['str','dex','con','int','wis','cha'].map(k => <Field key={k} label={k.toUpperCase()} type="number" value={monster[k]} onChange={(v) => set(k, v)} />)}</div>
              <div className="grid grid-cols-3 gap-3"><Field label="Armadura" type="number" value={monster.armorBonus} onChange={(v) => set('armorBonus', v)} /><Field label="Escudo" type="number" value={monster.shieldBonus} onChange={(v) => set('shieldBonus', v)} /><Field label="Armadura Natural" type="number" value={monster.naturalArmor} onChange={(v) => set('naturalArmor', v)} /></div>
              <Field label="Ataque principal" value={monster.mainAttack} onChange={(v) => set('mainAttack', v)} />
              <Field label="Dano 3.5 sugerido" value={monster.mainDamage} onChange={(v) => set('mainDamage', v)} />
              <TextArea label="Ataques especiais" value={monster.specialAttacks} onChange={(v) => set('specialAttacks', v)} />
              <TextArea label="Qualidades especiais" value={monster.specialQualities} onChange={(v) => set('specialQualities', v)} />
              <TextArea label="Perícias" value={monster.skills} onChange={(v) => set('skills', v)} />
              <TextArea label="Talentos" value={monster.feats} onChange={(v) => set('feats', v)} />
              <Field label="Ambiente" value={monster.environment} onChange={(v) => set('environment', v)} />
              <Field label="Organização" value={monster.organization} onChange={(v) => set('organization', v)} />
              <Field label="Tesouro" value={monster.treasure} onChange={(v) => set('treasure', v)} />
              <Field label="Avanço" value={monster.advancement} onChange={(v) => set('advancement', v)} />
              <Field label="Ajuste de Nível" value={monster.levelAdjustment} onChange={(v) => set('levelAdjustment', v)} />
              <TextArea label="Descrições de habilidades" rows={8} value={monster.abilityText} onChange={(v) => set('abilityText', v)} />
            </div>
          </section>

          <section className="grid gap-4">
            <div className="rounded-3xl border border-amber-200/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold">Prévia exportável</h2>
                  <p className="text-sm text-stone-300">HD, BAB, agarrar, CA e saves são recalculados pelo motor local.</p>
                </div>
                <button onClick={() => navigator.clipboard.writeText(makeTxt(converted))} className="btn"><Download size={18} /> Copiar bloco</button>
              </div>
            </div>
            <StatBlock monster={converted} innerRef={statRef} />
          </section>
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
