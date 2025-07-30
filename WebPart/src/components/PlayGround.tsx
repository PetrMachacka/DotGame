import { Board } from '../components/Board'
import { useContext} from 'react' 
import '../App.css'
import { ListContext } from '../Providers/GridProvider';
import { PlayerContext } from '../Providers/PlayerProvider'; 
import PlayerIcon from '../assets/Player.svg';
import PlayerRedIcon from '../assets/PlayerRed.svg';
import SettingsIcon from '../assets/Settings.svg';
import BotIcon from '../assets/Bot.svg';
import PlayGroundStyle from '../styles/PlayGround.module.css'
import BoardStyle from "../styles/Board.module.css";
import { Link } from 'react-router-dom';


function PlayGround() {
    const { Playerstate, Playerdispatch } = useContext(PlayerContext);
    const { state, dispatch } = useContext(ListContext);

    const handleStartAgain = () => {
        Playerdispatch({ type: 'resetScore' });
        dispatch({ type: 'resetGrid', size: state.size});
    };

    const allBlocksFilled = Playerstate.playerOneScore + Playerstate.playerTwoScore === state.size * state.size;

    const winner = Playerstate.playerOneScore > Playerstate.playerTwoScore ? 'Player 1' : 'Player 2';

    return (
        <div>
            <div className={PlayGroundStyle.scoreShowContainer}>
                <div className={PlayGroundStyle.scoreShow}>
                    <img src={PlayerRedIcon} className={`${PlayGroundStyle.Icon} ${BoardStyle.Player1text}`} alt="Player 1" />{Playerstate.playerOneScore}
                </div>
                <Link to="settings" className="settingsIcon">
                    <img src={SettingsIcon} className={`${PlayGroundStyle.SettingsIcon}`}/>
                </Link>
                <div className={PlayGroundStyle.scoreShow}>
                    {Playerstate.botOn ? (
                        <img src={BotIcon} className={`${PlayGroundStyle.Icon} ${BoardStyle.BotText}`} alt="Bot" />
                    ) : (
                        <img src={PlayerIcon} className={`${PlayGroundStyle.Icon} ${BoardStyle.Player2text}`} alt="Player 2" />
                    )}
                    {Playerstate.playerTwoScore}
                </div>
            </div>
            <div>
                <Board/>
            </div>

            {allBlocksFilled && (
                <>
                    <div className={PlayGroundStyle.startAgainButton} onClick={handleStartAgain}>
                        Start Again
                    </div>
                    <div>Winner: {winner}</div>
                </>
            )}
        </div>
    )
}

export default PlayGround