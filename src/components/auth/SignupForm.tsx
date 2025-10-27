// import { useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { countries } from '../../utils/countries';

// export const SignupForm = ({ onToggle }: { onToggle: () => void }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [country, setCountry] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { signUp } = useAuth();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       await signUp(email, password, fullName, country);
//     } catch (err: any) {
//       setError(err.message || 'Failed to create account');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-md mx-auto">
//       <div className="bg-white rounded-lg shadow-lg p-8">
//         <h2 className="text-2xl font-bold text-gray-900 mb-6">Join HMOS</h2>

//         {error && (
//           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Full Name
//             </label>
//             <input
//               type="text"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="John Doe"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Email
//             </label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="your@email.com"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Country
//             </label>
//             <select
//               value={country}
//               onChange={(e) => setCountry(e.target.value)}
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="">Select your country</option>
//               {countries.map((c) => (
//                 <option key={c} value={c}>{c}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               minLength={6}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="••••••••"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Creating account...' : 'Sign Up'}
//           </button>
//         </form>

//         <p className="mt-4 text-center text-sm text-gray-600">
//           Already have an account?{' '}
//           <button
//             onClick={onToggle}
//             className="text-blue-600 hover:text-blue-700 font-medium"
//           >
//             Sign In
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// };








import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { countries } from '../../utils/countries';

export const SignupForm = ({ onToggle }: { onToggle: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  // Sound effects
  const sounds = {
    hover: new Audio('/sounds/hover-beep.mp3'), // Placeholder: Short futuristic beep
    click: new Audio('/sounds/click.mp3'), // Placeholder: Sharp terminal click
    success: new Audio('/sounds/success.mp3'), // Placeholder: Positive chime
    error: new Audio('/sounds/error.mp3'), // Placeholder: Warning buzz
    glitch: new Audio('/sounds/glitch.mp3'), // Placeholder: Glitchy static
    typing: new Audio('/sounds/typing.mp3'), // Placeholder: Mechanical keyboard click
  };

  // Preload sounds and set volume
  useEffect(() => {
    Object.values(sounds).forEach((sound) => {
      sound.volume = 0.3; // Subtle volume
      sound.preload = 'auto';
    });
    // Play glitch sound on mount for title animation
    sounds.glitch.play().catch(() => console.log('Glitch sound blocked by browser'));
    return () => {
      Object.values(sounds).forEach((sound) => sound.pause());
    };
  }, []);

  // Handle typing sound for keypresses
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Play sound only for printable characters (letters, numbers, symbols)
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      sounds.typing.play().catch(() => console.log('Typing sound blocked by browser'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sounds.click.play().catch(() => console.log('Click sound blocked by browser'));

    try {
      await signUp(email, password, fullName, country);
      sounds.success.play().catch(() => console.log('Success sound blocked by browser'));
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      sounds.error.play().catch(() => console.log('Error sound blocked by browser'));
    } finally {
      setLoading(false);
    }
  };

  // Generate matrix characters with varied styles
  const [matrixChars, setMatrixChars] = useState<JSX.Element[]>([]);
  useEffect(() => {
    const chars = Array.from({ length: 200 }).map((_, i) => {
      const isBright = Math.random() > 0.8; // 20% chance for brighter characters
      return (
        <span
          key={i}
          className="matrix-char"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 2 + 1.5}s`,
            animationDelay: `${Math.random() * 1}s`,
            fontSize: `${Math.random() * 12 + 10}px`,
            color: isBright ? '#00ff00' : '#00cc00',
            textShadow: isBright
              ? '0 0 8px #00ff00, 0 0 12px #00ff00'
              : '0 0 4px #00cc00',
          }}
        >
          {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
        </span>
      );
    });
    setMatrixChars(chars);
  }, []);

  return (
    <>
      <style jsx>{`
        .matrix-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(180deg, rgba(10, 10, 10, 1) 0%, rgba(20, 20, 20, 0.95) 100%);
          overflow: hidden;
          z-index: -1;
        }
        .matrix-char {
          position: absolute;
          font-family: 'Courier New', monospace;
          opacity: 0.9;
          animation: fall linear infinite, flicker 0.3s infinite alternate;
        }
        @keyframes fall {
          0% {
            transform: translateY(-100vh) scale(1);
            opacity: 0.9;
          }
          50% {
            transform: translateY(0vh) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) scale(1);
            opacity: 0.3;
          }
        }
        @keyframes flicker {
          0% {
            opacity: 0.9;
          }
          100% {
            opacity: 0.5;
          }
        }
        .title-anim {
          display: inline-block;
          position: relative;
          animation: glitch 1.5s infinite;
        }
        .title-anim::before,
        .title-anim::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .title-anim::before {
          color: #ff00ff;
          animation: glitch-top 1s infinite;
          clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
        }
        .title-anim::after {
          color: #00ffff;
          animation: glitch-bottom 1.5s infinite;
          clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
        }
        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(-2px, -2px);
          }
          60% {
            transform: translate(2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
          100% {
            transform: translate(0);
          }
        }
        @keyframes glitch-top {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-3px, 1px);
          }
          40% {
            transform: translate(-1px, -1px);
          }
          60% {
            transform: translate(3px, 1px);
          }
          80% {
            transform: translate(1px, -1px);
          }
          100% {
            transform: translate(0);
          }
        }
        @keyframes glitch-bottom {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(2px, -1px);
          }
          40% {
            transform: translate(-2px, 1px);
          }
          60% {
            transform: translate(1px, -2px);
          }
          80% {
            transform: translate(-1px, 2px);
          }
          100% {
            transform: translate(0);
          }
        }
        .btn-hover {
          transition: all 0.2s ease;
          animation: pulse-glow 1.5s infinite;
        }
        .btn-hover:hover {
          text-shadow: 0 0 15px #00ff00, 0 0 25px #00ff00;
          transform: translateY(-3px) scale(1.05);
        }
        @keyframes pulse-glow {
          0% {
            box-shadow: 0 0 5px #00ff00;
          }
          50% {
            box-shadow: 0 0 15px #00ff00, 0 0 25px #00ff00;
          }
          100% {
            box-shadow: 0 0 5px #00ff00;
          }
        }
        input:focus,
        select:focus {
          box-shadow: 0 0 15px #00ff00, 0 0 25px #00ff00;
          transform: scale(1.02);
          transition: all 0.2s ease;
        }
        .error-pulse {
          animation: intense-pulse 1s infinite;
        }
        @keyframes intense-pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] w-screen h-screen">
        <div className="matrix-bg">{matrixChars}</div>
        <div className="w-full max-w-md mx-auto">
          <div className="bg-gray-900 bg-opacity-85 rounded-lg shadow-2xl p-8 border border-green-500/40">
            <h2
              className="text-2xl font-bold text-green-400 mb-6 tracking-widest font-mono title-anim"
              data-text="Join HMOS"
            >
              Join HMOS
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-900/60 border border-red-500/40 rounded text-red-400 text-sm error-pulse">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-400 mb-1 font-mono">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  required
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  placeholder="John Doe"
                  onMouseEnter={() => sounds.hover.play().catch(() => console.log('Hover sound blocked by browser'))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-400 mb-1 font-mono">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                  required
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  placeholder="your@email.com"
                  onMouseEnter={() => sounds.hover.play().catch(() => console.log('Hover sound blocked by browser'))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-400 mb-1 font-mono">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  onKeyDown={handleKeyPress}
                  required
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  onMouseEnter={() => sounds.hover.play().catch(() => console.log('Hover sound blocked by browser'))}
                >
                  <option value="">Select your country</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-400 mb-1 font-mono">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  placeholder="••••••••"
                  onMouseEnter={() => sounds.hover.play().catch(() => console.log('Hover sound blocked by browser'))}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-gray-900 py-2 px-4 rounded-lg btn-hover disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                onMouseEnter={() => sounds.hover.play().catch(() => console.log('Hover sound blocked by browser'))}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-green-400">
              Already have an account?{' '}
              <button
                onClick={() => {
                  onToggle();
                  sounds.click.play().catch(() => console.log('Click sound blocked by browser'));
                }}
                className="text-green-300 hover:text-green-200 font-medium font-mono btn-hover"
                onMouseEnter={() => sounds.hover.play().catch(() => console.log('Hover sound blocked by browser'))}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
