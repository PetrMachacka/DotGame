import { Line } from "./Line";
import { Block } from "./Block";
import { useContext } from "react";
import BoardStyle from "../styles/Board.module.css";
import { ListContext } from '../Providers/GridProvider'
import { PlayerContext } from '../Providers/PlayerProvider'
import Bot from "./Bot";
import { useMediaQuery } from 'react-responsive'

export const Board = () => {
    const { state } = useContext(ListContext); 
    const { Playerstate } = useContext(PlayerContext);
    const Size = state.size;
    const isDesktopOrLaptop = useMediaQuery({ minWidth: 1201 });
    const isBigTablet = useMediaQuery({ minWidth: 701, maxWidth: 1200 });
    const isTabletOrMobile = useMediaQuery({ maxWidth: 700 });

    let fontSize;
    if (isDesktopOrLaptop) {
        fontSize = `${2 / state.size * 2 * 0.8}em`;
        console.log('Desktop or Laptop');
    } else if (isBigTablet) {
        fontSize = `${2 / state.size * 2 * 0.6}em`;
        console.log('Big Tablet');
    } else if (isTabletOrMobile) {
        fontSize = `${2 / state.size * 2 * 0.42}em`;
        console.log('Tablet or Mobile');
    } else {
        console.log('Default');
    }
    
    return (
        <div className={BoardStyle.BoardPadding}>
            <div className={BoardStyle.Board} style={{ fontSize }} >
                {Array.from({ length: Size * 2 + 1 }, (_, y) => (
                    <div key={y}>
                        {Boolean(y % 2) && Array.from({ length: Size + 1 }, (_, x) => (
                            <>
                                <Line key={`${x}-${y}`} x={x} y={y} direction={false} /> 
                                {x < Size && <Block key={`B${x}-${y}`} x={x} y={y} />}
                            </>
                        ))}
                        {!Boolean(y % 2) && Array.from({ length: Size }, (_, x) => (
                            <>
                                <div className={BoardStyle.Dot}></div>
                                <Line key={`${x}-${y}`} x={x} y={y} direction={true}/>
                                {x === Size - 1 && <div className={BoardStyle.Dot}></div>}
                            </>
                        ))}
                    </div>
                ))}
                {Playerstate.botOn && <Bot />}
            </div>
        </div>
    );
}