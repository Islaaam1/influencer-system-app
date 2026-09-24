import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#422c26] mx-auto mb-4" />
          <p className="text-slate-500">جار التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Redirect to their correct dashboard
    return <Navigate to={user.role === 'admin' ? '/admin' : '/influencer'} replace />;
  }

  return children;
}

export default ProtectedRoute;
