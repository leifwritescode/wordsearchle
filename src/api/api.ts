import { Context, UseStateResult } from "@devvit/public-api";

type SelectionMode = 'none' | 'selecting' | 'selected';

export class WordSearchGame {
  private _gameData: UseStateResult<Record<string, string>>;

  private _selectionMode: UseStateResult<SelectionMode>;
  private _selectionStart: UseStateResult<[number, number]>;
  private _selectionEnd: UseStateResult<[number, number]>;

  constructor({ useState, redis, postId }: Context) {
    if (postId === undefined || postId === null) {
      throw new Error('postId is required');
    }

    this._selectionMode = useState<SelectionMode>('none');
    this._selectionStart = useState<[number, number]>([-1, -1]);
    this._selectionEnd = useState<[number, number]>([-1, -1]);

    this._gameData = useState<Record<string, string>>(async () => {
      const data = await redis.hgetall(postId)
      if (data === null || data === undefined) {
        throw new Error('No data found');
      }
      console.log(JSON.parse(data.words))
      return data
    })
  }

  select(x: number, y: number) {
    switch (this._selectionMode[0]) {
      case 'none':
        this._selectionMode[1]('selecting');
        this._selectionStart[1]([x, y]);
        break;
      case 'selecting':
        this._selectionMode[1]('selected');
        this._selectionEnd[1]([x, y]);
        break;
      case 'selected':
        this._selectionStart[1]([x, y]);
        this._selectionMode[1]('selecting');
        this._selectionEnd[1]([-1, -1]);
        break;
    }
  }

  get board(): string[][] {
    var grid = JSON.parse(this._gameData[0].grid) as string[];
    var width = Number(this._gameData[0].width);
    var height = Number(this._gameData[0].height);
    var board: string[][] = [];
    for (var y = 0; y < height; y++) {
      var row: string[] = [];
      for (var x = 0; x < width; x++) {
        row.push(grid[y * width + x]);
      }
      board.push(row);
    }
    return board;
  }

  isSelected(x: number, y: number) {
    const [startX, startY] = this._selectionStart[0];
    const [endX, endY] = this._selectionEnd[0];

    // if the start isn't set, nothing is selected
    if (startX === -1 || startY === -1) {
      return false;
    }

    // if the end isn't set, only the start is selected
    if (endX === -1 || endY === -1) {
      return startX === x && startY === y;
    }

    if (x < Math.min(startX, endX) || x > Math.max(startX, endX)) {
      return false;
    }
  
    if (y < Math.min(startY, endY) || y > Math.max(startY, endY)) {
      return false;
    }

    if (x == startX && y == startY) {
      return true;
    }

    if (x == endX && y == endY) {
      return true;
    }

    // we can use a little trig to find the answer
    return (y - startY) / (x - startX) === (endY - startY) / (endX - startX);
  }
}
