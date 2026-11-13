/* Texture packs. Each pack is a bag of values that become CSS custom
   properties (pageBg -> --page-bg). Anything a pack leaves out falls back
   to DEFAULTS. */
(function (root) {
  'use strict';

  const svg = (body) =>
    `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>${body}</svg>`
    )}")`;

  const CLASSIC_MINE = svg(
    "<path d='M8 1v14M1 8h14M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6' stroke='#000' stroke-width='1.3'/>" +
    "<circle cx='8' cy='8' r='4.6'/><rect x='5.8' y='5.8' width='2' height='2' fill='#fff'/>"
  );
  const CLASSIC_FLAG = svg(
    "<path d='M9 2.5v9.5' stroke='#000' stroke-width='1.3'/><path d='M9.6 2L3.5 5l6.1 3z' fill='#e00000'/>" +
    "<path d='M4 14h9v-1.5h-2.5V12h-4v.5H4z'/>"
  );

  const SYSTEM = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  const DEFAULTS = {
    pageBg: '#008080',
    text: '#ffffff',
    panelBg: '#c0c0c0',
    panelText: '#000000',
    frameShadow: 'inset 2px 2px #fff, inset -2px -2px #808080',
    accent: '#000080',
    accentText: '#ffffff',
    boardBg: 'transparent',
    boardShadow: 'none',
    boardPad: '0px',
    gap: '0px',
    radius: '0px',
    uiRadius: '0px',
    tileBg: '#c0c0c0',
    tileBgAlt: null, // defaults to tileBg
    tileShadow: 'none',
    tileHover: 'brightness(1.08)',
    openBg: '#c0c0c0',
    openBgAlt: null, // defaults to openBg
    openShadow: 'none',
    boomBg: '#ff0000',
    n1: '#0000ff', n2: '#008000', n3: '#ff0000', n4: '#000080',
    n5: '#800000', n6: '#008080', n7: '#000000', n8: '#808080',
    numGlow: 'none',
    font: 'Verdana, Tahoma, sans-serif',
    uiFont: SYSTEM,
    hudBg: '#000000',
    hudText: '#ff2a2a',
    hudFont: '"Courier New", ui-monospace, monospace',
    glyphColor: 'inherit',
    mineGlyph: '',
    flagGlyph: '',
    mineImg: 'none',
    flagImg: 'none',
  };

  const THEMES = [
    {
      id: 'classic', name: 'Classic', blurb: 'Grey bevels, red LCD',
      vars: {
        boardShadow: 'inset 3px 3px #808080, inset -3px -3px #fff',
        boardPad: '3px',
        tileShadow: 'inset 2px 2px #fff, inset -2px -2px #808080',
        openShadow: 'inset 1px 1px #808080',
        mineImg: CLASSIC_MINE, flagImg: CLASSIC_FLAG,
      },
    },
    {
      id: 'midnight', name: 'Midnight', blurb: 'Calm and dark',
      vars: {
        pageBg: '#0f1420', text: '#dbe4f5',
        panelBg: '#182033', panelText: '#dbe4f5',
        frameShadow: '0 10px 30px rgba(0,0,0,.45)',
        accent: '#6ea8fe', accentText: '#0b1220',
        gap: '3px', radius: '6px', uiRadius: '12px',
        tileBg: '#3a4a6b', tileShadow: 'inset 0 -2px rgba(0,0,0,.28)',
        openBg: '#1f2940', boomBg: '#b3364a',
        n1: '#7db7ff', n2: '#7ddc9a', n3: '#ff8a8a', n4: '#c3a0ff',
        n5: '#ffb86b', n6: '#5fd7d7', n7: '#f0f0f0', n8: '#9aa7bd',
        font: SYSTEM, hudBg: '#0f1420', hudText: '#6ea8fe',
        mineGlyph: '💣', flagGlyph: '🚩',
      },
    },
    {
      id: 'paper', name: 'Paper', blurb: 'Notebook doodle',
      vars: {
        pageBg: 'repeating-linear-gradient(#f4efe1 0 27px, #b9cbe0 27px 28px)',
        text: '#2b2b3a', panelBg: '#fffdf6', panelText: '#2b2b3a',
        frameShadow: '0 0 0 2px #2b2b3a, 5px 5px 0 #2b2b3a',
        accent: '#2b2b3a', accentText: '#fffdf6',
        radius: '2px', uiRadius: '3px',
        tileBg: 'repeating-linear-gradient(45deg, #cfc9b6 0 2px, #fffdf6 2px 7px)',
        tileShadow: 'inset 0 0 0 1px #2b2b3a',
        openBg: '#fffdf6', openShadow: 'inset 0 0 0 1px #d5cfbd', boomBg: '#f7b5ab',
        n1: '#2a52be', n2: '#2e7d32', n3: '#c0392b', n4: '#4a2c8a',
        n5: '#8d3b1f', n6: '#00796b', n7: '#2b2b3a', n8: '#777777',
        font: '"Comic Sans MS", "Bradley Hand", "Segoe Print", cursive',
        uiFont: '"Comic Sans MS", "Bradley Hand", "Segoe Print", cursive',
        hudBg: '#fffdf6', hudText: '#2b2b3a',
        hudFont: '"Comic Sans MS", "Bradley Hand", cursive',
        glyphColor: '#c0392b', mineGlyph: '✸', flagGlyph: '⚑',
      },
    },
    {
      id: 'meadow', name: 'Meadow', blurb: 'Mind the bees',
      vars: {
        pageBg: 'linear-gradient(#bfe6ff, #e4f6cf 60%)',
        text: '#23411a', panelBg: '#f7fbe9', panelText: '#23411a',
        frameShadow: '0 6px 0 #5d9438, 0 14px 24px rgba(40,80,20,.25)',
        accent: '#3f8a2a', accentText: '#ffffff', uiRadius: '14px',
        tileBg: '#93d25e', tileBgAlt: '#86c651',
        openBg: '#efdcb4', openBgAlt: '#e5cfa3', boomBg: '#f2a24b',
        n1: '#1b6fd1', n2: '#2b7a1d', n3: '#d23b2b', n4: '#6a2fb0',
        n5: '#a3531a', n6: '#0b7f86', n7: '#333333', n8: '#6d6d6d',
        font: '"Trebuchet MS", Verdana, sans-serif',
        hudBg: '#23411a', hudText: '#d8f5a2',
        mineGlyph: '🐝', flagGlyph: '🌷',
      },
    },
    {
      id: 'candy', name: 'Candy', blurb: 'Sweet and round',
      vars: {
        pageBg: 'linear-gradient(160deg, #ffd6e8, #d6e4ff)',
        text: '#7a2f57', panelBg: '#ffffff', panelText: '#7a2f57',
        frameShadow: '0 12px 30px rgba(255,105,180,.3)',
        accent: '#ff5fa8', accentText: '#ffffff',
        gap: '3px', radius: '40%', uiRadius: '22px',
        tileBg: 'linear-gradient(#ffa9d2, #ff79b9)',
        tileBgAlt: 'linear-gradient(#a9d6ff, #7dbcff)',
        tileShadow: 'inset 0 3px rgba(255,255,255,.55), inset 0 -3px rgba(0,0,0,.12)',
        openBg: '#fff1f8', boomBg: '#ffd166',
        n1: '#3d8bff', n2: '#18a66a', n3: '#ff4d6d', n4: '#8e5bff',
        n5: '#e07a00', n6: '#00a7b5', n7: '#7a2f57', n8: '#b08aa0',
        font: '"Trebuchet MS", "Comic Sans MS", sans-serif',
        hudBg: '#fff1f8', hudText: '#ff5fa8',
        mineGlyph: '🍩', flagGlyph: '🍭',
      },
    },
    {
      id: 'neon', name: 'Neon Arcade', blurb: 'Glow in the dark',
      vars: {
        pageBg:
          'linear-gradient(rgba(36,200,255,.08) 1px, transparent 1px) 0 0/32px 32px, ' +
          'linear-gradient(90deg, rgba(36,200,255,.08) 1px, transparent 1px) 0 0/32px 32px, #07030f',
        text: '#e9dcff', panelBg: '#0e0720', panelText: '#e9dcff',
        frameShadow: '0 0 0 2px #24c8ff, 0 0 28px rgba(36,200,255,.5)',
        accent: '#ff3df2', accentText: '#07030f',
        gap: '5px', radius: '4px', uiRadius: '6px', boardPad: '4px',
        tileBg: '#170b2e',
        tileShadow: 'inset 0 0 0 1.5px #ff3df2, 0 0 8px rgba(255,61,242,.6)',
        tileHover: 'brightness(1.7)',
        openBg: '#07030f', openShadow: 'inset 0 0 0 1px rgba(36,200,255,.25)',
        boomBg: '#ff2d55',
        n1: '#24c8ff', n2: '#39ff88', n3: '#ff4d6d', n4: '#c77dff',
        n5: '#ffb703', n6: '#00f5d4', n7: '#ffffff', n8: '#ff3df2',
        numGlow: '0 0 8px currentColor',
        font: '"Courier New", ui-monospace, monospace',
        uiFont: '"Courier New", ui-monospace, monospace',
        hudBg: '#07030f', hudText: '#39ff88',
        mineGlyph: '👾', flagGlyph: '⚡',
      },
    },
    {
      id: 'space', name: 'Deep Space', blurb: 'Dodge the comets',
      vars: {
        pageBg:
          'radial-gradient(1.5px 1.5px at 20px 30px, #fff, transparent), ' +
          'radial-gradient(1px 1px at 90px 120px, #cfe3ff, transparent), ' +
          'radial-gradient(1.5px 1.5px at 160px 60px, #ffe9c4, transparent), ' +
          'radial-gradient(1px 1px at 60px 170px, #fff, transparent), ' +
          'radial-gradient(ellipse at 50% 0, #2a1f5c, #05060f 70%)',
        text: '#d9e2ff', panelBg: 'rgba(20,24,48,.88)', panelText: '#d9e2ff',
        frameShadow: '0 0 0 1px #4d5a9a, 0 16px 40px rgba(0,0,0,.6)',
        accent: '#9d7bff', accentText: '#0a0b1a',
        gap: '2px', radius: '5px', uiRadius: '10px',
        tileBg: 'linear-gradient(145deg, #66779f, #3b486b)',
        tileShadow: 'inset 1px 1px rgba(255,255,255,.25), inset -1px -1px rgba(0,0,0,.35)',
        openBg: '#10152a', boomBg: '#ff7b3d',
        n1: '#7db7ff', n2: '#8ef0b0', n3: '#ff8f8f', n4: '#c9a8ff',
        n5: '#ffc46b', n6: '#6fe3e3', n7: '#ffffff', n8: '#9aa7bd',
        font: '"Trebuchet MS", Verdana, sans-serif',
        hudBg: '#05060f', hudText: '#9d7bff',
        mineGlyph: '☄️', flagGlyph: '🛸',
      },
    },
    {
      id: 'groovy', name: 'Groovy', blurb: 'Far out, wobbly',
      vars: {
        pageBg: 'linear-gradient(120deg, #ff9a3c, #ff4e88, #8a4fff, #2ec4b6, #ffd23f)',
        text: '#3a1657', panelBg: '#fff3d6', panelText: '#3a1657',
        frameShadow: '0 0 0 4px #3a1657, 8px 8px 0 #ff4e88, 16px 16px 0 #2ec4b6',
        accent: '#8a4fff', accentText: '#fff3d6',
        gap: '3px', radius: '46% 54% 50% 50% / 55% 45% 55% 45%', uiRadius: '26px',
        tileBg:
          'linear-gradient(135deg, #ff5e62, #ff9966, #ffe66d, #5ee7a0, #4facfe, #b06ab3, #ff5e62) fixed',
        tileShadow: 'inset 0 0 0 2px rgba(58,22,87,.85)',
        tileHover: 'hue-rotate(70deg) saturate(1.3)',
        openBg: '#fff3d6', boomBg: '#ff4e88',
        n1: '#2a6fdb', n2: '#1d9a55', n3: '#e63946', n4: '#8a4fff',
        n5: '#e07a00', n6: '#0f9d9a', n7: '#3a1657', n8: '#b5179e',
        font: '"Cooper Black", "Bookman Old Style", Georgia, serif',
        uiFont: '"Cooper Black", "Bookman Old Style", Georgia, serif',
        hudBg: '#3a1657', hudText: '#ffd23f',
        hudFont: '"Cooper Black", Georgia, serif',
        mineGlyph: '🍄', flagGlyph: '✌️',
      },
    },
  ];

  const kebab = (k) => '--' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

  function resolve(vars) {
    const v = Object.assign({}, DEFAULTS, vars);
    if (!v.tileBgAlt) v.tileBgAlt = v.tileBg;
    if (!v.openBgAlt) v.openBgAlt = v.openBg;
    return v;
  }

  /* Write a pack's values onto an element as CSS custom properties. */
  function applyVars(el, vars) {
    const v = resolve(vars);
    for (const k in v) {
      const val = k === 'mineGlyph' || k === 'flagGlyph' ? JSON.stringify(v[k]) : v[k];
      el.style.setProperty(kebab(k), val);
    }
  }

  const byId = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  /* Layer the player's uploaded images over a base pack. */
  function customVars(custom) {
    const v = Object.assign({}, byId(custom.base).vars);
    const img = custom.images || {};
    const cover = (d) => `url("${d}") center / cover no-repeat`;
    if (img.tile) { v.tileBg = cover(img.tile); v.tileBgAlt = v.tileBg; }
    if (img.open) { v.openBg = cover(img.open); v.openBgAlt = v.openBg; }
    if (img.mine) { v.mineImg = `url("${img.mine}")`; v.mineGlyph = ''; }
    if (img.flag) { v.flagImg = `url("${img.flag}")`; v.flagGlyph = ''; }
    if (img.bg) v.pageBg = `url("${img.bg}") center / cover no-repeat fixed`;
    return v;
  }

  root.MSThemes = { THEMES, byId, applyVars, customVars };
})(window);
