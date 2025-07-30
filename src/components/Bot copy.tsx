import { useContext, useEffect } from 'react';
import { ListContext } from '../Providers/GridProvider';
import { PlayerContext } from '../Providers/PlayerProvider';

type Grid = string[][];
type Move = { x: number; y: number } | null;

/**
 * Decide the bot move based on current grid state.
 * This is the pure logic part that can be replaced by AI later.
 */
function getBotMove(grid: Grid, currentPlayer: number): Move {
    const size = (grid.length - 1) / 2; // Because your grid includes lines
    const bot: string[][] = Array.from({ length: size }, () => Array(size).fill(''));

    // Fill bot array with info about surrounding sides (L,R,T,B)
    let BotY = 0;
    for (let y = 1; y < size * 2 + 1; y += 2) {
        for (let x = 0; x < size; x++) {
            if (grid[y][x]) bot[BotY][x] += 'L';
            if (grid[y][x + 1]) bot[BotY][x] += 'R';
            if (grid[y + 1][x]) bot[BotY][x] += 'B';
            if (grid[y - 1][x]) bot[BotY][x] += 'T';
        }
        BotY++;
    }

    // Find cells with 3 sides filled (scoring moves)
    const threes: { i: number; j: number }[] = [];
    let smallest = Infinity;
    let smallestIndices: { i: number; j: number }[] = [];

    for (let i = 0; i < bot.length; i++) {
        for (let j = 0; j < bot[i].length; j++) {
            if (bot[i][j].length === 3) threes.push({ i, j });

            if (bot[i][j].length < smallest) {
                smallest = bot[i][j].length;
                smallestIndices = [{ i, j }];
            } else if (bot[i][j].length === smallest) {
                smallestIndices.push({ i, j });
            }
        }
    }

    // If there is a scoring move, take it
    if (threes.length > 0) {
        const { i, j } = threes[Math.floor(Math.random() * threes.length)];
        return getRandomMissingSide(bot, i, j, size);
    }

    // Otherwise pick a move from the least occupied cells
    const { i, j } = smallestIndices[Math.floor(Math.random() * smallestIndices.length)];
    return getStrategicSide(bot, i, j, size);
}

/**
 * Pick a missing side for a cell
 */
function getRandomMissingSide(bot: string[][], i: number, j: number, size: number): Move {
    const BlockY = i * 2 + 1;
    const letters = ['L', 'R', 'B', 'T'];
    const remaining = letters.filter(letter => !bot[i][j].includes(letter));

    const choice = remaining[Math.floor(Math.random() * remaining.length)];
    switch (choice) {
        case 'L': return { y: BlockY, x: j };
        case 'R': return { y: BlockY, x: j + 1 };
        case 'B': return { y: BlockY + 1, x: j };
        case 'T': return { y: BlockY - 1, x: j };
        default: return null;
    }
}

/**
 * Choose a strategic side minimizing opponent advantage
 */
function getStrategicSide(bot: string[][], i: number, j: number, size: number): Move {
    const BlockY = i * 2 + 1;
    const letters = ['L', 'R', 'B', 'T'];
    const remaining = letters.filter(letter => !bot[i][j].includes(letter));

    // Pick side with neighbor with fewest sides to avoid giving easy 3
    let minSide = 4;
    let candidates: string[] = [];
    for (const letter of remaining) {
        let sides = 0;
        switch (letter) {
            case 'L': if (j > 0) sides = bot[i][j - 1].length; break;
            case 'R': if (j < bot[i].length - 1) sides = bot[i][j + 1].length; break;
            case 'B': if (i < bot.length - 1) sides = bot[i + 1][j].length; break;
            case 'T': if (i > 0) sides = bot[i - 1][j].length; break;
        }

        if (sides <= minSide) {
            minSide = sides;
            candidates.push(letter);
        }
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    switch (chosen) {
        case 'L': return { y: BlockY, x: j };
        case 'R': return { y: BlockY, x: j + 1 };
        case 'B': return { y: BlockY + 1, x: j };
        case 'T': return { y: BlockY - 1, x: j };
        default: return null;
    }
}

/**
 * Bot component
 */
const Bot = () => {
    const { state, dispatch } = useContext(ListContext);
    const { Playerstate, Playerdispatch } = useContext(PlayerContext);

    useEffect(() => {
        if (Playerstate.currentPlayer !== 2) return;

        const move = getBotMove(state.items, Playerstate.currentPlayer);

        if (move) {
            setTimeout(() => {
                dispatch({ type: 'addToGrid', y: move.y, x: move.x, player: Playerstate.currentPlayer });
                Playerdispatch({ type: 'switchPlayer' });

                // Optional: Log for AI dataset
                const logs = JSON.parse(localStorage.getItem('game_logs') || '[]');
                logs.push({ grid: state.items, move, player: 2 });
                localStorage.setItem('game_logs', JSON.stringify(logs));
            }, 400);
        }
    }, [state.items, Playerstate.currentPlayer]);

    return null;
};

export default Bot;
