import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Provider } from './Providers/GridProvider.tsx'
import PlayerProvider from './Providers/PlayerProvider.tsx'


ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider>
      <PlayerProvider>
        <App/>
      </PlayerProvider>
    </Provider>,
)
