/* Minesweeper+ core rules. No DOM in here so it can be tested on its own. */
(function (root) {
  'use strict';

  const HIDDEN = 0, OPEN = 1, FLAG = 2, DETONATED = 3;

  class Game {
    constructor(w, h, mines) {
      this.w = w;
      this.h = h;
      this.size = w * h;
      this.mines = Math.max(1, Math.min(mines, this.size - 1));
      this.mine = new Uint8Array(this.size);
      this.adj = new Uint8Array(this.size);
      this.state = new Uint8Array(this.size);
      this.placed = false;
      this.opened = 0;
      this.flags = 0;
      this.detonated = 0;
    }

    neighbors(i) {
      const x = i % this.w, y = (i - x) / this.w, out = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < this.w && ny >= 0 && ny < this.h) out.push(ny * this.w + nx);
        }
      }
      return out;
    }

    /* Mines are laid on the first reveal so the first click is never a mine
       and, when the board has room, opens a clear area. */
    place(safe) {
      const exclude = new Set([safe, ...this.neighbors(safe)]);
      if (this.size - exclude.size < this.mines) {
        exclude.clear();
        exclude.add(safe);
      }
      const pool = [];
      for (let i = 0; i < this.size; i++) if (!exclude.has(i)) pool.push(i);
      for (let k = 0; k < this.mines; k++) {
        const j = k + Math.floor(Math.random() * (pool.length - k));
        [pool[k], pool[j]] = [pool[j], pool[k]];
        this.mine[pool[k]] = 1;
      }
      for (let i = 0; i < this.size; i++) {
        if (this.mine[i]) continue;
        let n = 0;
        for (const j of this.neighbors(i)) n += this.mine[j];
        this.adj[i] = n;
      }
      this.placed = true;
    }

    /* Returns { changed: [indices], booms: [indices] }. */
    reveal(i) {
      const res = { changed: [], booms: [] };
      this._reveal(i, res);
      return res;
    }

    _reveal(i, res) {
      if (this.state[i] !== HIDDEN) return;
      if (!this.placed) this.place(i);
      if (this.mine[i]) {
        this.state[i] = DETONATED;
        this.detonated++;
        res.changed.push(i);
        res.booms.push(i);
        return;
      }
      const stack = [i];
      this.state[i] = OPEN;
      while (stack.length) {
        const c = stack.pop();
        this.opened++;
        res.changed.push(c);
        if (this.adj[c]) continue;
        for (const n of this.neighbors(c)) {
          if (this.state[n] === HIDDEN) {
            this.state[n] = OPEN;
            stack.push(n);
          }
        }
      }
    }

    /* Clicking an open number whose mines are all marked opens the rest. */
    chord(i) {
      const res = { changed: [], booms: [] };
      if (this.state[i] !== OPEN || !this.adj[i]) return res;
      const ns = this.neighbors(i);
      let marked = 0;
      for (const n of ns) if (this.state[n] === FLAG || this.state[n] === DETONATED) marked++;
      if (marked !== this.adj[i]) return res;
      for (const n of ns) this._reveal(n, res);
      return res;
    }

    toggleFlag(i) {
      if (this.state[i] === HIDDEN) { this.state[i] = FLAG; this.flags++; return true; }
      if (this.state[i] === FLAG) { this.state[i] = HIDDEN; this.flags--; return true; }
      return false;
    }

    get won() { return this.placed && this.opened === this.size - this.mines; }
    get minesLeft() { return this.mines - this.flags - this.detonated; }
  }

  const api = { Game, HIDDEN, OPEN, FLAG, DETONATED };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MS = api;
})(typeof window !== 'undefined' ? window : globalThis);
