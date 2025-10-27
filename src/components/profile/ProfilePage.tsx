// import { useState, useEffect } from 'react';
// import { User, Lock, Phone, Globe, CreditCard, ArrowLeft, Bell } from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';
// import { supabase } from '../../lib/supabase';
// import { countries } from '../../utils/countries';

// interface ProfileData {
//   full_name: string;
//   country: string;
//   phone_number: string | null;
// }

// interface PaymentTransaction {
//   id: string;
//   type: string;
//   method: string;
//   amount: number;
//   status: string;
//   created_at: string;
// }

// interface Notification {
//   id: string;
//   type: string;
//   title: string;
//   message: string;
//   read: boolean;
//   created_at: string;
// }

// export const ProfilePage = ({ onBack }: { onBack: () => void }) => {
//   const { user, profile } = useAuth();
//   const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payments' | 'notifications'>('profile');

//   const [fullName, setFullName] = useState('');
//   const [country, setCountry] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');

//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   const [paymentType, setPaymentType] = useState<'deposit' | 'withdraw'>('deposit');
//   const [paymentMethod, setPaymentMethod] = useState('mpesa');
//   const [amount, setAmount] = useState('');
//   const [paymentPhone, setPaymentPhone] = useState('');
//   const [walletAddress, setWalletAddress] = useState('');
//   const [paymentEmail, setPaymentEmail] = useState('');

//   const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
//   const [notifications, setNotifications] = useState<Notification[]>([]);

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   useEffect(() => {
//     loadProfileData();
//     if (activeTab === 'payments') {
//       loadTransactions();
//     } else if (activeTab === 'notifications') {
//       loadNotifications();
//     }
//   }, [activeTab]);

//   const loadProfileData = async () => {
//     const { data } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', user?.id)
//       .maybeSingle();

//     if (data) {
//       setFullName(data.full_name || '');
//       setCountry(data.country || '');
//       setPhoneNumber(data.phone_number || '');
//     }
//   };

//   const loadTransactions = async () => {
//     const { data } = await supabase
//       .from('payment_transactions')
//       .select('*')
//       .eq('user_id', user?.id)
//       .order('created_at', { ascending: false });

//     setTransactions(data || []);
//   };

//   const loadNotifications = async () => {
//     const { data } = await supabase
//       .from('notifications')
//       .select('*')
//       .eq('user_id', user?.id)
//       .order('created_at', { ascending: false });

//     setNotifications(data || []);
//   };

//   const handleUpdateProfile = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setMessage('');

//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({
//           full_name: fullName,
//           country: country,
//           phone_number: phoneNumber,
//         })
//         .eq('id', user?.id);

//       if (error) throw error;

//       setMessage('Profile updated successfully!');
//     } catch (err: any) {
//       setError(err.message || 'Failed to update profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChangePassword = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setMessage('');

//     if (newPassword !== confirmPassword) {
//       setError('Passwords do not match');
//       setLoading(false);
//       return;
//     }

//     try {
//       const { error } = await supabase.auth.updateUser({
//         password: newPassword,
//       });

//       if (error) throw error;

//       setMessage('Password changed successfully!');
//       setCurrentPassword('');
//       setNewPassword('');
//       setConfirmPassword('');
//     } catch (err: any) {
//       setError(err.message || 'Failed to change password');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePaymentRequest = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setMessage('');

//     try {
//       const { error } = await supabase
//         .from('payment_transactions')
//         .insert({
//           user_id: user?.id,
//           type: paymentType,
//           method: paymentMethod,
//           amount: parseFloat(amount),
//           status: 'pending',
//           phone_number: paymentMethod === 'mpesa' ? paymentPhone : null,
//           wallet_address: paymentMethod === 'binance' ? walletAddress : null,
//           email: ['paypal', 'airtm'].includes(paymentMethod) ? paymentEmail : null,
//         });

//       if (error) throw error;

//       setMessage(`${paymentType === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted! Admin will process it shortly.`);
//       setAmount('');
//       setPaymentPhone('');
//       setWalletAddress('');
//       setPaymentEmail('');
//       loadTransactions();
//     } catch (err: any) {
//       setError(err.message || 'Failed to submit request');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const markNotificationRead = async (notifId: string) => {
//     await supabase
//       .from('notifications')
//       .update({ read: true })
//       .eq('id', notifId);
//     loadNotifications();
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <button
//           onClick={onBack}
//           className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
//         >
//           <ArrowLeft size={20} />
//           <span>Back to Dashboard</span>
//         </button>

//         <div className="bg-white rounded-lg shadow-lg p-8">
//           <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

//           <div className="flex space-x-4 mb-8 border-b">
//             <button
//               onClick={() => setActiveTab('profile')}
//               className={`pb-2 px-4 ${
//                 activeTab === 'profile'
//                   ? 'border-b-2 border-blue-600 text-blue-600'
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               <div className="flex items-center space-x-2">
//                 <User size={20} />
//                 <span>Profile</span>
//               </div>
//             </button>
//             <button
//               onClick={() => setActiveTab('security')}
//               className={`pb-2 px-4 ${
//                 activeTab === 'security'
//                   ? 'border-b-2 border-blue-600 text-blue-600'
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               <div className="flex items-center space-x-2">
//                 <Lock size={20} />
//                 <span>Security</span>
//               </div>
//             </button>
//             <button
//               onClick={() => setActiveTab('payments')}
//               className={`pb-2 px-4 ${
//                 activeTab === 'payments'
//                   ? 'border-b-2 border-blue-600 text-blue-600'
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               <div className="flex items-center space-x-2">
//                 <CreditCard size={20} />
//                 <span>Payments</span>
//               </div>
//             </button>
//             <button
//               onClick={() => setActiveTab('notifications')}
//               className={`pb-2 px-4 ${
//                 activeTab === 'notifications'
//                   ? 'border-b-2 border-blue-600 text-blue-600'
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               <div className="flex items-center space-x-2">
//                 <Bell size={20} />
//                 <span>Notifications</span>
//               </div>
//             </button>
//           </div>

//           {message && (
//             <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
//               {message}
//             </div>
//           )}

//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
//               {error}
//             </div>
//           )}

//           {activeTab === 'profile' && (
//             <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Full Name
//                 </label>
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Country
//                 </label>
//                 <select
//                   value={country}
//                   onChange={(e) => setCountry(e.target.value)}
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select your country</option>
//                   {countries.map((c) => (
//                     <option key={c} value={c}>{c}</option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Phone Number
//                 </label>
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   placeholder="+254 700 000000"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
//               >
//                 {loading ? 'Updating...' : 'Update Profile'}
//               </button>
//             </form>
//           )}

//           {activeTab === 'security' && (
//             <form onSubmit={handleChangePassword} className="space-y-6 max-w-2xl">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Current Password
//                 </label>
//                 <input
//                   type="password"
//                   value={currentPassword}
//                   onChange={(e) => setCurrentPassword(e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   placeholder="••••••••"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   New Password
//                 </label>
//                 <input
//                   type="password"
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   required
//                   minLength={6}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   placeholder="••••••••"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Confirm New Password
//                 </label>
//                 <input
//                   type="password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   required
//                   minLength={6}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   placeholder="••••••••"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
//               >
//                 {loading ? 'Changing...' : 'Change Password'}
//               </button>
//             </form>
//           )}

//           {activeTab === 'payments' && (
//             <div>
//               <form onSubmit={handlePaymentRequest} className="space-y-6 max-w-2xl mb-8">
//                 <div className="grid grid-cols-2 gap-4">
//                   <button
//                     type="button"
//                     onClick={() => setPaymentType('deposit')}
//                     className={`px-4 py-2 rounded-lg border-2 ${
//                       paymentType === 'deposit'
//                         ? 'border-blue-600 bg-blue-50 text-blue-600'
//                         : 'border-gray-300 text-gray-700'
//                     }`}
//                   >
//                     Deposit Funds
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setPaymentType('withdraw')}
//                     className={`px-4 py-2 rounded-lg border-2 ${
//                       paymentType === 'withdraw'
//                         ? 'border-blue-600 bg-blue-50 text-blue-600'
//                         : 'border-gray-300 text-gray-700'
//                     }`}
//                   >
//                     Withdraw Funds
//                   </button>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Payment Method
//                   </label>
//                   <select
//                     value={paymentMethod}
//                     onChange={(e) => setPaymentMethod(e.target.value)}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="mpesa">M-Pesa</option>
//                     <option value="binance">Binance</option>
//                     <option value="paypal">PayPal</option>
//                     <option value="airtm">AirTM</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Amount (USD)
//                   </label>
//                   <input
//                     type="number"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     required
//                     min="1"
//                     step="0.01"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     placeholder="100.00"
//                   />
//                 </div>

//                 {paymentMethod === 'mpesa' && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       M-Pesa Phone Number
//                     </label>
//                     <input
//                       type="tel"
//                       value={paymentPhone}
//                       onChange={(e) => setPaymentPhone(e.target.value)}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                       placeholder="+254 700 000000"
//                     />
//                   </div>
//                 )}

//                 {paymentMethod === 'binance' && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Binance Wallet Address
//                     </label>
//                     <input
//                       type="text"
//                       value={walletAddress}
//                       onChange={(e) => setWalletAddress(e.target.value)}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                       placeholder="0x..."
//                     />
//                   </div>
//                 )}

//                 {['paypal', 'airtm'].includes(paymentMethod) && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       {paymentMethod === 'paypal' ? 'PayPal' : 'AirTM'} Email
//                     </label>
//                     <input
//                       type="email"
//                       value={paymentEmail}
//                       onChange={(e) => setPaymentEmail(e.target.value)}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                       placeholder="your@email.com"
//                     />
//                   </div>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
//                 >
//                   {loading ? 'Submitting...' : `Submit ${paymentType === 'deposit' ? 'Deposit' : 'Withdrawal'} Request`}
//                 </button>
//               </form>

//               <div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h3>
//                 <div className="space-y-3">
//                   {transactions.map((tx) => (
//                     <div key={tx.id} className="bg-gray-50 rounded-lg p-4">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <p className="font-medium text-gray-900">
//                             {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} - {tx.method.toUpperCase()}
//                           </p>
//                           <p className="text-sm text-gray-600">
//                             {new Date(tx.created_at).toLocaleDateString()}
//                           </p>
//                         </div>
//                         <div className="text-right">
//                           <p className="font-bold text-gray-900">${tx.amount.toFixed(2)}</p>
//                           <span className={`text-xs px-2 py-1 rounded ${
//                             tx.status === 'completed' ? 'bg-green-100 text-green-800' :
//                             tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
//                             'bg-red-100 text-red-800'
//                           }`}>
//                             {tx.status}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                   {transactions.length === 0 && (
//                     <p className="text-center py-8 text-gray-500">No transactions yet</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === 'notifications' && (
//             <div className="space-y-3">
//               {notifications.map((notif) => (
//                 <div
//                   key={notif.id}
//                   className={`p-4 rounded-lg border ${
//                     notif.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
//                   }`}
//                   onClick={() => !notif.read && markNotificationRead(notif.id)}
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <h4 className="font-bold text-gray-900">{notif.title}</h4>
//                       <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
//                       <p className="text-xs text-gray-400 mt-2">
//                         {new Date(notif.created_at).toLocaleString()}
//                       </p>
//                     </div>
//                     {!notif.read && (
//                       <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//               {notifications.length === 0 && (
//                 <p className="text-center py-12 text-gray-500">No notifications</p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };




import { useState, useEffect } from 'react';
import { User, Lock, Phone, Globe, CreditCard, ArrowLeft, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { countries } from '../../utils/countries';
import './ProfilePage.css'; // Import the CSS file

interface ProfileData {
  full_name: string;
  country: string;
  phone_number: string | null;
}

interface PaymentTransaction {
  id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const ProfilePage = ({ onBack }: { onBack: () => void }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payments' | 'notifications'>('profile');

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [paymentType, setPaymentType] = useState<'deposit' | 'withdraw'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfileData();
    if (activeTab === 'payments') {
      loadTransactions();
    } else if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab]);

  const loadProfileData = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name || '');
      setCountry(data.country || '');
      setPhoneNumber(data.phone_number || '');
    }
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
  };

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    setNotifications(data || []);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          country: country,
          phone_number: phoneNumber,
        })
        .eq('id', user?.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user?.id,
          type: paymentType,
          method: paymentMethod,
          amount: parseFloat(amount),
          status: 'pending',
          phone_number: paymentMethod === 'mpesa' ? paymentPhone : null,
          wallet_address: paymentMethod === 'binance' ? walletAddress : null,
          email: ['paypal', 'airtm'].includes(paymentMethod) ? paymentEmail : null,
        });

      if (error) throw error;

      setMessage(`${paymentType === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted! Admin will process it shortly.`);
      setAmount('');
      setPaymentPhone('');
      setWalletAddress('');
      setPaymentEmail('');
      loadTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (notifId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    loadNotifications();
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <button onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="header-title">My Profile</h1>
        </div>
      </header>

      <div className="tabs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
        >
          <Lock size={20} />
          <span>Security</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
        >
          <CreditCard size={20} />
          <span>Payments</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          <Bell size={20} />
          <span>Notifications</span>
        </button>
      </div>

      <div className="content">
        {message && (
          <div className="message">{message}</div>
        )}
        {error && (
          <div className="error">{error}</div>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              >
                <option value="">Select your country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254 700 000000"
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}

        {activeTab === 'payments' && (
          <div>
            <form onSubmit={handlePaymentRequest} className="form">
              <div className="payment-type">
                <button
                  type="button"
                  onClick={() => setPaymentType('deposit')}
                  className={paymentType === 'deposit' ? 'active' : ''}
                >
                  Deposit Funds
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('withdraw')}
                  className={paymentType === 'withdraw' ? 'active' : ''}
                >
                  Withdraw Funds
                </button>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="binance">Binance</option>
                  <option value="paypal">PayPal</option>
                  <option value="airtm">AirTM</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  placeholder="100.00"
                />
              </div>
              {paymentMethod === 'mpesa' && (
                <div className="form-group">
                  <label>M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    required
                    placeholder="+254 700 000000"
                  />
                </div>
              )}
              {paymentMethod === 'binance' && (
                <div className="form-group">
                  <label>Binance Wallet Address</label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                    placeholder="0x..."
                  />
                </div>
              )}
              {['paypal', 'airtm'].includes(paymentMethod) && (
                <div className="form-group">
                  <label>{paymentMethod === 'paypal' ? 'PayPal' : 'AirTM'} Email</label>
                  <input
                    type="email"
                    value={paymentEmail}
                    onChange={(e) => setPaymentEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              )}
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : `Submit ${paymentType === 'deposit' ? 'Deposit' : 'Withdrawal'} Request`}
              </button>
            </form>
            <div className="transactions">
              <h3>Transaction History</h3>
              <div className="transaction-list">
                {transactions.map((tx) => (
                  <div key={tx.id} className="transaction">
                    <div>
                      <p>{tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} - {tx.method.toUpperCase()}</p>
                      <p>{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p>${tx.amount.toFixed(2)}</p>
                      <span className={tx.status.toLowerCase()}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <p>No transactions yet</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notification-list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification ${notif.read ? '' : 'unread'}`}
                onClick={() => !notif.read && markNotificationRead(notif.id)}
              >
                <div>
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <p>{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                {!notif.read && <div className="unread-dot"></div>}
              </div>
            ))}
            {notifications.length === 0 && <p>No notifications</p>}
          </div>
        )}
      </div>
    </div>
  );
};