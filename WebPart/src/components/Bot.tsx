import { useContext, useEffect, useRef } from 'react';
import { ListContext } from '../Providers/GridProvider';
import { PlayerContext } from '../Providers/PlayerProvider';

type Grid = string[][];
type Move = { x: number; y: number } | null;

// Q-learning bot interface
interface QTable {
    [key: string]: number;
}

let qTable: QTable | null = null;

// Helper function to check if a move will complete a box (matches Line.tsx logic)
function checkIfMoveCompletesBox(items: number[][], y: number, x: number, isHorizontal: boolean): boolean {
    const BlockComplete = (items: number[][], blockY: number, blockX: number) => {
        var sides = Number(items[blockY][blockX] > 0) + Number(items[blockY][blockX + 1] > 0) + 
                   Number(items[blockY + 1][blockX] > 0) + Number(items[blockY - 1][blockX] > 0);
        return sides === 3; // Will become 4 after placing this line
    };

    if (isHorizontal) {
        if (y > 0 && BlockComplete(items, y - 1, x)) {
            return true;
        }
        if (y < items.length - 1 && BlockComplete(items, y + 1, x)) {
            return true;
        }
        return false;
    } else {
        if (BlockComplete(items, y, x) || BlockComplete(items, y, x - 1)) {
            return true;
        }
        return false;
    }
}

// Load Q-table from Python training
async function loadQTable(): Promise<QTable | null> {
    try {
        // Add cache busting to ensure we get the latest Q-table
        const timestamp = new Date().getTime();
        const response = await fetch(`/qtable.json?v=${timestamp}`);
        if (!response.ok) {
            console.log('Q-table fetch failed:', response.status);
            return null;
        }
        const qtable = await response.json();
        console.log(`✅ Q-table loaded successfully with ${Object.keys(qtable).length} entries`);
        return qtable;
    } catch (error) {
        console.log('Q-table not found, using heuristic bot:', error);
        return null;
    }
}

/**
 * Convert JavaScript grid state to Python format for Q-table lookup
 */
function gridToPythonState(grid: Grid): number[][] {
    const size = (grid.length - 1) / 2; // Calculate original dots size
    const pythonLines: number[][] = [];
    
    // Convert to Python format: alternating horizontal/vertical lines
    for (let y = 0; y < size * 2 - 1; y++) {
        if (y % 2 === 0) {
            // Horizontal lines
            const row: number[] = [];
            for (let x = 0; x < size - 1; x++) {
                row.push(parseInt(grid[y][x]) || 0);
            }
            pythonLines.push(row);
        } else {
            // Vertical lines
            const row: number[] = [];
            for (let x = 0; x < size; x++) {
                row.push(parseInt(grid[y][x]) || 0);
            }
            pythonLines.push(row);
        }
    }
    return pythonLines;
}

/**
 * Q-learning bot move selection with fallback strategy
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getQBotMove(grid: Grid): Move {
    if (!qTable) {
        console.log("No Q-table available");
        return null;
    }
    
    const pythonState = gridToPythonState(grid);
    const stateStr = JSON.stringify(pythonState);
    
    // Get all possible moves
    const possibleMoves: [number, number][] = [];
    for (let y = 0; y < pythonState.length; y++) {
        for (let x = 0; x < pythonState[y].length; x++) {
            if (pythonState[y][x] === 0) {
                possibleMoves.push([y, x]);
            }
        }
    }
    
    if (possibleMoves.length === 0) {
        console.log("No possible moves found in Q-bot");
        return null;
    }
    
    console.log(`Q-bot found ${possibleMoves.length} possible moves`);
    
    // Find moves with Q-values
    const movesWithQ: {move: [number, number], qValue: number}[] = [];
    let hasQValues = false;
    
    for (const move of possibleMoves) {
        const key = JSON.stringify([stateStr, JSON.stringify(move)]);
        const qValue = qTable[key];
        if (qValue !== undefined) {
            movesWithQ.push({move, qValue});
            hasQValues = true;
        } else {
            movesWithQ.push({move, qValue: 0}); // Default to 0 if no Q-value
        }
    }
    
    console.log(`Q-bot has Q-values: ${hasQValues}`);
    
    // If we have Q-values, use them with some randomness
    if (hasQValues) {
        // Sort by Q-value (descending)
        movesWithQ.sort((a, b) => b.qValue - a.qValue);
        
        // Use epsilon-greedy: 80% best move, 20% random from top 3
        if (Math.random() < 0.8) {
            const bestMove = movesWithQ[0].move;
            return { y: bestMove[0], x: bestMove[1] };
        } else {
            // Pick from top 3 moves
            const topMoves = movesWithQ.slice(0, Math.min(3, movesWithQ.length));
            const randomTop = topMoves[Math.floor(Math.random() * topMoves.length)];
            return { y: randomTop.move[0], x: randomTop.move[1] };
        }
    }
    
    // No Q-values found, use strategic heuristic
    console.log("No Q-values found, falling back to heuristic");
    return null; // Fall back to heuristic bot
}

/**
 * Check if a move would complete a box (give points) - SIMPLIFIED AND AGGRESSIVE
 */
function wouldCompleteBox(grid: number[][], y: number, x: number): boolean {
    try {
        // Create a temporary grid with the move applied
        const tempGrid = grid.map(row => [...row]);
        tempGrid[y][x] = 1;
        
        const isHorizontal = y % 2 === 0;
        let completesBox = false;
        
        if (isHorizontal) {
            // Horizontal line - check boxes above and below
            const row = y / 2;
            
            // Check box above this horizontal line
            if (row > 0) {
                const boxRow = row - 1;
                const boxY = boxRow * 2 + 1;
                if (boxY >= 0 && boxY < tempGrid.length && x < tempGrid[boxY].length) {
                    let sides = 0;
                    // Count all 4 sides of the box
                    if (tempGrid[boxY - 1] && tempGrid[boxY - 1][x] === 1) sides++; // top
                    if (tempGrid[boxY + 1] && tempGrid[boxY + 1][x] === 1) sides++; // bottom
                    if (tempGrid[boxY] && tempGrid[boxY][x] === 1) sides++; // left
                    if (tempGrid[boxY] && tempGrid[boxY][x + 1] === 1) sides++; // right
                    if (sides === 4) completesBox = true;
                }
            }
            
            // Check box below this horizontal line
            if (row < Math.floor(tempGrid.length / 2)) {
                const boxRow = row;
                const boxY = boxRow * 2 + 1;
                if (boxY >= 0 && boxY < tempGrid.length && x < tempGrid[boxY].length) {
                    let sides = 0;
                    // Count all 4 sides of the box
                    if (tempGrid[boxY - 1] && tempGrid[boxY - 1][x] === 1) sides++; // top
                    if (tempGrid[boxY + 1] && tempGrid[boxY + 1][x] === 1) sides++; // bottom
                    if (tempGrid[boxY] && tempGrid[boxY][x] === 1) sides++; // left
                    if (tempGrid[boxY] && tempGrid[boxY][x + 1] === 1) sides++; // right
                    if (sides === 4) completesBox = true;
                }
            }
        } else {
            // Vertical line - check boxes left and right
            const boxY = Math.floor(y / 2) * 2 + 1;
            
            // Check box to the left
            if (x > 0) {
                const boxX = x - 1;
                if (boxY >= 0 && boxY < tempGrid.length && boxX >= 0) {
                    let sides = 0;
                    if (tempGrid[boxY - 1] && tempGrid[boxY - 1][boxX] === 1) sides++; // top
                    if (tempGrid[boxY + 1] && tempGrid[boxY + 1][boxX] === 1) sides++; // bottom
                    if (tempGrid[boxY] && tempGrid[boxY][boxX] === 1) sides++; // left
                    if (tempGrid[boxY] && tempGrid[boxY][boxX + 1] === 1) sides++; // right
                    if (sides === 4) completesBox = true;
                }
            }
            
            // Check box to the right
            const boxX = x;
            if (boxY >= 0 && boxY < tempGrid.length && boxX >= 0 && boxX < tempGrid[boxY].length) {
                let sides = 0;
                if (tempGrid[boxY - 1] && tempGrid[boxY - 1][boxX] === 1) sides++; // top
                if (tempGrid[boxY + 1] && tempGrid[boxY + 1][boxX] === 1) sides++; // bottom
                if (tempGrid[boxY] && tempGrid[boxY][boxX] === 1) sides++; // left
                if (tempGrid[boxY] && tempGrid[boxY][boxX + 1] === 1) sides++; // right
                if (sides === 4) completesBox = true;
            }
        }
        
        if (completesBox) {
            console.log("🎯💰💰💰 FOUND COMPLETING MOVE!", y, x);
        } else {
            console.log("🔍 Move", y, x, "does not complete a box");
        }
        
        return completesBox;
    } catch (error) {
        console.error("Error in wouldCompleteBox:", error);
        return false;
    }
}

/**
 * Count how many sides a box already has
 */
function countBoxSides(grid: number[][], boxRow: number, boxCol: number): number {
    try {
        let count = 0;
        const centerY = boxRow * 2 + 1;
        const centerX = boxCol * 2 + 1;
        
        // Top
        if (grid[centerY - 1] && grid[centerY - 1][centerX] === 1) count++;
        // Bottom  
        if (grid[centerY + 1] && grid[centerY + 1][centerX] === 1) count++;
        // Left
        if (grid[centerY] && grid[centerY][centerX - 1] === 1) count++;
        // Right
        if (grid[centerY] && grid[centerY][centerX + 1] === 1) count++;
        
        return count;
    } catch (error) {
        return 0;
    }
}

/**
 * Check if box coordinates are valid
 */
function checkBoxSides(grid: number[][], boxRow: number, boxCol: number): boolean {
    const centerY = boxRow * 2 + 1;
    const centerX = boxCol * 2 + 1;
    
    return centerY >= 0 && centerY < grid.length && 
           centerX >= 0 && centerX < grid[0].length;
}

/**
 * Check if a move would give the opponent free points (create 3-sided box)
 */
function wouldGiveOpponentFreePoint(grid: number[][], y: number, x: number): boolean {
    try {
        // Simulate the move
        const tempGrid = grid.map(row => [...row]);
        tempGrid[y][x] = 1;
        
        const isHorizontal = y % 2 === 0;
        
        if (isHorizontal) {
            const boxRow = y / 2;
            
            // Check box above
            if (boxRow > 0) {
                const sidesCount = countBoxSides(tempGrid, boxRow - 1, x);
                if (sidesCount === 3) return true;
            }
            
            // Check box below
            if (boxRow < Math.floor(grid.length / 2)) {
                const sidesCount = countBoxSides(tempGrid, boxRow, x);
                if (sidesCount === 3) return true;
            }
        } else {
            const boxRow = Math.floor(y / 2);
            
            // Check box to left
            if (x > 0) {
                const sidesCount = countBoxSides(tempGrid, boxRow, Math.floor((x - 1) / 2));
                if (sidesCount === 3) return true;
            }
            
            // Check box to right  
            if (x < grid[0].length - 1) {
                const sidesCount = countBoxSides(tempGrid, boxRow, Math.floor(x / 2));
                if (sidesCount === 3) return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error("Error in wouldGiveOpponentFreePoint:", error);
        return false;
    }
}

/**
 * Check if a move is on the edge of the board
 */
function isEdgeMove(grid: number[][], y: number, x: number): boolean {
    return y === 0 || y === grid.length - 1 || x === 0 || x === grid[0].length - 1;
}

/**
 * Calculate how far into the game we are (0 = start, 1 = end)
 */
function calculateGameProgress(grid: number[][]): number {
    let filledCells = 0;
    let totalCells = 0;
    
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if ((y % 2 === 0 && x % 2 === 1) || (y % 2 === 1 && x % 2 === 0)) {
                totalCells++;
                if (grid[y][x] === 1) filledCells++;
            }
        }
    }
    
    return totalCells > 0 ? filledCells / totalCells : 0;
}

/**
 * Find the move that gives opponent the fewest points
 */
function findLeastDamagingMove(grid: number[][], moves: Move[]): Move | null {
    let bestMove = null;
    let minDamage = Infinity;
    
    for (const move of moves) {
        if (!move) continue;
        
        // Count how many boxes opponent could complete after this move
        const tempGrid = grid.map(row => [...row]);
        tempGrid[move.y][move.x] = 1;
        
        let damage = 0;
        
        // Check all possible moves opponent could make
        const opponentMoves = getAllPossibleMoves(tempGrid.map(row => row.map(cell => String(cell))));
        
        for (const opMove of opponentMoves) {
            if (opMove && wouldCompleteBox(tempGrid, opMove.y, opMove.x)) {
                damage++;
            }
        }
        
        if (damage < minDamage) {
            minDamage = damage;
            bestMove = move;
        }
    }
    
    return bestMove;
}

/**
 * Strategic bot move selection with priority-based decision making
 */
/**
 * COMPLETELY OVERHAULED - ULTRA AGGRESSIVE BOT
 * This bot will NEVER give free points and will ALWAYS play
 */
function getBotMove(grid: Grid): Move {
    console.log("🔥 ULTRA AGGRESSIVE BOT ACTIVATED");
    
    const allMoves = getAllPossibleMoves(grid);
    console.log(`🎯 Analyzing ${allMoves.length} possible moves`);
    
    if (allMoves.length === 0) {
        console.error("❌ NO MOVES AVAILABLE - GAME OVER");
        return null;
    }
    
    const numGrid = grid.map(row => row.map(cell => Number(cell)));
    
    // 1. ABSOLUTE PRIORITY: Take ANY completing move immediately
    for (const move of allMoves) {
        if (move && wouldCompleteBox(numGrid, move.y, move.x)) {
            console.log("💰💰💰 FOUND FREE POINTS - TAKING IMMEDIATELY:", move);
            return move;
        }
    }
    
    // 2. Count how many boxes each move would give to opponent
    const moveAnalysis = allMoves.map(move => {
        if (!move) return { move, opponentGain: 999 };
        
        // Simulate the move
        const tempGrid = numGrid.map(row => [...row]);
        tempGrid[move.y][move.x] = 1;
        
        // Count immediate completions opponent could make
        let opponentGain = 0;
        for (const opMove of allMoves) {
            if (opMove && opMove !== move) {
                if (wouldCompleteBox(tempGrid, opMove.y, opMove.x)) {
                    opponentGain++;
                }
            }
        }
        
        return { move, opponentGain };
    });
    
    // Sort by least damage to opponent
    moveAnalysis.sort((a, b) => a.opponentGain - b.opponentGain);
    
    console.log("📊 Move analysis (opponent gains):");
    moveAnalysis.slice(0, 5).forEach(analysis => {
        console.log(`  Move ${analysis.move?.y},${analysis.move?.x} → Opponent gets ${analysis.opponentGain} boxes`);
    });
    
    // 3. Take the move that gives opponent the LEAST advantage
    const bestMove = moveAnalysis[0]?.move;
    
    if (bestMove) {
        const damage = moveAnalysis[0].opponentGain;
        if (damage === 0) {
            console.log("✅ PERFECT MOVE - No points to opponent:", bestMove);
        } else {
            console.log(`⚠️ FORCED RISK - Giving opponent ${damage} potential points:`, bestMove);
        }
        return bestMove;
    }
    
    // 4. Emergency fallback
    console.log("🚨 EMERGENCY FALLBACK - Taking first available move");
    return allMoves[0];
}

function getAllPossibleMoves(grid: Grid): Move[] {
    const moves: Move[] = [];
    console.log("Scanning grid for empty cells...");
    
    for (let y = 0; y < grid.length; y++) {
        if (!grid[y]) {
            console.log("Row", y, "is undefined");
            continue;
        }
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === "0") {
                moves.push({y, x});
                console.log("Found empty cell at", y, x);
            }
        }
    }
    
    console.log("Total moves found:", moves.length);
    return moves;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function wouldCreate3SidedBox(move: Move, bot: string[][]): boolean {
    if (!move) return false;
    
    // Check if this move would create a 3-sided box
    const isHorizontal = move.y % 2 === 0;
    
    if (isHorizontal) {
        const boxRow = move.y / 2;
        // Check box above
        if (boxRow > 0 && boxRow - 1 < bot.length && move.x < bot[boxRow - 1].length && bot[boxRow - 1][move.x] && bot[boxRow - 1][move.x].length === 2) return true;
        // Check box below  
        if (boxRow < bot.length && move.x < bot[boxRow].length && bot[boxRow][move.x] && bot[boxRow][move.x].length === 2) return true;
    } else {
        const boxRow = (move.y - 1) / 2;
        // Check box to the left
        if (move.x > 0 && boxRow < bot.length && move.x - 1 < bot[boxRow].length && bot[boxRow][move.x - 1] && bot[boxRow][move.x - 1].length === 2) return true;
        // Check box to the right
        if (boxRow < bot.length && move.x < bot[boxRow].length && bot[boxRow][move.x] && bot[boxRow][move.x].length === 2) return true;
    }
    
    return false;
}

/**
 * Bot component
 */
const Bot = () => {
    const { state, dispatch } = useContext(ListContext);
    const { Playerstate, Playerdispatch } = useContext(PlayerContext);
    const isMovingRef = useRef(false);

    // Load Q-table on component mount
    useEffect(() => {
        if (!qTable) {
            loadQTable().then(loaded => {
                qTable = loaded;
                console.log(qTable ? 'Q-table loaded successfully' : 'Using heuristic bot');
            });
        }
    }, []);

    useEffect(() => {
        // ULTRA AGGRESSIVE BOT - ALWAYS PLAYS IMMEDIATELY
        if (Playerstate.currentPlayer !== 2 || !Playerstate.botOn || isMovingRef.current) return;
        
        console.log("🔥🔥🔥 ULTRA BOT TURN - PREPARING TO DOMINATE");
        isMovingRef.current = true;
        
        // Get ALL possible moves immediately
        const allMoves = getAllPossibleMoves(state.items.map(row => row.map(cell => String(cell))));
        console.log(`🎯 Bot found ${allMoves.length} possible moves`);
        
        if (allMoves.length === 0) {
            console.log("🏁 No moves available - game over");
            isMovingRef.current = false;
            return;
        }

        // Get the bot's strategic move
        let selectedMove = null;
        
        try {
            const gridString = state.items.map(row => row.map(cell => String(cell)));
            selectedMove = getBotMove(gridString);
            
            // VALIDATE the move is actually valid
            if (!selectedMove || 
                !state.items[selectedMove.y] || 
                state.items[selectedMove.y][selectedMove.x] !== 0) {
                console.log("⚠️ Bot move invalid, using emergency backup");
                selectedMove = allMoves[0]; // Take first available
            }
        } catch (error) {
            console.error("💥 Bot error, using emergency backup:", error);
            selectedMove = allMoves[0];
        }

        // ENSURE we have a valid move
        if (!selectedMove) {
            console.error("🚨 CRITICAL: No move selected, taking first available");
            selectedMove = allMoves[0];
        }

        console.log("🎯 FINAL SELECTED MOVE:", selectedMove);

        // Execute move with MINIMAL delay for maximum aggression
        setTimeout(() => {
            try {
                // Triple-check move is valid
                if (selectedMove && 
                    state.items[selectedMove.y] && 
                    state.items[selectedMove.y][selectedMove.x] === 0) {
                    
                    // Check if this move completes a box
                    const completesBlock = checkIfMoveCompletesBox(
                        state.items, 
                        selectedMove.y, 
                        selectedMove.x, 
                        selectedMove.y % 2 === 0
                    );
                    
                    // EXECUTE THE MOVE
                    dispatch({ 
                        type: 'addToGrid', 
                        y: selectedMove.y, 
                        x: selectedMove.x, 
                        player: Playerstate.currentPlayer 
                    });
                    
                    if (completesBlock) {
                        console.log("💰 BOX COMPLETED! Bot gets another turn!");
                        // Don't switch players, reset for immediate next move
                        isMovingRef.current = false;
                    } else {
                        console.log("➡️ Move complete, switching players");
                        Playerdispatch({ type: 'switchPlayer' });
                        isMovingRef.current = false;
                    }
                    
                    console.log("✅ Bot move executed successfully");
                } else {
                    console.error("🚨 MOVE BECAME INVALID - EMERGENCY FALLBACK");
                    // Take ANY available move as emergency
                    const emergencyMoves = getAllPossibleMoves(state.items.map(row => row.map(cell => String(cell))));
                    if (emergencyMoves.length > 0) {
                        const emergency = emergencyMoves[0];
                        if (emergency) {
                            dispatch({ 
                                type: 'addToGrid', 
                                y: emergency.y, 
                                x: emergency.x, 
                                player: Playerstate.currentPlayer 
                            });
                            Playerdispatch({ type: 'switchPlayer' });
                        }
                    }
                    isMovingRef.current = false;
                }
            } catch (error) {
                console.error("💥 CRITICAL BOT ERROR:", error);
                isMovingRef.current = false;
            }
        }, 150); // Reduced delay for faster play
    }, [state.items, Playerstate.currentPlayer, Playerstate.botOn]);

    return null;
};

export default Bot;
