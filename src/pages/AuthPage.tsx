import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      {isLogin ? (
        <LoginForm onToggle={() => setIsLogin(false)} />
      ) : (
        <SignupForm onToggle={() => setIsLogin(true)} />
      )}
    </div>
  );
};
