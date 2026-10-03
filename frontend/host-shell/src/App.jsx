import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Shell from './pages/Shell';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  );
}
