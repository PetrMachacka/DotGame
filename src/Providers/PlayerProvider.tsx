import { createContext, useReducer, ReactNode, useEffect, Dispatch } from 'react';

type PlayerState = {
    botOn: boolean;
    startingPlayer: number;
    currentPlayer: number;
    playerOneScore: number;
    playerTwoScore: number;
};

type PlayerAction =
    | { type: 'switchPlayer' }
    | { type: 'incrementPlayerOneScore' }
    | { type: 'incrementPlayerTwoScore' }
    | { type: 'switchBot' }
    | { type: 'resetScore' }
    | { type: 'loadPlayer'; currentPlayer: number };

const initialState: PlayerState = {
    botOn: false,
    startingPlayer: 1,
    currentPlayer: 1,
    playerOneScore: 0,
    playerTwoScore: 0,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
        case 'switchPlayer':
            return { ...state, currentPlayer: state.currentPlayer === 1 ? 2 : 1};
        case 'incrementPlayerOneScore':
            return { ...state, playerOneScore: state.playerOneScore + 1 };
        case 'incrementPlayerTwoScore':
            return { ...state, playerTwoScore: state.playerTwoScore + 1 };
        case 'switchBot':
            return { ...state, botOn: state.botOn === false ? true : false};
        case 'resetScore':
            return { ...state, playerOneScore: 0, playerTwoScore: 0, currentPlayer: state.startingPlayer, startingPlayer: state.startingPlayer == 1 ? 2 : 1};
        case 'loadPlayer':
            return { ...state, currentPlayer: action.currentPlayer };
        default:
            return state;
    }
}

export const PlayerContext = createContext({ Playerstate: initialState, Playerdispatch: {} as Dispatch<PlayerAction> });

const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [Playerstate, Playerdispatch] = useReducer(playerReducer, initialState);

    useEffect(() => {  
        console.log(`Player One Score: ${Playerstate.playerOneScore}`);
        console.log(`Player Two Score: ${Playerstate.playerTwoScore}`);
    }, [Playerstate.playerOneScore, Playerstate.playerTwoScore]);

    useEffect(() => {
        const savedCurrentPlayer = localStorage.getItem('currentPlayer');
        if (savedCurrentPlayer) {
            Playerdispatch({ type: 'loadPlayer', currentPlayer: JSON.parse(savedCurrentPlayer) });
        }
    }, []);
    
    useEffect(() => {
        localStorage.setItem('currentPlayer', JSON.stringify(Playerstate.currentPlayer));
    }, [Playerstate.currentPlayer]);
    

    return (
        <PlayerContext.Provider value={{ Playerstate, Playerdispatch }}>
            {children}
        </PlayerContext.Provider>
    );
};

export default PlayerProvider;