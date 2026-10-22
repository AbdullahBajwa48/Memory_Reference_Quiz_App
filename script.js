/* ACC/ISA — single-accumulator addressing quiz
 * Sections: Engine · Question bank · 3D stage · Controller */
(() => {
  'use strict';

  /* ── Engine ─────────────────────────────────────────────── */

  const MASK = 0xFFFF;
  const ADDR = 0x0FFF;
  const OPS = ['AND', 'ADD', 'LDA', 'STA', 'SUB', 'OR', 'XOR', 'XCH'];
  const SYMBOL = { 0: 'AND', 1: '+', 4: '−', 5: 'OR', 6: 'XOR' };

  const parse = (s) => parseInt(s, 16) & MASK;
  const hex = (n, w = 4) => (n >>> 0).toString(16).toUpperCase().padStart(w, '0').slice(-w);

  /* Word layout: [I:1][op:3][address:12]. I = 1 → indirect (EA = low 12 bits of M[address]). */
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
    const m0 = mem[slot];
    let ac = ac0;
    let m = m0;

    switch (op) {
      case 0: ac = ac0 & m0; break;
      case 1: ac = (ac0 + m0) & MASK; break;
      case 2: ac = m0; break;
      case 3: m = ac0; break;
      case 4: ac = (ac0 - m0) & MASK; break;
      case 5: ac = ac0 | m0; break;
      case 6: ac = ac0 ^ m0; break;
      default: ac = m0; m = ac0; // XCH
    }

    return {
      base, mem, word, indirect, op, name: OPS[op], operand, ptr, ea, slot,
      ac0, m0, ac, m, reads: op !== 3, writes: op === 3 || op === 7,
    };
  }

  function explain(r) {
    const route = r.indirect
      ? `M[${hex(r.ptr)}] = ${hex(r.mem[r.ptr - r.base])} → EA ${hex(r.ea)}`
      : `EA ${hex(r.ea)}`;
    let effect;
    if (r.op === 2) effect = `AC ← M[${hex(r.ea)}] = ${hex(r.m0)}`;
    else if (r.op === 3) effect = `M[${hex(r.ea)}] ← AC = ${hex(r.ac0)}`;
    else if (r.op === 7) effect = `AC ↔ M[${hex(r.ea)}] → AC ${hex(r.ac)}, M ${hex(r.m)}`;
    else effect = `AC ← ${hex(r.ac0)} ${SYMBOL[r.op]} ${hex(r.m0)} = ${hex(r.ac)}`;
    return { head: `${r.name} · ${r.indirect ? 'indirect' : 'direct'}`, route, effect };
  }

  /* ── Question bank ──────────────────────────────────────── */
  /* l: level · b: first address of the memory window · i: instruction word
   * a: AC before execution · m: memory window contents (b, b+1, …)
   * Answers are derived from these fields by execute(). */

  const BANK = [
    // Level 1
    { l: 1, b: "00B9", i: "10BE", a: "00B0", m: ["0052", "0034", "00FF", "001B", "0077", "0094"] },
    { l: 1, b: "0918", i: "3919", a: "0065", m: ["006C", "00F1", "0085", "0097", "00AF", "0040"] },
    { l: 1, b: "0240", i: "2242", a: "005E", m: ["005D", "0098", "00FF", "006C", "0050", "006C"] },
    { l: 1, b: "0A81", i: "2A82", a: "0053", m: ["00B0", "0084", "0041", "0076", "0058", "00E0"] },
    { l: 1, b: "0F88", i: "1F88", a: "0083", m: ["00BE", "002D", "00FB", "0063", "0093", "0064"] },
    { l: 1, b: "01D8", i: "11DC", a: "0047", m: ["009F", "0019", "00A1", "00B0", "0004", "00ED"] },
    { l: 1, b: "02C8", i: "22CB", a: "0063", m: ["0048", "00AD", "0044", "00D1", "0057", "00AE"] },
    { l: 1, b: "0FD8", i: "2FDA", a: "0014", m: ["0022", "0078", "0051", "001A", "0088", "0093"] },
    { l: 1, b: "0160", i: "3164", a: "007A", m: ["007F", "001C", "0081", "0051", "0052", "00E3"] },
    { l: 1, b: "0268", i: "2269", a: "00F0", m: ["00F4", "0046", "0062", "0028", "00E5", "0087"] },
    { l: 1, b: "0DB8", i: "2DB8", a: "00E9", m: ["0033", "00F1", "00FD", "0089", "0034", "001C"] },
    { l: 1, b: "0581", i: "1581", a: "0040", m: ["0093", "0086", "00BA", "00B7", "00A1", "0057"] },
    // Level 2
    { l: 2, b: "0120", i: "5120", a: "000F", m: ["2230", "E321", "0000", "0000", "0000", "0000"] },
    { l: 2, b: "0110", i: "1115", a: "0965", m: ["0F94", "0833", "018A", "06DE", "077C", "0FA0"] },
    { l: 2, b: "0DF4", i: "5DF6", a: "0601", m: ["096C", "070A", "0A5E", "0D11", "015E", "0DD5"] },
    { l: 2, b: "0410", i: "4415", a: "0AA4", m: ["0406", "093A", "0E1E", "0BA6", "082F", "0273"] },
    { l: 2, b: "0088", i: "3089", a: "0E71", m: ["0140", "0934", "051A", "0173", "0BBE", "0E04"] },
    { l: 2, b: "0C34", i: "7C39", a: "0E33", m: ["0276", "0FBE", "0C62", "0BB7", "0AC2", "0455"] },
    { l: 2, b: "0790", i: "1793", a: "04C7", m: ["0B23", "01F5", "03B8", "0DA6", "0814", "03D5"] },
    { l: 2, b: "0B19", i: "1B1A", a: "04E1", m: ["01FB", "0890", "05B4", "0600", "044F", "0DAB"] },
    { l: 2, b: "0C18", i: "1C18", a: "08CB", m: ["0BAB", "0ADA", "0033", "096D", "0CCD", "078B"] },
    { l: 2, b: "0865", i: "2866", a: "0C10", m: ["0BBB", "0992", "02B9", "05F8", "0309", "009F"] },
    { l: 2, b: "07B8", i: "27B8", a: "0D51", m: ["0B67", "03EF", "05A8", "0907", "0CC8", "0FE7"] },
    { l: 2, b: "0AE8", i: "7AEA", a: "0FC5", m: ["0BF2", "0371", "0E85", "0C36", "0A2D", "0797"] },
    { l: 2, b: "0FCD", i: "6FCE", a: "0CE9", m: ["0D75", "08AC", "0382", "0EF0", "01FE", "04B8"] },
    { l: 2, b: "0CF8", i: "0CFD", a: "08A8", m: ["04CF", "09CB", "0DAF", "0506", "0E12", "05DF"] },
    { l: 2, b: "0DE0", i: "4DE1", a: "0D5C", m: ["0BA1", "0693", "0D82", "027E", "0DAA", "07E9"] },
    { l: 2, b: "0098", i: "109C", a: "0E89", m: ["0410", "0810", "0589", "07FA", "0844", "09AF"] },
    { l: 2, b: "0B20", i: "3B23", a: "0BC8", m: ["07B3", "0039", "0670", "02EF", "08A1", "0C03"] },
    { l: 2, b: "0841", i: "1845", a: "0DE8", m: ["0438", "0160", "0780", "036B", "00EB", "0E23"] },
    // Level 3
    { l: 3, b: "0715", i: "3719", a: "73E9", m: ["2C4F", "E061", "BA8B", "0715", "0715", "79ED"] },
    { l: 3, b: "00E9", i: "40EE", a: "84DC", m: ["4891", "D93F", "DB35", "1E78", "63E0", "00ED"] },
    { l: 3, b: "0CDB", i: "BCDB", a: "6671", m: ["0CDC", "6C1F", "0CDF", "6644", "0CDC", "0CDC"] },
    { l: 3, b: "0708", i: "A70B", a: "B006", m: ["EF70", "52CB", "070B", "0709", "070A", "DA44"] },
    { l: 3, b: "05DB", i: "C5DF", a: "F366", m: ["DDE0", "05DF", "05DC", "05DC", "05DD", "475E"] },
    { l: 3, b: "0E66", i: "CE67", a: "CBC6", m: ["2317", "0E6A", "012E", "225B", "0E68", "0915"] },
    { l: 3, b: "008F", i: "9090", a: "D8AE", m: ["97FF", "0093", "0092", "F7EB", "102D", "C428"] },
    { l: 3, b: "09B3", i: "C9B7", a: "750C", m: ["7B36", "09B6", "55A0", "D507", "09B4", "F066"] },
    { l: 3, b: "0148", i: "B14C", a: "CBA3", m: ["014B", "014C", "2935", "FAD5", "0149", "38E5"] },
    { l: 3, b: "0753", i: "4758", a: "FFEB", m: ["7A73", "8CEB", "C2CD", "0753", "F267", "42AA"] },
    { l: 3, b: "07FF", i: "B800", a: "D23C", m: ["F625", "0803", "93E7", "BEDA", "0802", "9666"] },
    { l: 3, b: "0640", i: "2641", a: "7BA8", m: ["2D9F", "8457", "0641", "CAAC", "0640", "0642"] },
    { l: 3, b: "0745", i: "B749", a: "5F2D", m: ["B742", "074A", "0748", "0749", "0747", "0749"] },
    { l: 3, b: "03F8", i: "A3FC", a: "4624", m: ["AE42", "F572", "1FE0", "03F9", "03FB", "DB4F"] },
    { l: 3, b: "0B9F", i: "4BA3", a: "2015", m: ["0A04", "EA12", "4CD3", "B12D", "0B9F", "94B7"] },
    { l: 3, b: "0D18", i: "1D1B", a: "863E", m: ["674F", "0D18", "0D18", "0D19", "0D18", "F9A4"] },
    { l: 3, b: "0100", i: "C102", a: "034C", m: ["43D8", "4773", "0105", "13FF", "0102", "0101"] },
    { l: 3, b: "0570", i: "B571", a: "DE59", m: ["FDDF", "0574", "0575", "8C07", "0572", "E947"] },
    { l: 3, b: "0D35", i: "CD35", a: "6971", m: ["0D39", "6E71", "0D36", "0D3A", "0D37", "0D37"] },
    { l: 3, b: "05D1", i: "C5D2", a: "A1A0", m: ["05D3", "05D5", "05D2", "F73F", "9A8B", "0C58"] },
    { l: 3, b: "0A28", i: "9A2C", a: "79FC", m: ["0A2D", "0A2C", "2198", "0A2D", "0A29", "9084"] },
    { l: 3, b: "0A58", i: "4A59", a: "DD01", m: ["0A5D", "7B4D", "DD63", "0A5D", "181E", "4591"] },
    // Level 4
    { l: 4, b: "04AD", i: "14B1", a: "1B34", m: ["F395", "04B0", "04AD", "893B", "04AF", "8011"] },
    { l: 4, b: "0EDE", i: "6EE3", a: "DA01", m: ["0EDF", "8E32", "4762", "7698", "027D", "0EE1"] },
    { l: 4, b: "04E8", i: "A4EB", a: "AB32", m: ["04EA", "FD7A", "B378", "04E8", "F832", "C9E5"] },
    { l: 4, b: "04B8", i: "A4BB", a: "6888", m: ["04BB", "04B8", "04BC", "04BA", "3B79", "1785"] },
    { l: 4, b: "0BE0", i: "EBE1", a: "D756", m: ["B30D", "0BE5", "665C", "1389", "0CCC", "0BE2"] },
    { l: 4, b: "09A4", i: "D9A5", a: "D8D4", m: ["57D5", "09A9", "09A9", "09A8", "09A9", "09A4"] },
    { l: 4, b: "022A", i: "122F", a: "DE2A", m: ["0DB3", "1591", "022A", "022C", "63D6", "022D"] },
    { l: 4, b: "05D8", i: "95DD", a: "FB07", m: ["42DC", "DFFF", "05DD", "05D9", "05D9", "05DA"] },
    { l: 4, b: "037D", i: "4381", a: "A4E9", m: ["BD65", "8141", "037D", "C80D", "E006", "B4E2"] },
    { l: 4, b: "08D7", i: "E8DC", a: "7277", m: ["EC7E", "B210", "08DA", "08D9", "51FB", "08D7"] },
    { l: 4, b: "0841", i: "9841", a: "8D7A", m: ["0846", "CC8A", "0845", "BC62", "1E35", "93A9"] },
    { l: 4, b: "03B2", i: "03B7", a: "9A82", m: ["A84A", "E121", "03B3", "03B4", "C18E", "03B2"] },
    { l: 4, b: "0218", i: "621C", a: "E54E", m: ["C5AA", "021B", "8D40", "7BA2", "021A", "021B"] },
    { l: 4, b: "043F", i: "0443", a: "F28D", m: ["63C5", "E1E2", "0440", "0441", "0444", "C15D"] },
    { l: 4, b: "0CB6", i: "1CB6", a: "7816", m: ["0CBA", "24AA", "94B4", "0CBB", "0CB8", "0CB6"] },
    { l: 4, b: "09D9", i: "19DD", a: "2EDB", m: ["250C", "EC43", "DCF0", "69AE", "09D9", "09DB"] },
    { l: 4, b: "0EF8", i: "6EFA", a: "A925", m: ["0EFB", "311F", "385A", "14F6", "DB81", "9CFA"] },
    { l: 4, b: "0C08", i: "CC0A", a: "0080", m: ["0C09", "7E12", "0C08", "027B", "0C0B", "0C0B"] },
    { l: 4, b: "0450", i: "B453", a: "F351", m: ["1684", "0527", "6A2F", "0451", "8B2E", "A053"] },
    { l: 4, b: "04E8", i: "94EA", a: "FD2C", m: ["3F0C", "F7E7", "04EC", "04ED", "04EA", "6467"] },
    { l: 4, b: "05D2", i: "F5D5", a: "8033", m: ["B6F1", "8E18", "05D5", "05D4", "9871", "32D7"] },
    { l: 4, b: "05E7", i: "45E7", a: "031A", m: ["05EA", "3F12", "6B14", "05E7", "F165", "7078"] },
    { l: 4, b: "0528", i: "752C", a: "75E1", m: ["03E6", "995D", "DDFE", "E4CC", "0528", "7C5F"] },
    { l: 4, b: "0248", i: "D24D", a: "B984", m: ["F535", "0248", "024B", "024C", "DAB7", "024A"] },
    // Level 5
    { l: 5, b: "0D82", i: "7D88", a: "0ECC", m: ["3ED2", "0D89", "BF66", "602F", "8F5D", "8478", "40D5", "0D87"] },
    { l: 5, b: "03F2", i: "A3F2", a: "C7AF", m: ["03F6", "481C", "FC01", "C54A", "03F5", "03F6", "55AF", "03F8"] },
    { l: 5, b: "0940", i: "C942", a: "04FD", m: ["3B30", "0946", "0943", "0940", "9CE5", "8C8C", "0947", "0945"] },
    { l: 5, b: "0198", i: "519A", a: "5909", m: ["A0DD", "019F", "0B6F", "C091", "536A", "9175", "EEC6", "8CCB"] },
    { l: 5, b: "0EE4", i: "CEE6", a: "D19C", m: ["D1A6", "0EE7", "0EE9", "A0B7", "78EA", "1F46", "60D1", "D181"] },
    { l: 5, b: "07EE", i: "17F5", a: "FB47", m: ["17A1", "07F1", "1496", "07F3", "D0BB", "B18D", "07F2", "07F0"] },
    { l: 5, b: "090F", i: "D910", a: "3AD1", m: ["2909", "0916", "9E06", "09F3", "8D0D", "4E6D", "C8BE", "0913"] },
    { l: 5, b: "03F0", i: "D3F3", a: "6728", m: ["DEB9", "8A74", "5AC4", "03F5", "C518", "0A6D", "8F17", "03F4"] },
    { l: 5, b: "0D75", i: "8D76", a: "5A48", m: ["D1FF", "0D77", "46FA", "8AE1", "0D76", "0D76", "CD11", "1EC1"] },
    { l: 5, b: "0CA0", i: "ACA3", a: "5F2C", m: ["9312", "0CA2", "0CA6", "0CA1", "0550", "0CA2", "0CA4", "27E4"] },
    { l: 5, b: "09E0", i: "49E3", a: "02AE", m: ["09E2", "ADD7", "09E1", "09E5", "09E3", "FFC1", "940C", "3BEB"] },
    { l: 5, b: "0B88", i: "EB8B", a: "DEE3", m: ["0B89", "0B88", "E78E", "0B88", "3882", "CCCC", "0B8C", "E5B2"] },
    { l: 5, b: "0A0F", i: "AA16", a: "B78E", m: ["25F3", "F1D3", "12F7", "A2B3", "0A12", "0A11", "28C6", "0A13"] },
    { l: 5, b: "0B90", i: "6B93", a: "8C74", m: ["0B96", "307A", "0B91", "4DCA", "E519", "0B94", "DDAE", "0B91"] },
    { l: 5, b: "04E8", i: "34E8", a: "DA32", m: ["E21C", "BC12", "A36A", "FC83", "A664", "04EC", "1A97", "04EB"] },
    { l: 5, b: "047A", i: "F47C", a: "BFAF", m: ["3432", "0481", "047D", "047B", "61A4", "0481", "AEE3", "E81F"] },
    { l: 5, b: "0D90", i: "FD90", a: "CD4D", m: ["0D97", "ACC2", "5BBD", "0D90", "0D92", "4EBE", "0D92", "0D93"] },
    { l: 5, b: "0988", i: "798C", a: "A01D", m: ["098F", "CAB0", "87DB", "7D8B", "098F", "098F", "0989", "0988"] },
    { l: 5, b: "07F5", i: "A7F9", a: "876E", m: ["2E6B", "7845", "07FB", "11E1", "07F7", "07F9", "9D11", "F3FD"] },
    { l: 5, b: "0118", i: "811F", a: "5975", m: ["BDF6", "EB9A", "1EDF", "0118", "9A35", "A16C", "011D", "011B"] },
    { l: 5, b: "0036", i: "4037", a: "1AFF", m: ["EC51", "48AB", "7BD9", "24B0", "9459", "0039", "0036", "D899"] },
    { l: 5, b: "0180", i: "C181", a: "0096", m: ["0184", "0187", "B9AE", "0181", "3B1F", "AB8D", "0181", "0186"] },
    { l: 5, b: "0778", i: "877E", a: "D6B9", m: ["CAE3", "077C", "077B", "554C", "8384", "F052", "077E", "A4A3"] },
    { l: 5, b: "018B", i: "F18B", a: "6492", m: ["018B", "1716", "ECF4", "018D", "018C", "0191", "0136", "17F2"] },
    // Level 6
    { l: 6, b: "0ED5", i: "EED8", a: "C4C7", m: ["0EDB", "0EDB", "FA01", "4ED5", "F822", "0ED6", "0ED9", "0ED7"] },
    { l: 6, b: "0148", i: "D14C", a: "4CDB", m: ["F517", "014B", "E0E3", "B2FB", "A14C", "BEEF", "B809", "014B"] },
    { l: 6, b: "0F40", i: "9F46", a: "7FC4", m: ["7FFF", "0F45", "7B24", "2426", "0F46", "0F40", "6F45", "0F44"] },
    { l: 6, b: "0510", i: "D510", a: "0001", m: ["0510", "B9FC", "BEEF", "FCA2", "7C74", "ED9B", "0511", "0514"] },
    { l: 6, b: "05A7", i: "B5A7", a: "AA3E", m: ["35AE", "F0F0", "FF00", "74BE", "05AC", "F39D", "05AA", "C0DE"] },
    { l: 6, b: "0597", i: "E597", a: "4B82", m: ["B59B", "FCA1", "FA78", "BDE1", "5BE6", "F77C", "1791", "0599"] },
    { l: 6, b: "0200", i: "0205", a: "552E", m: ["ED9F", "2B31", "0207", "E9FD", "0206", "BDDE", "5F6E", "F852"] },
    { l: 6, b: "0C9E", i: "BC9F", a: "00FF", m: ["0C9F", "0CA3", "9B06", "9AD5", "710A", "0CA2", "0C9F", "7296"] },
    { l: 6, b: "0B5B", i: "9B5C", a: "BAE6", m: ["0B5E", "4B5C", "0B62", "8000", "3A37", "0B62", "0B5E", "0B5C"] },
    { l: 6, b: "0110", i: "A115", a: "FFFF", m: ["5CB7", "A43B", "8FE4", "9CE0", "0112", "C116", "F0F0", "0115"] },
    { l: 6, b: "0A16", i: "DA1B", a: "C6C2", m: ["0A1D", "8ED1", "0A1C", "0A1C", "0A1B", "DA16", "0A1A", "8000"] },
    { l: 6, b: "0B38", i: "6B3B", a: "CE78", m: ["E2BE", "8000", "92CE", "0B3C", "A92E", "17F4", "9032", "25A9"] },
    { l: 6, b: "0512", i: "B514", a: "1AD4", m: ["0519", "0519", "3518", "0514", "0519", "D3B5", "0519", "8A2F"] },
    { l: 6, b: "09E8", i: "79EF", a: "426A", m: ["3E41", "1928", "09EC", "09E8", "4F84", "033E", "09E9", "AAAA"] },
    { l: 6, b: "020B", i: "E211", a: "C998", m: ["116C", "465C", "0211", "C0DE", "C86E", "0B73", "520D", "020D"] },
    { l: 6, b: "03B5", i: "43B6", a: "D062", m: ["E988", "03B9", "0F0F", "03BB", "B245", "7972", "FCCE", "B263"] },
    { l: 6, b: "0C78", i: "9C78", a: "FB9C", m: ["0C7E", "A40B", "C7F8", "94CF", "0C79", "A81E", "C0DE", "8CE4"] },
    { l: 6, b: "09E6", i: "99EC", a: "FB49", m: ["09ED", "09ED", "5641", "5385", "8C8F", "641C", "B9E6", "A058"] },
    { l: 6, b: "0CA8", i: "ACA9", a: "0A4D", m: ["2496", "1CAB", "3286", "0CAF", "9369", "8000", "F0F0", "36D2"] },
    { l: 6, b: "0140", i: "E145", a: "2FAD", m: ["BEF7", "0143", "0143", "0145", "0142", "D142", "0142", "6851"] },
    { l: 6, b: "0C80", i: "2C82", a: "907C", m: ["5132", "47CF", "0C80", "0C80", "8D0C", "2831", "10A2", "0C84"] },
    { l: 6, b: "0F80", i: "4F83", a: "ADE0", m: ["6FB7", "4ABF", "BA47", "C0DE", "381F", "C270", "9732", "AAA9"] },
    { l: 6, b: "0157", i: "E159", a: "FF00", m: ["F80F", "E253", "0159", "CD21", "AAAA", "7046", "015B", "00FF"] },
    { l: 6, b: "0104", i: "E104", a: "DC4A", m: ["6106", "E041", "0104", "E96A", "0001", "0001", "9C47", "A044"] },
    { l: 6, b: "0B20", i: "1B20", a: "1109", m: ["9033", "FF00", "06EB", "0B22", "0B21", "24B8", "0B21", "70FD"] },
    { l: 6, b: "0599", i: "95A0", a: "E6CE", m: ["C0DE", "D83E", "ADD3", "059B", "046F", "05A0", "6721", "D59E"] },
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

    function paintRegister(b, title, value) {
      b.paint((c, w, h) => {
        c.textBaseline = 'alphabetic';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.font = `600 ${h * 0.17}px ${FONT}`;
        c.fillText(title, w * 0.06, h * 0.28);
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

    /* — static machine: instruction register, accumulator, memory — */

    const ir = makeBlock(3.1, 1.0, 1.0, 640);
    ir.pos.set(-4.7, 2.3, 0);
    const ac = makeBlock(3.1, 1.5, 1.2, 640);
    ac.pos.set(-4.7, 0.1, 0);
    rig.add(ir.group, ac.group);
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

    /* data path between accumulator and a cell, routed behind the address path */
    function dataPath(toAccumulator, cell, z) {
      const s = toAccumulator ? leftOf(cell) : rightOf(ac);
      const e = toAccumulator ? rightOf(ac) : leftOf(cell);
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
      [ir, ac].forEach((b) => { setGlow(b, 0, 0); b.group.scale.setScalar(1); });
      paintRegister(ir, 'IR', hex(r.word));
      paintRegister(ac, 'AC', hex(r.ac0));
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
      if (r.reads) moves.push(travel(dataPath(true, target, -0.8), 680));
      if (r.writes) moves.push(travel(dataPath(false, target, -1.4), 680));
      await Promise.all(moves);
      if (!alive()) return;

      const updates = [];
      const addr = hex(r.ea);
      if (r.ac !== r.ac0) updates.push(settle(480, hex(r.ac), (t) => paintRegister(ac, 'AC', t)));
      if (r.m !== r.m0) updates.push(settle(480, hex(r.m), (t) => paintCell(target, addr, t)));
      await Promise.all(updates);
      if (!alive()) return;

      setGlow(ac, verdict.ac ? COLORS.good : COLORS.bad, 0.8);
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
    instr: $('instr'), acBefore: $('ac-before'), toast: $('toast'),
    form: $('answer'), submit: $('btn-submit'), result: $('result'),
    fieldEa: $('field-ea'), lblMem: $('lbl-mem'),
    inAc: $('in-ac'), inEa: $('in-ea'), inMem: $('in-mem'),
    sheet: $('sheet'), isa: $('btn-isa'),
  };
  const inputs = [el.inAc, el.inEa, el.inMem];

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
    const got = { ac: read(el.inAc), ea: state.showEa ? read(el.inEa) : r.ea, mem: read(el.inMem) };

    if (got.ac === null || got.ea === null || got.mem === null) {
      el.form.classList.remove('shake');
      void el.form.offsetWidth;
      el.form.classList.add('shake');
      const empty = visibleInputs().find((i) => i.value === '');
      if (empty) empty.focus();
      return;
    }

    const verdict = { ac: got.ac === r.ac, ea: got.ea === r.ea, mem: got.mem === r.m };
    const ok = verdict.ac && verdict.ea && verdict.mem;
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
    el.inAc.closest('.field').classList.add(verdict.ac ? 'good' : 'bad');
    el.inEa.closest('.field').classList.add(verdict.ea ? 'good' : 'bad');
    el.inMem.closest('.field').classList.add(verdict.mem ? 'good' : 'bad');
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
      `<span${mark(verdict.ea)}>EA <b>${hex(r.ea)}</b></span>` +
      `<span${mark(verdict.mem)}>M[${hex(r.ea)}] <b>${hex(r.m)}</b></span></div>`;
    el.result.hidden = false;
  }

  /* — events — */

  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9a-f]/gi, '').toUpperCase().slice(0, 4);
      input.closest('.field').classList.remove('bad', 'good');
      if (input.value.length === 4 && state.phase === 'answering') focusStep(input, 1);
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