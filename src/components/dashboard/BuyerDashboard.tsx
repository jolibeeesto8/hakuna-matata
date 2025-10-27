// import { useState, useEffect } from 'react';
// import { ShoppingBag, Briefcase, Package, Plus } from 'lucide-react';
// import { supabase } from '../../lib/supabase';
// import { useAuth } from '../../contexts/AuthContext';
// import { DigitalAsset, Product, JobPosting, EscrowTransaction } from '../../types';
// import './BuyerDashboard.css'; // Import the CSS file

// export const BuyerDashboard = () => {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState<'browse' | 'purchases' | 'jobs'>('browse');
//   const [assets, setAssets] = useState<DigitalAsset[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [myPurchases, setMyPurchases] = useState<EscrowTransaction[]>([]);
//   const [myJobs, setMyJobs] = useState<JobPosting[]>([]);
//   const [showJobForm, setShowJobForm] = useState(false);

//   useEffect(() => {
//     loadData();
//   }, [activeTab]);

//   const loadData = async () => {
//     if (activeTab === 'browse') {
//       const { data: assetsData } = await supabase
//         .from('digital_assets')
//         .select('*')
//         .eq('status', 'approved')
//         .order('created_at', { ascending: false });
//       setAssets(assetsData || []);

//       const { data: productsData } = await supabase
//         .from('products')
//         .select('*')
//         .eq('status', 'active')
//         .order('created_at', { ascending: false });
//       setProducts(productsData || []);
//     } else if (activeTab === 'purchases') {
//       const { data } = await supabase
//         .from('escrow_transactions')
//         .select('*')
//         .eq('buyer_id', user?.id)
//         .order('created_at', { ascending: false });
//       setMyPurchases(data || []);
//     } else if (activeTab === 'jobs') {
//       const { data } = await supabase
//         .from('job_postings')
//         .select('*')
//         .eq('buyer_id', user?.id)
//         .order('created_at', { ascending: false });
//       setMyJobs(data || []);
//     }
//   };

//   const handleBuyAsset = async (asset: DigitalAsset) => {
//     const commission = asset.price * 0.10;

//     const { error } = await supabase
//       .from('escrow_transactions')
//       .insert({
//         buyer_id: user?.id,
//         seller_id: asset.seller_id,
//         reference_type: 'asset',
//         reference_id: asset.id,
//         amount: asset.price,
//         commission: commission,
//         status: 'active',
//       });

//     if (!error) {
//       alert('Purchase initiated! Transaction is now in escrow.');
//       loadData();
//     } else {
//       alert('Failed to initiate purchase');
//     }
//   };

//   const handleBuyProduct = async (product: Product) => {
//     const commission = product.price * 0.10;

//     const { error } = await supabase
//       .from('escrow_transactions')
//       .insert({
//         buyer_id: user?.id,
//         seller_id: product.seller_id,
//         reference_type: 'product',
//         reference_id: product.id,
//         amount: product.price,
//         commission: commission,
//         status: 'active',
//       });

//     if (!error) {
//       alert('Purchase initiated! Transaction is now in escrow.');
//       loadData();
//     } else {
//       alert('Failed to initiate purchase');
//     }
//   };

//   const [jobTitle, setJobTitle] = useState('');
//   const [jobDescription, setJobDescription] = useState('');
//   const [jobBudget, setJobBudget] = useState('');
//   const [jobCategory, setJobCategory] = useState('');

//   const handlePostJob = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const { error } = await supabase
//       .from('job_postings')
//       .insert({
//         buyer_id: user?.id,
//         title: jobTitle,
//         description: jobDescription,
//         budget: parseFloat(jobBudget),
//         category: jobCategory,
//         status: 'open',
//       });

//     if (!error) {
//       alert('Job posted successfully!');
//       setShowJobForm(false);
//       setJobTitle('');
//       setJobDescription('');
//       setJobBudget('');
//       setJobCategory('');
//       loadData();
//     } else {
//       alert('Failed to post job');
//     }
//   };

//   return (
//     <div className="buyer-dashboard-container">
//       <header className="buyer-dashboard-header">
//         <div className="header-content" />
//       </header>

//       <div className="tabs">
//         <button
//           onClick={() => setActiveTab('browse')}
//           className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
//         >
//           <Package size={20} />
//           <span>Browse Marketplace</span>
//         </button>
//         <button
//           onClick={() => setActiveTab('purchases')}
//           className={`tab-button ${activeTab === 'purchases' ? 'active' : ''}`}
//         >
//           <ShoppingBag size={20} />
//           <span>My Purchases</span>
//         </button>
//         <button
//           onClick={() => setActiveTab('jobs')}
//           className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
//         >
//           <Briefcase size={20} />
//           <span>My Job Postings</span>
//         </button>
//       </div>

//       <div className="content">
//         {activeTab === 'browse' && (
//           <div>
//             <h2 className="section-title">Digital Assets</h2>
//             <div className="grid">
//               {assets.map((asset, index) => (
//                 <div key={asset.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
//                   <h3>{asset.title}</h3>
//                   <p>{asset.description}</p>
//                   <div className="card-footer">
//                     <span>${asset.price}</span>
//                     <button onClick={() => handleBuyAsset(asset)}>Buy Now</button>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <h2 className="section-title">Products</h2>
//             <div className="grid">
//               {products.map((product, index) => (
//                 <div key={product.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
//                   <img src={product.image_url_1} alt={product.product_name} className="card-image" />
//                   <h3>{product.product_name}</h3>
//                   <p>{product.subject}</p>
//                   <p>{product.country}</p>
//                   <div className="card-footer">
//                     <span>${product.price}</span>
//                     <button onClick={() => handleBuyProduct(product)}>Buy Now</button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {activeTab === 'purchases' && (
//           <div>
//             <h2 className="section-title">My Purchases</h2>
//             <div className="purchase-list">
//               {myPurchases.map((purchase, index) => (
//                 <div key={purchase.id} className="purchase-card" style={{ animationDelay: `${index * 0.1}s` }}>
//                   <div>
//                     <p>Transaction ID: {purchase.id}</p>
//                     <p>Amount: ${purchase.amount}</p>
//                     <p>Commission: ${purchase.commission}</p>
//                     <p>Type: {purchase.reference_type}</p>
//                   </div>
//                   <span className={purchase.status.toLowerCase()}>
//                     {purchase.status}
//                   </span>
//                 </div>
//               ))}
//               {myPurchases.length === 0 && <p className="no-items">No purchases yet</p>}
//             </div>
//           </div>
//         )}

//         {activeTab === 'jobs' && (
//           <div>
//             <div className="job-header">
//               <h2 className="section-title">My Job Postings</h2>
//               <button onClick={() => setShowJobForm(!showJobForm)} className="post-job-button">
//                 <Plus size={20} />
//                 <span>Post New Job</span>
//               </button>
//             </div>

//             {showJobForm && (
//               <div className="job-form">
//                 <h3 className="form-title">Post a New Job</h3>
//                 <form onSubmit={handlePostJob} className="job-form-content">
//                   <div className="form-group">
//                     <label>Title</label>
//                     <input
//                       type="text"
//                       value={jobTitle}
//                       onChange={(e) => setJobTitle(e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="form-group">
//                     <label>Description</label>
//                     <textarea
//                       value={jobDescription}
//                       onChange={(e) => setJobDescription(e.target.value)}
//                       required
//                       rows={4}
//                     />
//                   </div>
//                   <div className="form-group">
//                     <label>Category</label>
//                     <input
//                       type="text"
//                       value={jobCategory}
//                       onChange={(e) => setJobCategory(e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="form-group">
//                     <label>Budget ($)</label>
//                     <input
//                       type="number"
//                       value={jobBudget}
//                       onChange={(e) => setJobBudget(e.target.value)}
//                       required
//                       min="0"
//                       step="0.01"
//                     />
//                   </div>
//                   <button type="submit">Post Job</button>
//                 </form>
//               </div>
//             )}

//             <div className="job-list">
//               {myJobs.map((job, index) => (
//                 <div key={job.id} className="job-card" style={{ animationDelay: `${index * 0.1}s` }}>
//                   <div>
//                     <h3>{job.title}</h3>
//                     <p>{job.description}</p>
//                     <p>Budget: ${job.budget}</p>
//                   </div>
//                   <span className={job.status.toLowerCase()}>
//                     {job.status}
//                   </span>
//                 </div>
//               ))}
//               {myJobs.length === 0 && <p className="no-items">No job postings yet</p>}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };



import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Briefcase, Package, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DigitalAsset, Product, JobPosting, EscrowTransaction } from '../../types';
import './BuyerDashboard.css';

// Sound file for typing effect (replace with your own audio file)
const typingSound = new Audio('/sounds/typing.mp3'); // Ensure you have a typing sound file in your project

export const BuyerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'purchases' | 'jobs'>('browse');
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [myPurchases, setMyPurchases] = useState<EscrowTransaction[]>([]);
  const [myJobs, setMyJobs] = useState<JobPosting[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const matrixRainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    setupMatrixRain();
    setupTypingSound();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'browse') {
      const { data: assetsData } = await supabase
        .from('digital_assets')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      setAssets(assetsData || []);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setProducts(productsData || []);
    } else if (activeTab === 'purchases') {
      const { data } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });
      setMyPurchases(data || []);
    } else if (activeTab === 'jobs') {
      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });
      setMyJobs(data || []);
    }
  };

  const setupMatrixRain = () => {
    const matrixRain = matrixRainRef.current;
    if (!matrixRain) return;

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const createRainChar = () => {
      const char = document.createElement('span');
      char.className = 'rain-char';
      char.textContent = characters[Math.floor(Math.random() * characters.length)];
      char.style.left = `${Math.random() * 100}vw`;
      char.style.animationDuration = `${Math.random() * 5 + 5}s`; // 5-10s fall duration
      matrixRain.appendChild(char);

      setTimeout(() => char.remove(), 10000); // Remove after 10s
    };

    // Create 50-100 rain characters
    const charCount = Math.floor(Math.random() * 50 + 50);
    for (let i = 0; i < charCount; i++) {
      setTimeout(createRainChar, Math.random() * 2000);
    }

    // Continuously add new characters
    const interval = setInterval(createRainChar, 100);
    return () => clearInterval(interval);
  };

  const setupTypingSound = () => {
    const elements = document.querySelectorAll('.section-title, .card h3, .card p, .purchase-card p, .job-card h3, .job-card p, .no-items, .form-title');
    elements.forEach((el) => {
      const animationDuration = parseFloat(getComputedStyle(el).animationDuration) * 1000; // Convert to ms
      const steps = parseInt(getComputedStyle(el).animationTimingFunction.match(/steps\((\d+)/)?.[1] || '30');
      const interval = animationDuration / steps;

      const playSound = () => {
        typingSound.currentTime = 0; // Reset sound
        typingSound.play().catch(() => {}); // Handle autoplay restrictions
      };

      for (let i = 0; i < steps; i++) {
        setTimeout(playSound, i * interval);
      }
    });
  };

  const handleBuyAsset = async (asset: DigitalAsset) => {
    const commission = asset.price * 0.10;

    const { error } = await supabase
      .from('escrow_transactions')
      .insert({
        buyer_id: user?.id,
        seller_id: asset.seller_id,
        reference_type: 'asset',
        reference_id: asset.id,
        amount: asset.price,
        commission: commission,
        status: 'active',
      });

    if (!error) {
      alert('Purchase initiated! Transaction is now in escrow.');
      loadData();
    } else {
      alert('Failed to initiate purchase');
    }
  };

  const handleBuyProduct = async (product: Product) => {
    const commission = product.price * 0.10;

    const { error } = await supabase
      .from('escrow_transactions')
      .insert({
        buyer_id: user?.id,
        seller_id: product.seller_id,
        reference_type: 'product',
        reference_id: product.id,
        amount: product.price,
        commission: commission,
        status: 'active',
      });

    if (!error) {
      alert('Purchase initiated! Transaction is now in escrow.');
      loadData();
    } else {
      alert('Failed to initiate purchase');
    }
  };

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobCategory, setJobCategory] = useState('');

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('job_postings')
      .insert({
        buyer_id: user?.id,
        title: jobTitle,
        description: jobDescription,
        budget: parseFloat(jobBudget),
        category: jobCategory,
        status: 'open',
      });

    if (!error) {
      alert('Job posted successfully!');
      setShowJobForm(false);
      setJobTitle('');
      setJobDescription('');
      setJobBudget('');
      setJobCategory('');
      loadData();
    } else {
      alert('Failed to post job');
    }
  };

  return (
    <div className="buyer-dashboard-container">
      <header className="buyer-dashboard-header">
        <div className="header-content" />
      </header>

      <div className="matrix-rain" ref={matrixRainRef}></div>

      <div className="tabs">
        <button
          onClick={() => setActiveTab('browse')}
          className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
        >
          <Package size={20} />
          <span>Browse Marketplace</span>
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`tab-button ${activeTab === 'purchases' ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span>My Purchases</span>
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
        >
          <Briefcase size={20} />
          <span>My Job Postings</span>
        </button>
      </div>

      <div className="content">
        {activeTab === 'browse' && (
          <div>
            <h2 className="section-title">Digital Assets</h2>
            <div className="grid">
              {assets.map((asset, index) => (
                <div key={asset.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3>{asset.title}</h3>
                  <p>{asset.description}</p>
                  <div className="card-footer">
                    <span>${asset.price}</span>
                    <button onClick={() => handleBuyAsset(asset)}>Buy Now</button>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="section-title">Products</h2>
            <div className="grid">
              {products.map((product, index) => (
                <div key={product.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <img src={product.image_url_1} alt={product.product_name} className="card-image" />
                  <h3>{product.product_name}</h3>
                  <p>{product.subject}</p>
                  <p>{product.country}</p>
                  <div className="card-footer">
                    <span>${product.price}</span>
                    <button onClick={() => handleBuyProduct(product)}>Buy Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div>
            <h2 className="section-title">My Purchases</h2>
            <div className="purchase-list">
              {myPurchases.map((purchase, index) => (
                <div key={purchase.id} className="purchase-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div>
                    <p>Transaction ID: {purchase.id}</p>
                    <p>Amount: ${purchase.amount}</p>
                    <p>Commission: ${purchase.commission}</p>
                    <p>Type: {purchase.reference_type}</p>
                  </div>
                  <span className={purchase.status.toLowerCase()}>
                    {purchase.status}
                  </span>
                </div>
              ))}
              {myPurchases.length === 0 && <p className="no-items">No purchases yet</p>}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            <div className="job-header">
              <h2 className="section-title">My Job Postings</h2>
              <button onClick={() => setShowJobForm(!showJobForm)} className="post-job-button">
                <Plus size={20} />
                <span>Post New Job</span>
              </button>
            </div>

            {showJobForm && (
              <div className="job-form">
                <h3 className="form-title">Post a New Job</h3>
                <form onSubmit={handlePostJob} className="job-form-content">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={jobCategory}
                      onChange={(e) => setJobCategory(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Budget ($)</label>
                    <input
                      type="number"
                      value={jobBudget}
                      onChange={(e) => setJobBudget(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <button type="submit">Post Job</button>
                </form>
              </div>
            )}

            <div className="job-list">
              {myJobs.map((job, index) => (
                <div key={job.id} className="job-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.description}</p>
                    <p>Budget: ${job.budget}</p>
                  </div>
                  <span className={job.status.toLowerCase()}>
                    {job.status}
                  </span>
                </div>
              ))}
              {myJobs.length === 0 && <p className="no-items">No job postings yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};