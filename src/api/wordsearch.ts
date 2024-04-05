/**
 * Adapted from https://github.com/sbj42/word-search-generator
 */

import { RedisClient } from "@devvit/public-api";

const defaultMinLength = 3;
const defaultSize = 10;
const effort = 10000;

interface ConstructorParameters {
  make?: GenerationParameters
  from?: WordSearchParameters
}

interface GenerationParameters {
  width: number
  height: number
  minLength: number
  maxLength: number
  dictionary: string[]
  diagonals?: boolean
}

interface WordSearchParameters {
  width: number
  height: number
  words: string[]
  grid: string[]
}

export class WordSearch  {
  // for pre-generated grids
  private _width: number = -1
  private _height: number = -1
  private _words: string[] = []
  private _grid: string[] = []

  // for newly generated grids
  private _used: string[] = [];
  private _usedMap: {[s: string]: boolean} = {};

  constructor({ make, from }: ConstructorParameters) {
    if (make !== undefined && from === undefined) {
      this.generate(make)
    } else if (make === undefined && from !== undefined) {
      this._width = from.width
      this._height = from.height
      this._words = from.words
      this._grid = from.grid
    } else {
      throw new Error('WordSearch must be constructed with either a generation or loaded parameter, but not both.')
    }
  }

  async save(key: string, redis: RedisClient) {
    const result = await redis.hset(key, {
      width: `${this._width}`,
      height: `${this._height}`,
      words: JSON.stringify(this._words),
      grid: JSON.stringify(this._grid)
    })

    if (result !== 4) {
      throw new Error(`Something went wrong saving the generated wordsearch. Expected 4 fields, but got ${result}.`)
    }
  }

  static async load(key: string, redis: RedisClient): Promise<WordSearch> {
    const result = await redis.hgetall(key)
    if (result === null || result === undefined) {
      throw new Error(`No wordsearch found with key ${key}.`)
    }

    const width = parseInt(result.width)
    const height = parseInt(result.height)
    const words = JSON.parse(result.words)
    const grid = JSON.parse(result.grid)

    return new WordSearch({ from: { width, height, words, grid } })
  }

  get words(): string[] {
    return this._words
  }

  get(x: number, y: number): string {
    return this._grid[y * this._width + x]
  }

  toString(): string {
    let result = ''
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        result += this._grid[y * this._width + x] + ' '
      }
      result += '\n'
    }
    return result
  }

  private set(x: number, y: number, value: string) {
    this._grid[y * this._width + x] = value
  }

  private wordFitsInGrid(x: number, y: number, dx: number, dy: number, word: string): boolean {
    var ok = false;
    for (var i = 0; i < word.length; i++) {
        var l = word[i].toUpperCase();
        if (x < 0 || y < 0 || x >= this._width || y >= this._height)
            return false;
        var cur = this.get(x, y);
        if (cur != ' ' && cur != l)
            return false;
        if (cur == ' ')
            ok = true;
        x += dx;
        y += dy;
    }
    return ok;
  }

  private putWordInGrid(x: number, y: number, dx: number, dy: number, word: string) {
    for (var i = 0; i < word.length; i++) {
      var l = word[i].toUpperCase();
      this.set(x, y, l);
      x += dx;
      y += dy;
    }

    this._used.push(word);
    this._usedMap[word] = true;
  }

  private generate(options: GenerationParameters): void {
    let { width, height, minLength, maxLength, dictionary, diagonals } = options

    if (diagonals === undefined || diagonals === null) {
      diagonals = true
    }

    const validWordsInDictionary = dictionary.filter((word) => {
      return word.length >= minLength && word.length <= maxLength
    })

    var used: string[] = [];
    var usedMap: {[s: string]: boolean} = {};

    let grid: string[] = []
    for (let i = 0; i < width * height; i++) {
      grid.push(' ')
    }

    var dxs;
    var dys;
    if (diagonals) {
        dxs = [0, 1, 1, 1, 0, -1, -1, -1];
        dys = [-1, -1, 0, 1, 1, 1, 0, -1];
    }
    else {
        dxs = [0, 1, 0, -1];
        dys = [-1, 0, 1, 0];
    }
  
    for (var i = 0; i < width * height * effort; i++) {
      if (used.length == validWordsInDictionary.length)
          break;
      var word = validWordsInDictionary[WordSearch.nextInt(validWordsInDictionary.length)];
      if (usedMap[word])
          continue;
      var x = WordSearch.nextInt(width);
      var y = WordSearch.nextInt(height);
      var d = WordSearch.nextInt(dxs.length);
      var dx = dxs[d];
      var dy = dys[d];
      if (this.wordFitsInGrid(x, y, dx, dy, word))
        this.putWordInGrid(x, y, dx, dy, word);
    }
    
    for (var i = 0; i < grid.length; i++) {
      if (grid[i] == ' ')
        grid[i] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[WordSearch.nextInt(26)];
    }
    used.sort();
  }

  private static nextInt(max: number): number {
    return Math.floor(Math.random() * max)
  }
}
