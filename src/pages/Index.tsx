import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redireciona para o dashboard (que será protegido pela autenticação)
  return <Navigate to="/" replace />;
};

export default Index;
