/**
 * Adapted from https://github.com/sbj42/word-search-generator
 */

import { RedisClient } from "@devvit/public-api";

const defaultMinLength = 3;
const defaultSize = 10;
const effort = 10000;

interface GenerationOptions {
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
  private _width: number
  private _height: number
  private _words: string[]
  private _grid: string[]

  constructor({ width, height, words, grid }: WordSearchParameters) {
      this._width = width
      this._height = height
      this._words = words
      this._grid = grid
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

    return new WordSearch({ width, height, words, grid })
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
}

export function generateWordSearch(options: GenerationOptions): WordSearch {
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

  function rand(max: number): number {
    return Math.floor(Math.random() * max)
  }
  
  function get(x: number, y: number): string {
    return grid[y * width + x]
  }
  
  function set(x: number, y: number, value: string) {
    grid[y * width + x] = value
  }
  
  function wordFits(x: number, y: number, dx: number, dy: number, word: string): boolean {
    var ok = false;
    for (var i = 0; i < word.length; i++) {
        var l = word[i].toUpperCase();
        if (x < 0 || y < 0 || x >= width || y >= height)
            return false;
        var cur = get(x, y);
        if (cur != ' ' && cur != l)
            return false;
        if (cur == ' ')
            ok = true;
        x += dx;
        y += dy;
    }
    return ok;
  }
  
  function putWord(x: number, y: number, dx: number, dy: number, word: string) {
    for (var i = 0; i < word.length; i++) {
      var l = word[i].toUpperCase();
      set(x, y, l);
      x += dx;
      y += dy;
    }
  
    used.push(word);
    usedMap[word] = true;
  }

  for (var i = 0; i < width * height * effort; i++) {
    if (used.length == validWordsInDictionary.length)
        break;
    var word = validWordsInDictionary[rand(validWordsInDictionary.length)];
    if (usedMap[word])
        continue;
    var x = rand(width);
    var y = rand(height);
    var d = rand(dxs.length);
    var dx = dxs[d];
    var dy = dys[d];
    if (wordFits(x, y, dx, dy, word))
      putWord(x, y, dx, dy, word);
  }
  
  for (var i = 0; i < grid.length; i++) {
    if (grid[i] == ' ')
      grid[i] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[rand(26)];
  }
  used.sort();

  return new WordSearch({
    width,
    height,
    words: used,
    grid
  })
}
