/* ACC/ISA — single-accumulator addressing quiz
 * Sections: Engine · Question bank · 3D stage · Controller */
(() => {
  'use strict';

  /* ── Engine ─────────────────────────────────────────────── */

  const MASK = 0xFFFF;
  const ADDR = 0x0FFF;
  const OPS = ['AND', 'ADD', 'LDA', 'STA', 'BUN', 'BSA', 'ISZ'];

  const parse = (s) => parseInt(s, 16) & MASK;
  const hex = (n, w = 4) => (n >>> 0).toString(16).toUpperCase().padStart(w, '0').slice(-w);

  /* Word layout: [I:1][op:3][address:12]. I = 1 → indirect (EA = low 12 bits of M[address]).
   * The PC given in each question already points at the next instruction. */
  function execute(q) {
    const base = parse(q.b);
    const mem = q.m.map(parse);
    const word = parse(q.i);
    const indirect = (word & 0x8000) !== 0;
    const op = (word >> 12) & 7;
    const operand = word & ADDR;
    const ptr = indirect ? operand : null;
    const ea = indirect ? mem[operand - base] & ADDR : operand;
    const slot = ea - base;
    const ac0 = parse(q.a);
    const e0 = q.e === '1' ? 1 : 0;
    const pc0 = parse(q.p) & ADDR;
    const m0 = mem[slot];
    let ac = ac0;
    let e = e0;
    let pc = pc0;
    let m = m0;

    switch (op) {
      case 0: ac = ac0 & m0; break;
      case 1: { const sum = ac0 + m0; ac = sum & MASK; e = sum > MASK ? 1 : 0; break; }
      case 2: ac = m0; break;
      case 3: m = ac0; break;
      case 4: pc = ea; break;
      case 5: m = pc0; pc = (ea + 1) & ADDR; break;
      default: m = (m0 + 1) & MASK; if (m === 0) pc = (pc0 + 1) & ADDR; // ISZ
    }

    return {
      base, mem, word, indirect, op, name: OPS[op], operand, ptr, ea, slot,
      ac0, e0, pc0, m0, ac, e, pc, m,
    };
  }

  function explain(r) {
    const route = r.indirect
      ? `M[${hex(r.ptr)}] = ${hex(r.mem[r.ptr - r.base])} → EA ${hex(r.ea)}`
      : `EA ${hex(r.ea)}`;
    const A = hex(r.ac0);
    const M = hex(r.m0);
    const at = `M[${hex(r.ea)}]`;
    const effect = [
      `AC ← ${A} AND ${M} = ${hex(r.ac)}`,
      `AC ← ${A} + ${M} = ${hex(r.ac)}, E ← ${r.e}`,
      `AC ← ${at} = ${M}`,
      `${at} ← AC = ${A}`,
      `PC ← EA = ${hex(r.pc)}`,
      `${at} ← PC = ${hex(r.pc0)}, PC ← EA + 1 = ${hex(r.pc)}`,
      `${at} ← ${M} + 1 = ${hex(r.m)}, ${r.m === 0 ? `zero → PC ← ${hex(r.pc0)} + 1 = ${hex(r.pc)}` : 'not zero → no skip'}`,
    ][r.op];
    return { head: `${r.name} · ${r.indirect ? 'indirect' : 'direct'}`, route, effect };
  }

  /* ── Question bank ──────────────────────────────────────── */
  /* l: level · b: first address of the memory window · i: instruction word
   * a: AC before · e: E before · p: PC before · m: memory window contents (b, b+1, …)
   * Answers are derived from these fields by execute(). */

  const BANK = [
    // Level 1
    { l: 1, b: "00B9", i: "10BE", a: "00B0", e: "0", p: "0922", m: ["0052", "0034", "00FF", "001B", "0077", "0094"] },
    { l: 1, b: "0055", i: "305A", a: "006C", e: "0", p: "01F4", m: ["0008", "0085", "0097", "00AF", "0040", "0065"] },
    { l: 1, b: "0358", i: "335A", a: "0098", e: "0", p: "000F", m: ["00F4", "006C", "005D", "006C", "00A8", "00A5"] },
    { l: 1, b: "0D78", i: "3D7C", a: "0041", e: "0", p: "0AAC", m: ["0076", "0058", "00E0", "00F9", "0093", "00FD"] },
    { l: 1, b: "01EA", i: "31EB", a: "0063", e: "0", p: "0CC1", m: ["0093", "00FB", "001E", "005A", "00B7", "00F3"] },
    { l: 1, b: "0048", i: "304B", a: "0029", e: "0", p: "0D17", m: ["00ED", "002D", "0021", "00B0", "007A", "00A2"] },
    { l: 1, b: "0630", i: "1635", a: "00AE", e: "0", p: "013C", m: ["00FF", "000D", "003F", "0007", "0056", "0057"] },
    { l: 1, b: "0220", i: "1223", a: "0015", e: "0", p: "07F1", m: ["0052", "006D", "0064", "0093", "0052", "007A"] },
    { l: 1, b: "01CA", i: "21CF", a: "00E6", e: "0", p: "0D34", m: ["0050", "0054", "003E", "0046", "00F0", "0026"] },
    { l: 1, b: "0618", i: "161D", a: "0027", e: "0", p: "0FD7", m: ["001A", "001E", "0033", "00E9", "0097", "0073"] },
    { l: 1, b: "0888", i: "288B", a: "00F4", e: "0", p: "0B77", m: ["0016", "0093", "0041", "00C4", "0086", "00BA"] },
    { l: 1, b: "0A08", i: "2A08", a: "00D5", e: "0", p: "077C", m: ["00DF", "0096", "00F9", "0083", "0019", "006E"] },
    // Level 2
    { l: 2, b: "0120", i: "5120", a: "000F", e: "0", p: "0110", m: ["2230", "E321", "0000", "0000", "0000", "0000"] },
    { l: 2, b: "08E4", i: "68E5", a: "0A5E", e: "0", p: "0DD4", m: ["0601", "0613", "070A", "04E7", "0D11", "015E"] },
    { l: 2, b: "0410", i: "3415", a: "09AD", e: "0", p: "007A", m: ["0406", "093A", "0E1E", "0BA6", "082F", "0273"] },
    { l: 2, b: "0248", i: "024B", a: "0140", e: "0", p: "09CE", m: ["0B56", "051A", "0173", "0E71", "0E04", "0C41"] },
    { l: 2, b: "0F84", i: "6F89", a: "0FBE", e: "0", p: "02C2", m: ["0C62", "0BB7", "0AC2", "0596", "0792", "0276"] },
    { l: 2, b: "033F", i: "5343", a: "03B8", e: "0", p: "0AB9", m: ["04EF", "0814", "03D5", "0B23", "01F5", "0243"] },
    { l: 2, b: "0478", i: "247B", a: "0600", e: "0", p: "00F8", m: ["044F", "0DAB", "0C25", "05B4", "0243", "0997"] },
    { l: 2, b: "0BA0", i: "1BA0", a: "0CCD", e: "0", p: "0991", m: ["096D", "0869", "0F03", "054E", "0AA6", "0458"] },
    { l: 2, b: "0C03", i: "4C05", a: "009F", e: "0", p: "0D50", m: ["07C1", "0640", "0309", "0137", "0176", "0B67"] },
    { l: 2, b: "0EC0", i: "2EC4", a: "0AF3", e: "0", p: "0BF1", m: ["03C4", "0EFE", "041A", "0726", "0FE7", "0FC5"] },
    { l: 2, b: "0378", i: "537A", a: "0E10", e: "0", p: "0D89", m: ["0DCB", "0A3C", "0FE2", "08AC", "0CE9", "0D75"] },
    { l: 2, b: "0389", i: "038D", a: "00F1", e: "0", p: "0DAE", m: ["0B19", "0EE9", "05DF", "08A8", "0566", "09CB"] },
    { l: 2, b: "050A", i: "250A", a: "0A11", e: "0", p: "027E", m: ["08CE", "0693", "0B86", "0BA1", "094A", "0D82"] },
    { l: 2, b: "0D98", i: "0D99", a: "0CF6", e: "0", p: "0CCD", m: ["0844", "001C", "0410", "0810", "0589", "07FA"] },
    { l: 2, b: "09A8", i: "39AC", a: "02EF", e: "0", p: "0C02", m: ["0BC8", "07B3", "0039", "0670", "0876", "08A1"] },
    { l: 2, b: "0841", i: "1845", a: "0DE8", e: "0", p: "0715", m: ["0438", "0160", "0780", "036B", "00EB", "0E23"] },
    { l: 2, b: "0CF0", i: "4CF2", a: "0B47", e: "0", p: "0D4A", m: ["0122", "073F", "0CA1", "0E06", "0BA8", "0AE4"] },
    { l: 2, b: "0798", i: "2799", a: "0ED6", e: "0", p: "0AAF", m: ["09B7", "0281", "0CA2", "0DA5", "092D", "0F33"] },
    // Level 3
    { l: 3, b: "0E5C", i: "DE61", a: "63E0", e: "1", p: "0667", m: ["0E60", "1E78", "0E5C", "0E5C", "833F", "0E5D"] },
    { l: 3, b: "0AE9", i: "AAEC", a: "CD2E", e: "1", p: "0B00", m: ["7CB5", "0CED", "0AEA", "0AEE", "EBA6", "0AE9"] },
    { l: 3, b: "0AC9", i: "3ACE", a: "95F0", e: "0", p: "0625", m: ["760A", "21CC", "7B37", "4EE6", "5D91", "0AC9"] },
    { l: 3, b: "0F1E", i: "3F21", a: "88D9", e: "1", p: "055E", m: ["2802", "BAC2", "F1DB", "0F1F", "0F1F", "D9FE"] },
    { l: 3, b: "0238", i: "8238", a: "B610", e: "0", p: "0F7D", m: ["0239", "023B", "023D", "080A", "E251", "A272"] },
    { l: 3, b: "0C30", i: "CC33", a: "9C5C", e: "1", p: "055A", m: ["0C34", "FAA8", "0C34", "0C32", "4F4C", "40EE"] },
    { l: 3, b: "06E0", i: "B6E5", a: "13E9", e: "0", p: "038E", m: ["245E", "700C", "1AC3", "5304", "977D", "06E4"] },
    { l: 3, b: "0810", i: "8811", a: "809E", e: "1", p: "05D8", m: ["C59A", "0815", "E4D3", "DD93", "42AA", "0812"] },
    { l: 3, b: "0D90", i: "0D90", a: "90B8", e: "0", p: "0966", m: ["0D93", "80BF", "C223", "4FCC", "74B7", "A403"] },
    { l: 3, b: "0B08", i: "EB0A", a: "BD5A", e: "0", p: "01E7", m: ["0B0C", "C585", "0B0C", "F406", "63EA", "0B0C"] },
    { l: 3, b: "08E8", i: "88EC", a: "5EE5", e: "0", p: "0EB2", m: ["55AB", "D53C", "08E8", "A9BB", "08EA", "08E8"] },
    { l: 3, b: "0CDB", i: "1CDC", a: "91D5", e: "1", p: "0777", m: ["0CDE", "0CDB", "4213", "4624", "AE42", "F572"] },
    { l: 3, b: "09BF", i: "69C3", a: "12E7", e: "1", p: "0B0B", m: ["1570", "0A04", "EA12", "4CD3", "6177", "99C1"] },
    { l: 3, b: "00A4", i: "C0A5", a: "B671", e: "0", p: "00F9", m: ["00A6", "00A4", "63FE", "F9A4", "00A4", "4BC6"] },
    { l: 3, b: "0F00", i: "DF01", a: "4773", e: "1", p: "03CC", m: ["A7D7", "0F03", "0F04", "0F01", "0F01", "0F04"] },
    { l: 3, b: "078E", i: "678F", a: "E947", e: "0", p: "0AD8", m: ["6D28", "0791", "2BB9", "D808", "FAE3", "4381"] },
    { l: 3, b: "0393", i: "A395", a: "DF5A", e: "1", p: "040B", m: ["F9AE", "0398", "0394", "2A31", "3050", "3DCD"] },
    { l: 3, b: "09A0", i: "19A4", a: "0C1B", e: "0", p: "08A3", m: ["09A4", "710B", "3717", "8E78", "04DD", "7B53"] },
    { l: 3, b: "04DC", i: "04DE", a: "A61B", e: "1", p: "0360", m: ["D042", "04E1", "04DC", "DB2C", "1237", "04E0"] },
    { l: 3, b: "07B3", i: "97B6", a: "26CB", e: "1", p: "01BC", m: ["FF5B", "07B6", "07B7", "07B8", "07B5", "07B4"] },
    { l: 3, b: "095E", i: "B95E", a: "6D56", e: "0", p: "0D9F", m: ["0961", "B1FB", "2CE7", "095F", "0963", "EF18"] },
    { l: 3, b: "08D8", i: "B8D9", a: "6DD4", e: "1", p: "0AE2", m: ["638F", "08DB", "43D1", "08DD", "4EA3", "4827"] },
    // Level 4
    { l: 4, b: "0B28", i: "6B28", a: "9701", e: "0", p: "09D1", m: ["0B2D", "9D75", "4B31", "BB61", "4D6C", "488A"] },
    { l: 4, b: "01F0", i: "91F3", a: "FE88", e: "0", p: "0139", m: ["01F5", "01F0", "8E79", "01F1", "44E8", "DEC7"] },
    { l: 4, b: "0230", i: "4234", a: "6F28", e: "1", p: "05DA", m: ["9AB3", "0235", "B7DE", "6802", "293F", "4DEF"] },
    { l: 4, b: "0D42", i: "1D43", a: "0458", e: "0", p: "0A1D", m: ["04E7", "0112", "EED2", "26FB", "0D42", "EE48"] },
    { l: 4, b: "0580", i: "A582", a: "5D63", e: "1", p: "0459", m: ["EBB0", "36ED", "0580", "6E6B", "0585", "6D9C"] },
    { l: 4, b: "07FC", i: "97FC", a: "FC66", e: "1", p: "08F8", m: ["07FD", "07FF", "CCEF", "CB2D", "E006", "0800"] },
    { l: 4, b: "02A0", i: "D2A2", a: "D48C", e: "0", p: "0514", m: ["1062", "02A5", "02A1", "C10A", "EC7E", "7277"] },
    { l: 4, b: "0A80", i: "3A83", a: "3398", e: "0", p: "0EE9", m: ["0A81", "EFEA", "D7B5", "0A84", "0A81", "93A9"] },
    { l: 4, b: "0B18", i: "CB1D", a: "DBCF", e: "0", p: "0C62", m: ["0B1C", "0B1C", "9A82", "0B1A", "0B19", "0B19"] },
    { l: 4, b: "0218", i: "521C", a: "E54E", e: "1", p: "043A", m: ["C5AA", "021B", "8D40", "7BA2", "021A", "021B"] },
    { l: 4, b: "0013", i: "C018", a: "E1E2", e: "1", p: "0CC3", m: ["0014", "0016", "E81B", "C15D", "63C5", "0017"] },
    { l: 4, b: "038D", i: "0391", a: "2A24", e: "1", p: "09E0", m: ["24AA", "94B4", "02D6", "0392", "7E5E", "038D"] },
    { l: 4, b: "026F", i: "C274", a: "DCF0", e: "0", p: "0EAD", m: ["0274", "0272", "0274", "0273", "51AB", "026F"] },
    { l: 4, b: "0A88", i: "9A8D", a: "F90B", e: "1", p: "0028", m: ["0A8B", "4D61", "0A88", "C15A", "65AC", "0A88"] },
    { l: 4, b: "0EE0", i: "4EE4", a: "12D8", e: "1", p: "08B2", m: ["A291", "4504", "0EE5", "0EE2", "0EE3", "380A"] },
    { l: 4, b: "05E8", i: "55EA", a: "4E3D", e: "1", p: "0CDC", m: ["3A33", "05EA", "B958", "05EC", "71F7", "1C3A"] },
    { l: 4, b: "03A8", i: "83AA", a: "D5A1", e: "0", p: "0DED", m: ["FC68", "3EEC", "03AD", "03A8", "98B6", "03AA"] },
    { l: 4, b: "03DF", i: "B3E4", a: "237E", e: "0", p: "0563", m: ["326F", "9468", "03E3", "8649", "C064", "03E1"] },
    { l: 4, b: "01D0", i: "B1D5", a: "7607", e: "0", p: "0BEB", m: ["08A6", "B686", "03E6", "995D", "DDFE", "01D1"] },
    { l: 4, b: "0248", i: "D24D", a: "B984", e: "1", p: "0D92", m: ["F535", "0248", "024B", "024C", "DAB7", "024A"] },
    { l: 4, b: "0E53", i: "5E54", a: "BF66", e: "1", p: "0089", m: ["0E58", "0E56", "8478", "6E8B", "B096", "FEEF"] },
    { l: 4, b: "03F3", i: "93F7", a: "FDE9", e: "1", p: "07F6", m: ["C7AF", "C55E", "481C", "03F3", "03F6", "1AB7"] },
    { l: 4, b: "0267", i: "D26A", a: "6479", e: "1", p: "0E43", m: ["6CA7", "026A", "026B", "026B", "026A", "018B"] },
    { l: 4, b: "0048", i: "D04C", a: "EE4B", e: "1", p: "0917", m: ["004D", "004A", "18DA", "004A", "004D", "0048"] },
    // Level 5
    { l: 5, b: "08C7", i: "08CE", a: "F043", e: "0", p: "0783", m: ["652A", "98F6", "08CD", "FD3E", "97E4", "08CA", "B29E", "08CC"] },
    { l: 5, b: "0D08", i: "8D0C", a: "7F1E", e: "1", p: "078A", m: ["BBA3", "0D0D", "0D08", "EA6F", "0D0E", "E022", "0D0D", "0D09"] },
    { l: 5, b: "04BF", i: "64C1", a: "BB48", e: "1", p: "0794", m: ["04C2", "31F5", "04C4", "827E", "2C72", "6CF0", "8AA8", "04C2"] },
    { l: 5, b: "0610", i: "E615", a: "6236", e: "1", p: "08A1", m: ["FC3C", "FFFF", "6728", "DEB9", "8A74", "0611", "0613", "C518"] },
    { l: 5, b: "0CD0", i: "3CD7", a: "5430", e: "0", p: "0427", m: ["A4E7", "0CD6", "FCAC", "0CD2", "5A48", "D1FF", "F4F1", "0CD5"] },
    { l: 5, b: "0821", i: "D822", a: "9EDC", e: "0", p: "09EE", m: ["0822", "0823", "70C6", "A11E", "F69D", "0823", "0825", "05AF"] },
    { l: 5, b: "086A", i: "A86C", a: "AA3B", e: "0", p: "03A0", m: ["086B", "FFC1", "086F", "3BEB", "2AF0", "086C", "78FA", "0870"] },
    { l: 5, b: "0E00", i: "8E05", a: "3882", e: "0", p: "089B", m: ["CCCC", "BC00", "E5B2", "0E04", "188E", "0E06", "CA79", "0E04"] },
    { l: 5, b: "0FE0", i: "3FE1", a: "A2B3", e: "1", p: "070C", m: ["BC3B", "12F7", "28C6", "A697", "9A66", "9541", "4F1E", "C391"] },
    { l: 5, b: "04E0", i: "84E7", a: "048F", e: "1", p: "0E21", m: ["420D", "CD5C", "04E1", "37D9", "37FA", "04E6", "53CF", "04E5"] },
    { l: 5, b: "0129", i: "412E", a: "111A", e: "0", p: "0343", m: ["012C", "012F", "9370", "641C", "6DA7", "0129", "012B", "012E"] },
    { l: 5, b: "0228", i: "A22C", a: "35BB", e: "1", p: "07EC", m: ["CDB5", "2CBE", "022F", "E780", "022D", "022F", "E1BF", "0229"] },
    { l: 5, b: "01BD", i: "21C1", a: "2DE0", e: "1", p: "0B9F", m: ["01BF", "01C2", "54D0", "48C4", "01C4", "43BA", "560F", "01C2"] },
    { l: 5, b: "0878", i: "E878", a: "BA18", e: "0", p: "0876", m: ["0879", "8729", "28A5", "087A", "0595", "2BC1", "3DD6", "138E"] },
    { l: 5, b: "0781", i: "0787", a: "5F78", e: "0", p: "018C", m: ["E133", "4ADB", "0782", "0782", "0D44", "F555", "0788", "8ECB"] },
    { l: 5, b: "0BD2", i: "0BD6", a: "F55D", e: "0", p: "07BD", m: ["0BD8", "C68C", "F0DC", "0BD8", "0BD5", "40B9", "B468", "540C"] },
    { l: 5, b: "0938", i: "493D", a: "730B", e: "0", p: "0D7F", m: ["F6F2", "093F", "7318", "093E", "093B", "510A", "175B", "7428"] },
    { l: 5, b: "0AA8", i: "EAAA", a: "AB86", e: "1", p: "0A49", m: ["3C11", "0AAE", "0AAC", "0AAF", "FFFF", "757E", "0C00", "3F55"] },
    { l: 5, b: "00B9", i: "80BD", a: "AA97", e: "1", p: "0C3B", m: ["00C0", "00C0", "00B9", "00BD", "00BE", "00BA", "00BA", "00BF"] },
    { l: 5, b: "0ED5", i: "DED8", a: "55A7", e: "0", p: "0277", m: ["0EDB", "BDBA", "FB1C", "0ED5", "A09B", "E58D", "FA01", "ABC6"] },
    { l: 5, b: "01FA", i: "41FE", a: "A346", e: "1", p: "0F50", m: ["01FC", "3CD3", "01FE", "01FE", "01FF", "5053", "63E3", "3692"] },
    { l: 5, b: "0E42", i: "6E47", a: "D97F", e: "1", p: "0A21", m: ["D375", "B809", "C781", "D878", "0E45", "FFFF", "7D7D", "0E43"] },
    { l: 5, b: "0D98", i: "0D9C", a: "F267", e: "0", p: "0B40", m: ["BEA8", "0D9E", "7B24", "0D9D", "0D9A", "8AC2", "0D99", "588C"] },
    { l: 5, b: "08C0", i: "A8C4", a: "DF29", e: "1", p: "0546", m: ["096C", "31A5", "54F3", "0CED", "08C7", "B9FC", "08C0", "08C0"] },
    // Level 6
    { l: 6, b: "09FE", i: "DA02", a: "5A54", e: "0", p: "08FB", m: ["0A01", "FDC4", "FF51", "0F0F", "4A02", "0A05", "09FE", "F0F0"] },
    { l: 6, b: "0A98", i: "CA9F", a: "9D8E", e: "0", p: "09DE", m: ["0A9E", "F389", "2CD1", "5615", "BEEF", "5BE6", "0A99", "0A98"] },
    { l: 6, b: "05D1", i: "D5D5", a: "8606", e: "1", p: "0D03", m: ["1F7A", "16D2", "B07E", "5F53", "05D8", "05D5", "352E", "366C"] },
    { l: 6, b: "02FC", i: "D2FF", a: "9C9A", e: "0", p: "0E7E", m: ["A260", "FF00", "8DF0", "B302", "0303", "314B", "0300", "9AD5"] },
    { l: 6, b: "0BA0", i: "0BA1", a: "D8EE", e: "1", p: "0402", m: ["0F0F", "0BA7", "0001", "1544", "0BA3", "169D", "0BA3", "0BA4"] },
    { l: 6, b: "0F38", i: "0F38", a: "5555", e: "1", p: "067A", m: ["0F39", "C1C5", "0F39", "F0F0", "FFFF", "0F3B", "A43B", "8FE4"] },
    { l: 6, b: "0D50", i: "AD56", a: "0F0F", e: "1", p: "0ED0", m: ["9D8F", "3D74", "FF00", "0D56", "A831", "C6F9", "0D56", "0D50"] },
    { l: 6, b: "0156", i: "0157", a: "1CD4", e: "0", p: "0D17", m: ["015A", "0156", "015A", "F080", "73B3", "8DBA", "015D", "E2BE"] },
    { l: 6, b: "05B8", i: "D5BF", a: "64B8", e: "1", p: "03A8", m: ["05BD", "5ECC", "C620", "8F61", "05BA", "7788", "F0F0", "E5BC"] },
    { l: 6, b: "0E18", i: "AE1E", a: "5097", e: "1", p: "08B9", m: ["DFDE", "D7A9", "AAAA", "0E1F", "0E1A", "0E1C", "2E1F", "0E19"] },
    { l: 6, b: "0B5D", i: "0B63", a: "D3D2", e: "1", p: "0DCF", m: ["CF09", "C998", "0B61", "465C", "5555", "C0DE", "0B5F", "0B73"] },
    { l: 6, b: "0260", i: "9264", a: "97FC", e: "0", p: "0C89", m: ["CFAF", "FFFF", "818E", "0F0F", "D261", "0266", "7972", "FCCE"] },
    { l: 6, b: "02F8", i: "D2FF", a: "8000", e: "1", p: "0206", m: ["02FF", "C7F8", "02F9", "C0DE", "A81E", "5F81", "8CE4", "02F8"] },
    { l: 6, b: "0180", i: "D182", a: "397C", e: "0", p: "057F", m: ["0185", "53F8", "C180", "64CF", "7FCB", "5555", "10DC", "7FFF"] },
    { l: 6, b: "0B90", i: "CB92", a: "24AE", e: "1", p: "0A2D", m: ["3286", "8B60", "4B94", "8000", "0B91", "0B90", "0B91", "5750"] },
    { l: 6, b: "0960", i: "C963", a: "EBED", e: "1", p: "041C", m: ["0967", "0962", "AE96", "0966", "A2A0", "5555", "0965", "12AE"] },
    { l: 6, b: "008D", i: "B08D", a: "8D0C", e: "0", p: "06FB", m: ["008F", "0091", "0090", "EA50", "4469", "0094", "76FE", "82C0"] },
    { l: 6, b: "04B0", i: "D4B1", a: "9732", e: "0", p: "0073", m: ["AAA9", "D4B3", "B078", "04B6", "859B", "BEEF", "27E5", "2FA8"] },
    { l: 6, b: "0560", i: "5560", a: "9522", e: "0", p: "00CD", m: ["0563", "4733", "C9A9", "F0F0", "31E4", "0563", "AAAA", "1234"] },
    { l: 6, b: "01D0", i: "B1D5", a: "B680", e: "0", p: "06FE", m: ["01D4", "01D0", "01D5", "2053", "01D7", "01D6", "01D2", "5555"] },
    { l: 6, b: "0728", i: "972C", a: "D234", e: "0", p: "0BE8", m: ["0729", "B975", "0729", "0729", "B72C", "C0DE", "072D", "ADD3"] },
    { l: 6, b: "04A8", i: "34AE", a: "7FFF", e: "0", p: "0C37", m: ["87B3", "0F0F", "5BC0", "0F0F", "04AA", "8385", "04AC", "0001"] },
    { l: 6, b: "0D92", i: "0D99", a: "FAB4", e: "1", p: "0C56", m: ["67DC", "0D99", "BEEF", "24C8", "6330", "07F2", "1234", "CE33"] },
    { l: 6, b: "0C3D", i: "8C3E", a: "7FFF", e: "1", p: "0B74", m: ["0C44", "1C3E", "197D", "0C3F", "A9CA", "9319", "0C3F", "0F0F"] },
    { l: 6, b: "0209", i: "E209", a: "EF6B", e: "0", p: "03D0", m: ["020E", "F853", "020A", "E0CF", "00FF", "020B", "DCF2", "0209"] },
    { l: 6, b: "00B9", i: "80B9", a: "4247", e: "1", p: "01FD", m: ["00B9", "00BE", "00BD", "00BF", "EC74", "581F", "5386", "9A94"] },
  ];

  const LEVEL_NAMES = ['Warm-up', 'Direct', 'Indirect', 'Mixed', 'Tricky', 'Expert'];
  const MAX_LEVEL = LEVEL_NAMES.length;
  const CLIMB = 3; // consecutive correct answers needed to rise one level

  /* ── 3D stage ───────────────────────────────────────────── */

  const Stage = (() => {
    const idle = { load() {}, play: () => Promise.resolve() };
    const T = window.THREE;
    if (!T) return idle;

    const canvas = document.getElementById('stage');
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) {
      return idle;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const SPEED = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.35 : 1;
    const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    const COLORS = {
      body: 0x202026, edge: 0x4a4a55,
      addr: 0x6ee7ff, ptr: 0xffc857, data: 0xb9a4ff, good: 0x5cf2a0, bad: 0xff6b7a,
    };
    const MEM_X = 3.9;

    const scene = new T.Scene();
    scene.fog = new T.Fog(0x0e0e11, 24, 52);
    const camera = new T.PerspectiveCamera(36, 1, 0.1, 200);
    scene.add(new T.AmbientLight(0xffffff, 0.75));
    const key = new T.DirectionalLight(0xffffff, 0.85);
    key.position.set(-5, 8, 10);
    scene.add(key);

    const rig = new T.Group();
    rig.position.y = 0.9;
    scene.add(rig);

    const floor = new T.GridHelper(30, 30, 0x2a2a33, 0x1b1b21);
    floor.position.y = -3.3;
    rig.add(floor);

    /* — helpers — */

    const tmpA = new T.Color();
    const tmpB = new T.Color();
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const randHex = () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)];

    let run = 0; // bumping this cancels every in-flight tween (they jump to their end state)
    const tween = (ms, fn) => new Promise((resolve) => {
      const id = run;
      const dur = Math.max(1, ms * SPEED);
      const t0 = performance.now();
      const step = (now) => {
        if (id !== run) { fn(1, 1); resolve(); return; }
        const raw = clamp01((now - t0) / dur);
        fn(easeInOut(raw), raw);
        if (raw < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });

    function makeBlock(w, h, d, cw) {
      const pad = 0.1;
      const ch = Math.round(cw * (h - pad) / (w - pad));
      const surface = document.createElement('canvas');
      surface.width = cw;
      surface.height = ch;
      const ctx = surface.getContext('2d');
      const tex = new T.CanvasTexture(surface);
      tex.anisotropy = 4;

      const mat = new T.MeshStandardMaterial({ color: COLORS.body, roughness: 0.55, metalness: 0.2 });
      const box = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      const edgeMat = new T.LineBasicMaterial({ color: COLORS.edge });
      const edges = new T.LineSegments(new T.EdgesGeometry(box.geometry), edgeMat);
      const face = new T.Mesh(
        new T.PlaneGeometry(w - pad, h - pad),
        new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      );
      face.position.z = d / 2 + 0.012;

      const group = new T.Group();
      group.add(box, edges, face);
      return {
        group, pos: group.position, w, h, d, mat, edgeMat,
        paint(fn) { ctx.clearRect(0, 0, cw, ch); fn(ctx, cw, ch); tex.needsUpdate = true; },
      };
    }

    function disposeBlock(b) {
      b.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    }

    function setGlow(b, color, k) {
      b.mat.emissive.setHex(color).multiplyScalar(0.6 * k);
      b.edgeMat.color.copy(tmpA.setHex(COLORS.edge).lerp(tmpB.setHex(color), clamp01(k * 1.4)));
    }

    function paintRegister(b, title, value, flag) {
      b.paint((c, w, h) => {
        c.textBaseline = 'alphabetic';
        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.font = `600 ${h * 0.17}px ${FONT}`;
        c.textAlign = 'left';
        c.fillText(title, w * 0.06, h * 0.28);
        if (flag !== undefined) {
          c.textAlign = 'right';
          c.fillText(`E ${flag}`, w * 0.94, h * 0.28);
        }
        c.textAlign = 'center';
        c.fillStyle = '#f4f5f8';
        c.font = `700 ${Math.min(h * 0.46, w * 0.17)}px ${FONT}`;
        c.fillText(value, w * 0.5, h * 0.8);
      });
    }

    function paintCell(b, addr, value) {
      b.paint((c, w, h) => {
        c.textBaseline = 'middle';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,255,255,0.38)';
        c.font = `500 ${h * 0.36}px ${FONT}`;
        c.fillText(addr, w * 0.05, h * 0.54);
        c.textAlign = 'right';
        c.fillStyle = '#f4f5f8';
        c.font = `700 ${h * 0.58}px ${FONT}`;
        c.fillText(value, w * 0.95, h * 0.54);
      });
    }

    function caption(text, x, y) {
      const surface = document.createElement('canvas');
      surface.width = 512;
      surface.height = 64;
      const c = surface.getContext('2d');
      c.font = `600 24px ${FONT}`;
      c.fillStyle = 'rgba(255,255,255,0.32)';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '7px';
      c.fillText(text, 256, 32);
      const mesh = new T.Mesh(
        new T.PlaneGeometry(3.2, 0.4),
        new T.MeshBasicMaterial({ map: new T.CanvasTexture(surface), transparent: true, depthWrite: false })
      );
      mesh.position.set(x, y, 0);
      rig.add(mesh);
    }

    /* — static machine: instruction register, accumulator, program counter, memory — */

    const ir = makeBlock(3.1, 1.0, 1.0, 640);
    ir.pos.set(-4.7, 2.3, 0);
    const ac = makeBlock(3.1, 1.5, 1.2, 640);
    ac.pos.set(-4.7, 0.1, 0);
    const pcBlock = makeBlock(3.1, 1.0, 1.0, 640);
    pcBlock.pos.set(-4.7, -1.9, 0);
    rig.add(ir.group, ac.group, pcBlock.group);
    caption('MEMORY', MEM_X, 3.45);

    let cells = [];
    let paths = [];

    function buildMemory(r) {
      cells.forEach((b) => { rig.remove(b.group); disposeBlock(b); });
      const n = r.mem.length;
      const pitch = 5.6 / n;
      cells = r.mem.map((v, i) => {
        const b = makeBlock(3.6, pitch * 0.86, 1.0, 768);
        b.pos.set(MEM_X, ((n - 1) / 2 - i) * pitch, 0);
        paintCell(b, hex(r.base + i), hex(v));
        rig.add(b.group);
        return b;
      });
    }

    function clearPaths() {
      paths.forEach((p) => {
        rig.remove(p.mesh, p.orb);
        p.geo.dispose();
        p.mesh.material.dispose();
      });
      paths = [];
    }

    /* — paths and data packets — */

    function makePath(points, color) {
      const curve = new T.CatmullRomCurve3(points);
      const geo = new T.TubeGeometry(curve, 64, 0.04, 8, false);
      geo.setDrawRange(0, 0);
      const mesh = new T.Mesh(geo, new T.MeshBasicMaterial({ color }));
      const orb = new T.Group();
      orb.add(new T.Mesh(new T.SphereGeometry(0.12, 20, 20), new T.MeshBasicMaterial({ color: 0xffffff })));
      orb.add(new T.Mesh(
        new T.SphereGeometry(0.3, 20, 20),
        new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false })
      ));
      orb.visible = false;
      rig.add(mesh, orb);
      const p = { curve, geo, mesh, orb, total: geo.index.count };
      paths.push(p);
      return p;
    }

    const travel = (p, ms) => tween(ms, (k) => {
      p.geo.setDrawRange(0, Math.floor((p.total * k) / 3) * 3);
      p.orb.position.copy(p.curve.getPoint(k));
      p.orb.visible = k < 1;
    });

    const V = (x, y, z) => new T.Vector3(x, y, z);
    const rightOf = (b) => b.pos.clone().add(V(b.w / 2, 0, 0));
    const leftOf = (b) => b.pos.clone().add(V(-b.w / 2, 0, 0));

    /* address path: instruction register → memory cell */
    function addressPath(from, to, color) {
      const s = rightOf(from);
      const e = leftOf(to);
      const dy = e.y - s.y;
      return makePath([s, V(s.x + 1.3, s.y + dy * 0.1, 0.6), V(e.x - 1.5, e.y - dy * 0.1, 0.6), e], color);
    }

    /* pointer hop: memory cell → memory cell (arcs out to the left of the column) */
    function hopPath(from, to, color) {
      const s = leftOf(from);
      const e = leftOf(to);
      if (from === to) {
        return makePath([s, V(s.x - 0.8, s.y + 0.55, 0.4), V(s.x - 1.5, s.y, 0.5), V(s.x - 0.8, s.y - 0.55, 0.4), s], color);
      }
      const dy = e.y - s.y;
      const bulge = 1.3 + Math.min(Math.abs(dy) * 0.25, 0.9);
      return makePath([
        s, V(s.x - 0.7, s.y + dy * 0.15, 0.35), V(s.x - bulge, s.y + dy / 2, 0.5),
        V(e.x - 0.7, e.y - dy * 0.15, 0.35), e,
      ], color);
    }

    /* data path between a register (AC or PC) and a memory cell, routed behind the address path */
    function flowPath(from, to, z) {
      const fromCell = cells.includes(from);
      const s = fromCell ? leftOf(from) : rightOf(from);
      const e = fromCell ? rightOf(to) : leftOf(to);
      const dir = Math.sign(e.x - s.x);
      return makePath([s, V(s.x + dir * 1.4, s.y, z), V(e.x - dir * 1.4, e.y, z), e], COLORS.data);
    }

    const pulse = (b, color, ms, hold = 0.35) => tween(ms, (k, raw) => {
      const w = Math.sin(Math.PI * raw);
      setGlow(b, color, hold * raw + w * 0.9);
      b.group.scale.setScalar(1 + 0.06 * w);
    });

    /* digits resolve left to right, like a settling counter */
    const settle = (ms, final, paint) => tween(ms, (k, raw) => {
      const locked = Math.floor(raw * (final.length + 0.999));
      paint(final.split('').map((ch, i) => (i < locked || raw >= 1 ? ch : randHex())).join(''));
    });

    /* — public API — */

    function load(r) {
      run += 1;
      clearPaths();
      [ir, ac, pcBlock].forEach((b) => { setGlow(b, 0, 0); b.group.scale.setScalar(1); });
      paintRegister(ir, 'IR', hex(r.word));
      paintRegister(ac, 'AC', hex(r.ac0), r.e0);
      paintRegister(pcBlock, 'PC', hex(r.pc0));
      buildMemory(r);

      const stagger = 55;
      const span = 280;
      const total = span + stagger * cells.length;
      tween(total, (k, raw) => {
        const t = raw * total;
        cells.forEach((b, i) => {
          const s = easeOut(clamp01((t - i * stagger) / span));
          b.group.scale.setScalar(Math.max(s, 0.001));
          b.pos.x = MEM_X + (1 - s) * 0.9;
        });
      });
    }

    async function play(r, verdict) {
      const id = ++run;
      const alive = () => id === run;
      const target = cells[r.slot];
      const pointer = r.indirect ? cells[r.ptr - r.base] : null;
      if (!target) return;

      cells.forEach((b) => { b.group.scale.setScalar(1); b.pos.x = MEM_X; });

      await pulse(ir, COLORS.addr, 320);
      if (!alive()) return;

      if (pointer) {
        await travel(addressPath(ir, pointer, COLORS.ptr), 520);
        if (!alive()) return;
        await pulse(pointer, COLORS.ptr, 300);
        if (!alive()) return;
        await travel(hopPath(pointer, target, COLORS.ptr), 560);
      } else {
        await travel(addressPath(ir, target, COLORS.addr), 640);
      }
      if (!alive()) return;
      await pulse(target, COLORS.addr, 300);
      if (!alive()) return;

      const moves = [];
      switch (r.op) {
        case 0: case 1: case 2: moves.push(travel(flowPath(target, ac, -0.8), 680)); break;
        case 3: moves.push(travel(flowPath(ac, target, -0.8), 680)); break;
        case 4: moves.push(travel(flowPath(target, pcBlock, -0.8), 680)); break;
        case 5:
          moves.push(travel(flowPath(pcBlock, target, -1.4), 680), travel(flowPath(target, pcBlock, -0.8), 680));
          break;
        default: if (r.pc !== r.pc0) moves.push(travel(flowPath(target, pcBlock, -0.8), 680));
      }
      await Promise.all(moves);
      if (!alive()) return;

      const updates = [];
      const addr = hex(r.ea);
      if (r.ac !== r.ac0 || r.e !== r.e0) updates.push(settle(480, hex(r.ac), (t) => paintRegister(ac, 'AC', t, r.e)));
      if (r.pc !== r.pc0) updates.push(settle(480, hex(r.pc), (t) => paintRegister(pcBlock, 'PC', t)));
      if (r.m !== r.m0) updates.push(settle(480, hex(r.m), (t) => paintCell(target, addr, t)));
      await Promise.all(updates);
      if (!alive()) return;

      setGlow(ac, verdict.ac && verdict.e ? COLORS.good : COLORS.bad, 0.8);
      setGlow(pcBlock, verdict.pc ? COLORS.good : COLORS.bad, 0.8);
      setGlow(target, verdict.ea && verdict.mem ? COLORS.good : COLORS.bad, 0.8);
      if (pointer && pointer !== target) setGlow(pointer, COLORS.ptr, 0.3);
    }

    /* — scene plumbing — */

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const half = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const dist = Math.max(16, 14.5 / (2 * half * camera.aspect));
      camera.position.set(0, 0.4, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    const look = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', (e) => {
      look.tx = (e.clientX / window.innerWidth) * 2 - 1;
      look.ty = (e.clientY / window.innerHeight) * 2 - 1;
    });

    (function frame(t) {
      look.x += (look.tx - look.x) * 0.05;
      look.y += (look.ty - look.y) * 0.05;
      rig.rotation.y = -0.26 + look.x * 0.14;
      rig.rotation.x = 0.1 + look.y * 0.06 + Math.sin(t / 2600) * 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    })(0);

    return { load, play };
  })();

  /* ── Controller ─────────────────────────────────────────── */

  const $ = (id) => document.getElementById(id);
  const el = {
    level: $('stat-level'), levelName: $('stat-level-name'), pips: $('pips').children,
    streak: $('stat-streak'), score: $('stat-score'),
    instr: $('instr'), acBefore: $('ac-before'), eBefore: $('e-before'), pcBefore: $('pc-before'),
    toast: $('toast'),
    form: $('answer'), submit: $('btn-submit'), result: $('result'),
    fieldEa: $('field-ea'), lblMem: $('lbl-mem'),
    inAc: $('in-ac'), inE: $('in-e'), inPc: $('in-pc'), inEa: $('in-ea'), inMem: $('in-mem'),
    sheet: $('sheet'), isa: $('btn-isa'),
  };
  const inputs = [el.inAc, el.inE, el.inPc, el.inEa, el.inMem];

  const state = { level: 1, streak: 0, climb: 0, score: 0, phase: 'answering', r: null, showEa: false };

  const POOLS = {};
  BANK.forEach((q, i) => { (POOLS[q.l] = POOLS[q.l] || []).push(i); });
  const used = {};
  let lastIndex = -1;

  function draw(level) {
    const pool = POOLS[level] || POOLS[1];
    const key = pool === POOLS[level] ? level : 1;
    const seen = used[key] || (used[key] = new Set());
    let free = pool.filter((i) => !seen.has(i));
    if (!free.length) {
      seen.clear();
      free = pool.filter((i) => i !== lastIndex);
    }
    const i = free[Math.floor(Math.random() * free.length)];
    seen.add(i);
    lastIndex = i;
    return BANK[i];
  }

  let toastTimer = 0;
  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 1700);
  }

  function renderStats() {
    el.level.textContent = state.level;
    el.levelName.textContent = LEVEL_NAMES[state.level - 1];
    el.streak.textContent = state.streak;
    el.score.textContent = state.score;
    [...el.pips].forEach((p, i) => p.classList.toggle('on', state.level === MAX_LEVEL || i < state.climb));
  }

  const visibleInputs = () => inputs.filter((i) => !i.closest('.field').hidden);
  function focusStep(from, step) {
    const list = visibleInputs();
    const target = list[list.indexOf(from) + step];
    if (target) { target.focus(); target.select(); }
  }

  function loadQuestion() {
    const q = draw(state.level);
    const r = execute(q);
    state.r = r;
    state.phase = 'answering';
    state.showEa = state.level >= 3;

    el.instr.textContent = q.i;
    el.acBefore.textContent = q.a;
    el.eBefore.textContent = q.e;
    el.pcBefore.textContent = q.p;
    el.fieldEa.hidden = !state.showEa;
    el.form.classList.toggle('two', !state.showEa);
    el.lblMem.textContent = state.showEa ? 'M[EA]' : `M[${hex(r.ea)}]`;
    inputs.forEach((input) => {
      input.value = '';
      input.readOnly = false;
      input.closest('.field').className = 'field';
    });
    el.result.hidden = true;
    el.submit.firstChild.nodeValue = 'Check ';
    renderStats();
    Stage.load(r);
    el.inAc.focus();
  }

  function check() {
    if (state.phase !== 'answering') return;
    const r = state.r;
    const read = (input) => (input.value === '' ? null : parseInt(input.value, 16));
    const got = {
      ac: read(el.inAc), e: read(el.inE), pc: read(el.inPc),
      ea: state.showEa ? read(el.inEa) : r.ea, mem: read(el.inMem),
    };

    if (Object.values(got).some((v) => v === null)) {
      el.form.classList.remove('shake');
      void el.form.offsetWidth;
      el.form.classList.add('shake');
      const empty = visibleInputs().find((i) => i.value === '');
      if (empty) empty.focus();
      return;
    }

    const verdict = {
      ac: got.ac === r.ac, e: got.e === r.e, pc: got.pc === r.pc, ea: got.ea === r.ea, mem: got.mem === r.m,
    };
    const ok = Object.values(verdict).every(Boolean);
    state.phase = 'result';

    let gain = 0;
    const before = state.level;
    if (ok) {
      gain = 100 * state.level + Math.min(state.streak, 10) * 10;
      state.score += gain;
      state.streak += 1;
      state.climb += 1;
      if (state.climb >= CLIMB && state.level < MAX_LEVEL) { state.level += 1; state.climb = 0; }
    } else {
      state.streak = 0;
      state.climb = 0;
      if (state.level > 1) state.level -= 1;
    }
    if (state.level !== before) {
      toast(`${state.level > before ? 'Level up' : 'Level down'} · ${LEVEL_NAMES[state.level - 1]}`);
    }

    inputs.forEach((input) => { input.readOnly = true; });
    [[el.inAc, verdict.ac], [el.inE, verdict.e], [el.inPc, verdict.pc], [el.inEa, verdict.ea], [el.inMem, verdict.mem]]
      .forEach(([input, good]) => input.closest('.field').classList.add(good ? 'good' : 'bad'));
    showResult(r, verdict, ok, gain);
    el.submit.firstChild.nodeValue = 'Next ';
    renderStats();
    Stage.play(r, verdict);
    el.submit.focus();
  }

  function showResult(r, verdict, ok, gain) {
    const x = explain(r);
    const mark = (flag) => (flag ? '' : ' class="x"');
    el.result.className = `result ${ok ? 'ok' : 'no'}`;
    el.result.innerHTML =
      `<div class="verdict">${ok ? 'Correct' : 'Not quite'}<em>${ok ? `+${gain}` : x.head}</em></div>` +
      `<div class="trace"><b>${ok ? x.head : 'Trace'}</b> · ${x.route}</div>` +
      `<div class="trace">${x.effect}</div>` +
      `<div class="truth"><span${mark(verdict.ac)}>AC <b>${hex(r.ac)}</b></span>` +
      `<span${mark(verdict.e)}>E <b>${r.e}</b></span>` +
      `<span${mark(verdict.pc)}>PC <b>${hex(r.pc)}</b></span>` +
      `<span${mark(verdict.ea)}>EA <b>${hex(r.ea)}</b></span>` +
      `<span${mark(verdict.mem)}>M[${hex(r.ea)}] <b>${hex(r.m)}</b></span></div>`;
    el.result.hidden = false;
  }

  /* — events — */

  inputs.forEach((input) => {
    const allowed = input === el.inE ? /[^01]/g : /[^0-9a-f]/gi;
    input.addEventListener('input', () => {
      input.value = input.value.replace(allowed, '').toUpperCase().slice(0, input.maxLength);
      input.closest('.field').classList.remove('bad', 'good');
      if (input.value.length === input.maxLength && state.phase === 'answering') focusStep(input, 1);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '') focusStep(input, -1);
    });
  });

  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.phase === 'result') loadQuestion(); else check();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !el.sheet.hidden) { toggleSheet(false); return; }
    if (e.key !== 'Enter' || e.target.closest('button')) return;
    e.preventDefault();
    if (state.phase === 'result') { loadQuestion(); return; }
    const list = visibleInputs();
    const i = list.indexOf(e.target);
    if (i > -1 && i < list.length - 1 && e.target.value !== '') focusStep(e.target, 1); else check();
  });

  function toggleSheet(open) {
    el.sheet.hidden = !open;
    el.isa.setAttribute('aria-expanded', String(open));
  }
  el.isa.addEventListener('click', () => toggleSheet(el.sheet.hidden));

  loadQuestion();
})();