import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user } = useAuth();

    if (!user) {
        // Redireciona para o login se não houver usuário autenticado
        return <Navigate to="/login" replace />;
    }

    // Renderiza o conteúdo protegido (ex: o Dashboard)
    return children;
}
