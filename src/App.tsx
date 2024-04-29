import  PlayGround  from './components/PlayGround'
import  Settings  from './components/Settings'
import {
  Route,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
} from "react-router-dom";

function App() {
  const router = createBrowserRouter(createRoutesFromElements(
    <>
        <Route
          index
          element={<PlayGround />}
        />
        <Route
          path="settings"
          element={<Settings />}
        />
    </>
  ));

  return <RouterProvider router={router} />;
}

export default App