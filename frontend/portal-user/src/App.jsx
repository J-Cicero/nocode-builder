import './styles/App.css';
import AppRouter from './router';
import { AuthProvider } from './store/authStore';
import { ProjectProvider } from './store/projectStore';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProjectProvider>
          <AppRouter />
        </ProjectProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
