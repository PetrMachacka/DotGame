import React, { useEffect, useReducer, Dispatch, ReactNode } from 'react';

export type Grid = { 
    items: number[][]
    size: number;
};
const createInitialState = (size: number): Grid => ({ items: Array.from({ length: size * 2 + 1 }, () => Array(size + 1).fill(0)), size });

const initialState = createInitialState(5);

export type GridAction =
    | { type: "addToGrid"; y: number; x: number; player: number}
    | { type: "resetGrid"; size: number}
    | { type: "loadGrid"; grid: number[][]}
    | { type: "setGridSize"; size: number}

function reducer(state: Grid, action: GridAction): Grid {
    switch (action.type) {
        case 'addToGrid':
            const newGrid: Grid = { items: [...state.items], size: state.size};
            if (action.y !== undefined && action.x !== undefined) {
                newGrid.items[action.y][action.x] = action.player;
            }
            return newGrid;
        case 'resetGrid':
            return createInitialState(action.size);
                                                                                                                                    
        case 'loadGrid':
            return { ...state, items: action.grid };
        default:
            throw new Error();
    }
}

export const ListContext = React.createContext<{ state: Grid; dispatch: Dispatch<GridAction>;}>({
    state: initialState,
    dispatch: () => null,
});


export const Provider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    useEffect(() => {
        const savedGrid = localStorage.getItem('grid');
        if (savedGrid) {
            console.log("gridSaved")
            dispatch({ type: 'loadGrid', grid: JSON.parse(savedGrid) });
        }
    }, []);
    useEffect(() => {
        localStorage.setItem('grid', JSON.stringify(state.items));
        console.log("saveGrid")
    }, [state.items])
    

    return <ListContext.Provider value={{ state, dispatch}}>{children}</ListContext.Provider>;
};