/* hangul.js — shared Hangul core for Korean Fidget + Moa Blocks
   One source of truth for: jamo tables, Pantone jamo colors, syllable
   compose/decompose, compound-vowel and double-batchim mappings, and
   romanization. Colors and compound tables are copied from Korean Fidget
   (index.html, Oct 2026) so both apps show the same jamo the same way. */
(function (global) {
  const CHO  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  // Pantone jamo colors — identical to Korean Fidget's consonants[] / vowels[]
  const COLOR = {
    'ㄱ':'#FF4F1F','ㄴ':'#E08900','ㄷ':'#C4A800','ㄹ':'#4A9020','ㅁ':'#009880','ㅂ':'#007DBF','ㅅ':'#1C4D9E',
    'ㅇ':'#6344A0','ㅈ':'#B0005A','ㅊ':'#CC2030','ㅋ':'#E05010','ㅌ':'#008090','ㅍ':'#558800','ㅎ':'#B8005A',
    'ㅏ':'#C07800','ㅑ':'#A07000','ㅓ':'#007A65','ㅕ':'#006E5E','ㅗ':'#B02820','ㅛ':'#B84030','ㅜ':'#115899',
    'ㅠ':'#4A3090','ㅡ':'#3A6E18','ㅣ':'#A02018','ㅐ':'#A06018','ㅔ':'#887010'
  };
  // Doubled consonants wear their base consonant's color (as in Fidget)
  const BASE = {'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ','ㅒ':'ㅐ','ㅖ':'ㅔ'};
  const colorOf = j => COLOR[j] || COLOR[BASE[j]] || '#8E8E93';
  const isLight = hex => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return (r*299+g*587+b*114)/1000>150; };

  // Compound vowels and double batchim, as pairs of simple jamo
  // (same pairs as Fidget's COMPOUND_VOWEL / DOUBLE_BATCHIM tables)
  const VOWEL_PARTS = {'ㅘ':['ㅗ','ㅏ'],'ㅙ':['ㅗ','ㅐ'],'ㅚ':['ㅗ','ㅣ'],'ㅝ':['ㅜ','ㅓ'],'ㅞ':['ㅜ','ㅔ'],'ㅟ':['ㅜ','ㅣ'],'ㅢ':['ㅡ','ㅣ']};
  const JONG_PARTS  = {'ㄳ':['ㄱ','ㅅ'],'ㄵ':['ㄴ','ㅈ'],'ㄶ':['ㄴ','ㅎ'],'ㄺ':['ㄹ','ㄱ'],'ㄻ':['ㄹ','ㅁ'],'ㄼ':['ㄹ','ㅂ'],
                       'ㄽ':['ㄹ','ㅅ'],'ㄾ':['ㄹ','ㅌ'],'ㄿ':['ㄹ','ㅍ'],'ㅀ':['ㄹ','ㅎ'],'ㅄ':['ㅂ','ㅅ']};

  const VERT  = new Set([...'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ']);   // stand to the right of the consonant
  const HORIZ = new Set([...'ㅗㅛㅜㅠㅡ']);          // sit under the consonant
  const CONS  = new Set(CHO);
  // Rotating a stroke 90° clockwise: ㅏ→ㅜ→ㅓ→ㅗ→ㅏ
  const FAMILIES = [['ㅏ','ㅜ','ㅓ','ㅗ'],['ㅑ','ㅠ','ㅕ','ㅛ'],['ㅡ','ㅣ']];
  const family = v => FAMILIES.find(f => f.includes(v)) || null;
  const rotate = v => { const f = family(v); return f ? f[(f.indexOf(v)+1) % f.length] : v; };

  const isSyllable = ch => { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3; };
  function decompose(ch) {
    const c = ch.charCodeAt(0) - 0xAC00;
    return { cho: CHO[Math.floor(c/588)], jung: JUNG[Math.floor((c%588)/28)], jong: JONG[c%28] || null };
  }
  function compose(cho, jung, jong) {
    return String.fromCharCode(0xAC00 + (CHO.indexOf(cho)*21 + JUNG.indexOf(jung))*28 + (jong ? JONG.indexOf(jong) : 0));
  }
  // Break a syllable into the simple pieces a learner places, with slot roles
  function pieces(ch) {
    const t = decompose(ch), out = [{ role:'cho', j:t.cho }];
    (VOWEL_PARTS[t.jung] || [t.jung]).forEach(v => out.push({ role: VERT.has(v) ? 'jungV' : 'jungH', j:v }));
    if (t.jong) (JONG_PARTS[t.jong] || [t.jong]).forEach((c,i) => out.push({ role: 'jong'+(i+1), j:c }));
    return out;
  }

  /* Romanization (Revised Romanization, with the common sound changes:
     liaison, ㅎ drop/aspiration, nasalization, ㄹ assimilation, palatalization).
     Good for hints; check words with irregular readings by ear. */
  const RR_I = {'ㄱ':'g','ㄲ':'kk','ㄴ':'n','ㄷ':'d','ㄸ':'tt','ㄹ':'r','ㅁ':'m','ㅂ':'b','ㅃ':'pp','ㅅ':'s','ㅆ':'ss','ㅇ':'','ㅈ':'j','ㅉ':'jj','ㅊ':'ch','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'h'};
  const RR_V = {'ㅏ':'a','ㅐ':'ae','ㅑ':'ya','ㅒ':'yae','ㅓ':'eo','ㅔ':'e','ㅕ':'yeo','ㅖ':'ye','ㅗ':'o','ㅘ':'wa','ㅙ':'wae','ㅚ':'oe','ㅛ':'yo','ㅜ':'u','ㅝ':'wo','ㅞ':'we','ㅟ':'wi','ㅠ':'yu','ㅡ':'eu','ㅢ':'ui','ㅣ':'i'};
  const FINAL = {'ㄱ':'k','ㄲ':'k','ㅋ':'k','ㄳ':'k','ㄺ':'k','ㄴ':'n','ㄵ':'n','ㄶ':'n','ㄷ':'t','ㅅ':'t','ㅆ':'t','ㅈ':'t','ㅊ':'t','ㅌ':'t','ㅎ':'t',
                 'ㄹ':'l','ㄼ':'l','ㄽ':'l','ㄾ':'l','ㅀ':'l','ㅁ':'m','ㄻ':'m','ㅂ':'p','ㅍ':'p','ㄿ':'p','ㅄ':'p','ㅇ':'ng'};
  const ASP = {'ㄱ':'ㅋ','ㄷ':'ㅌ','ㅂ':'ㅍ','ㅈ':'ㅊ'};
  function romanize(word) {
    const s = [...word].map(ch => isSyllable(ch) ? decompose(ch) : null);
    if (s.some(x => !x)) return '';
    for (let i = 0; i < s.length - 1; i++) {
      const a = s[i], b = s[i+1];
      if (!a.jong) continue;
      if (b.cho === 'ㅇ' && a.jong !== 'ㅇ') {                       // liaison
        if (a.jong === 'ㅎ') { a.jong = null; continue; }
        const parts = JONG_PARTS[a.jong];
        let moving = parts ? parts[1] : a.jong;
        a.jong = parts ? parts[0] : null;
        if (moving === 'ㅎ') continue;
        if (b.jung === 'ㅣ' && moving === 'ㄷ') moving = 'ㅈ';
        if (b.jung === 'ㅣ' && moving === 'ㅌ') moving = 'ㅊ';
        b.cho = moving; continue;
      }
      if ((a.jong === 'ㅎ' || a.jong === 'ㄶ' || a.jong === 'ㅀ') && ASP[b.cho]) {   // ㅎ + ㄱㄷㅈ
        b.cho = ASP[b.cho]; a.jong = a.jong === 'ㅎ' ? null : JONG_PARTS[a.jong][0]; continue;
      }
      const f = FINAL[a.jong];
      if (b.cho === 'ㅎ') continue;                                    // nouns keep the h: 축하 chukha
      if (b.cho === 'ㄴ' || b.cho === 'ㅁ') {                          // nasalization
        if (f === 'k') a.jong = 'ㅇ'; else if (f === 't') a.jong = 'ㄴ'; else if (f === 'p') a.jong = 'ㅁ';
        if (f === 'l' && b.cho === 'ㄴ') b.cho = 'ㄹ';
        continue;
      }
      if (b.cho === 'ㄹ') {
        if (f === 'n') a.jong = 'ㄹ';
        else if (f === 'm' || f === 'ng') b.cho = 'ㄴ';
        else if (f === 'k') { a.jong = 'ㅇ'; b.cho = 'ㄴ'; }
        else if (f === 'p') { a.jong = 'ㅁ'; b.cho = 'ㄴ'; }
      }
    }
    let out = '';
    s.forEach((x, i) => {
      let ini = RR_I[x.cho];
      if (x.cho === 'ㄹ' && i > 0 && s[i-1].jong && FINAL[s[i-1].jong] === 'l') ini = 'l';
      out += ini + RR_V[x.jung] + (x.jong ? FINAL[x.jong] : '');
    });
    return out;
  }

  global.Hangul = { CHO, JUNG, JONG, COLOR, colorOf, isLight, VOWEL_PARTS, JONG_PARTS, VERT, HORIZ, CONS,
                    FAMILIES, family, rotate, isSyllable, decompose, compose, pieces, romanize };
})(window);
