import { Devvit } from '@devvit/public-api';
import BlockComponent = Devvit.BlockComponent
import { WordSearchGame } from '../api/api.js';

type Position = {
  x: number
  y: number
}

type CellProps = {
  p: Position
  l: string
  g: WordSearchGame
}

type BoardProps = {
  g: WordSearchGame
}

export const Cell: BlockComponent<CellProps> = (cellProps, context) => {
  return (
    <hstack
      alignment='middle center'
      padding='small'
      width={'40px'}
      height={'40px'}
      backgroundColor={cellProps.g.isSelected(cellProps.p.x, cellProps.p.y) ? 'blue' : 'white'}
      cornerRadius='small'>
      <text
        onPress={() => {
          cellProps.g.select(cellProps.p.x, cellProps.p.y)
          context.ui.showToast(`clicked on cell ${cellProps.p.x}, ${cellProps.p.y}`)
        }}
        grow
        size='large'
        alignment='middle center'
        color={cellProps.g.isSelected(cellProps.p.x, cellProps.p.y) ? 'white' : 'black' }>
        {cellProps.l}
      </text>
    </hstack>
  )
}

export const Board: BlockComponent<BoardProps> = (boardProps, _) => {
  const board = boardProps.g.board;

  return (
      <vstack
        padding="medium"
        cornerRadius="medium"
        alignment="middle center"
        grow
        gap='small'>
        {board.map((row, y) => {
          return (
            <hstack
              alignment='middle center'
              grow
              gap='small'>
              {row.map((letter, x) => {
                return (
                  <Cell p={{ x, y }} l={letter} g={boardProps.g}></Cell>
                );
              })}
            </hstack>
          );
        })}
      </vstack>
  );
}

export const App = (context: Devvit.Context): JSX.Element => {
  const game = new WordSearchGame(context);
  const boardProps = { g: game };
  return (
    <Board {...context} {...boardProps}></Board>
  )
}
