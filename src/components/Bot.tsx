import { useContext, useEffect } from 'react';
import { ListContext } from '../Providers/GridProvider';
import { PlayerContext } from '../Providers/PlayerProvider';

const Bot = () => {
    const { state, dispatch } = useContext(ListContext);
    const { Playerstate, Playerdispatch: playerDispatch } = useContext(PlayerContext);
    const size = state.size;
    useEffect(() => {
        var bot: string[][] = new Array(size).fill(0).map(() => new Array(size).fill(""));
        if (Playerstate.currentPlayer === 2) {
            var BotY = 0;
            for(let y = 1; y < size * 2 + 1; y+=2) {
                for(let x = 0; x < size; x++) {
                    if (state.items[y][x]) {  
                        bot[BotY][x] += "L";
                    }
                    if (state.items[y][x + 1]) {
                        bot[BotY][x] += "R";
                    }
                    if (state.items[y + 1][x]) {
                        bot[BotY][x] += "B";
                    }
                    if (state.items[y - 1][x]) {
                        bot[BotY][x] += "T";
                    }
                }
                BotY++;
            }
            let threes: {i: number, j: number}[] = [];
            let smallest = Infinity;
            let smallestIndices: {i: number, j: number}[] = [];

            for(let i = 0; i < bot.length; i++) {
                for(let j = 0; j < bot[i].length; j++) {
                    if(bot[i][j].length === 3) {
                        threes.push({i, j});
                    }
                    if(bot[i][j].length < smallest) {
                        smallest = bot[i][j].length;
                        smallestIndices = [{i, j}];
                    } else if(bot[i][j].length === smallest) {
                        smallestIndices.push({i, j});
                    }
                }
            }
            setTimeout(() => {
                if(threes.length > 0) {
                    let randomIndex = Math.floor(Math.random() * threes.length);
                    let {i, j} = threes[randomIndex];
                    let BlockY = i * 2 + 1;
                    if(!bot[i][j].includes("L")) {
                        dispatch({ type: "addToGrid", y: BlockY, x: j, player: Playerstate.currentPlayer });
                    }
                    if(!bot[i][j].includes("R")) {
                        dispatch({ type: "addToGrid", y: BlockY, x: j + 1, player: Playerstate.currentPlayer });
                    }
                    if(!bot[i][j].includes("B")) {
                        dispatch({ type: "addToGrid", y: BlockY + 1, x: j, player: Playerstate.currentPlayer });
                    }
                    if(!bot[i][j].includes("T")) {
                        dispatch({ type: "addToGrid", y: BlockY - 1, x: j, player: Playerstate.currentPlayer });
                    }
                }
                else {
                    let randomIndex = Math.floor(Math.random() * smallestIndices.length);
                    let {i, j} = smallestIndices[randomIndex];
                    let BlockY = i * 2 + 1;
    
                    let letters = ["L", "R", "B", "T"];
                    let remainingLetters = letters.filter(letter => !bot[i][j].includes(letter));
    
                    let minSide = 4;
                    let minSides: string[] = [];
                    let chosenLetter = null;
                    for (let letter of remainingLetters) {
                        let sides = 0;
                        switch(letter) {
                            case "L":
                                if (j > 0) sides = bot[i][j - 1].length;
                                break;
                            case "R":
                                if (j < bot[i].length - 1) sides = bot[i][j + 1].length;
                                break;
                            case "B":
                                if (i < bot.length - 1) sides = bot[i + 1][j].length;
                                break;
                            case "T":
                                if (i > 0) sides = bot[i - 1][j].length;
                                break;
                        }
                        if (sides <= minSide) {
                            minSides.push(letter);
                            minSide = sides;
                            chosenLetter = letter;
                            chosenLetter = minSides[Math.floor(Math.random() * minSides.length)];
                        }
                    }
    
                    switch(chosenLetter) {
                        case "L":
                            dispatch({ type: "addToGrid", y: BlockY, x: j, player: Playerstate.currentPlayer });
                            break;
                        case "R":
                            dispatch({ type: "addToGrid", y: BlockY, x: j + 1, player: Playerstate.currentPlayer });
                            break;
                        case "B":
                            dispatch({ type: "addToGrid", y: BlockY + 1, x: j, player: Playerstate.currentPlayer });
                            break;
                        case "T":
                            dispatch({ type: "addToGrid", y: BlockY - 1, x: j, player: Playerstate.currentPlayer });
                            break;
                    }
    
                    playerDispatch({ type: 'switchPlayer' });
                }
            }, 400);
            
        }
    }, [state.items]);

    return null; 
};

export default Bot;