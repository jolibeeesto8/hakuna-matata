// import { useState, useEffect } from 'react';
// import { Plus, Upload } from 'lucide-react';
// import { supabase } from '../../lib/supabase';
// import { useAuth } from '../../contexts/AuthContext';
// import { DigitalAsset, Product, JobPosting, EscrowTransaction } from '../../types';
// import './SellerDashboard.css'; // Import the new CSS file

// export const SellerDashboard = () => {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState<'assets' | 'products' | 'jobs' | 'sales'>('assets');
//   const [myAssets, setMyAssets] = useState<DigitalAsset[]>([]);
//   const [myProducts, setMyProducts] = useState<Product[]>([]);
//   const [availableJobs, setAvailableJobs] = useState<JobPosting[]>([]);
//   const [mySales, setMySales] = useState<EscrowTransaction[]>([]);
//   const [showAssetForm, setShowAssetForm] = useState(false);
//   const [showProductForm, setShowProductForm] = useState(false);

//   useEffect(() => {
//     loadData();
//   }, [activeTab]);

//   const loadData = async () => {
//     if (activeTab === 'assets') {
//       const { data } = await supabase
//         .from('digital_assets')
//         .select('*')
//         .eq('seller_id', user?.id)
//         .order('created_at', { ascending: false });
//       setMyAssets(data || []);
//     } else if (activeTab === 'products') {
//       const { data } = await supabase
//         .from('products')
//         .select('*')
//         .eq('seller_id', user?.id)
//         .order('created_at', { ascending: false });
//       setMyProducts(data || []);
//     } else if (activeTab === 'jobs') {
//       const { data } = await supabase
//         .from('job_postings')
//         .select('*')
//         .eq('status', 'open')
//         .order('created_at', { ascending: false });
//       setAvailableJobs(data || []);
//     } else if (activeTab === 'sales') {
//       const { data } = await supabase
//         .from('escrow_transactions')
//         .select('*')
//         .eq('seller_id', user?.id)
//         .order('created_at', { ascending: false });
//       setMySales(data || []);
//     }
//   };

//   const [assetTitle, setAssetTitle] = useState('');
//   const [assetDescription, setAssetDescription] = useState('');
//   const [assetCategory, setAssetCategory] = useState('source_code');
//   const [assetPrice, setAssetPrice] = useState('');
//   const [assetLicense, setAssetLicense] = useState('');
//   const [assetFile, setAssetFile] = useState('');

//   const handleUploadAsset = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const { error } = await supabase
//       .from('digital_assets')
//       .insert({
//         seller_id: user?.id,
//         title: assetTitle,
//         description: assetDescription,
//         category: assetCategory,
//         price: parseFloat(assetPrice),
//         license_type: assetLicense,
//         file_url: assetFile,
//         status: 'pending_review',
//       });

//     if (!error) {
//       alert('Asset uploaded successfully! Pending admin review.');
//       setShowAssetForm(false);
//       setAssetTitle('');
//       setAssetDescription('');
//       setAssetPrice('');
//       setAssetLicense('');
//       setAssetFile('');
//       loadData();
//     } else {
//       alert('Failed to upload asset');
//     }
//   };

//   const [productName, setProductName] = useState('');
//   const [productSubject, setProductSubject] = useState('');
//   const [productCountry, setProductCountry] = useState('');
//   const [productPrice, setProductPrice] = useState('');
//   const [productImage1, setProductImage1] = useState('');
//   const [productImage2, setProductImage2] = useState('');
//   const [productType, setProductType] = useState('physical');

//   const handlePostProduct = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const { error } = await supabase
//       .from('products')
//       .insert({
//         seller_id: user?.id,
//         product_name: productName,
//         subject: productSubject,
//         country: productCountry,
//         price: parseFloat(productPrice),
//         image_url_1: productImage1,
//         image_url_2: productImage2,
//         type: productType,
//         status: 'active',
//       });

//     if (!error) {
//       alert('Product posted successfully!');
//       setShowProductForm(false);
//       setProductName('');
//       setProductSubject('');
//       setProductCountry('');
//       setProductPrice('');
//       setProductImage1('');
//       setProductImage2('');
//       loadData();
//     } else {
//       alert('Failed to post product');
//     }
//   };

//   const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
//   const [bidAmount, setBidAmount] = useState('');
//   const [bidProposal, setBidProposal] = useState('');

//   const handleSubmitBid = async (jobId: string) => {
//     const { error } = await supabase
//       .from('job_bids')
//       .insert({
//         job_id: jobId,
//         seller_id: user?.id,
//         bid_amount: parseFloat(bidAmount),
//         proposal: bidProposal,
//         status: 'pending',
//       });

//     if (!error) {
//       alert('Bid submitted successfully!');
//       setSelectedJobId(null);
//       setBidAmount('');
//       setBidProposal('');
//     } else {
//       alert('Failed to submit bid');
//     }
//   };

//   return (
//     <div className="seller-dashboard-container">
//       <div className="flex space-x-4 mb-8">
//         <button
//           onClick={() => setActiveTab('assets')}
//           className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
//         >
//           My Digital Assets
//         </button>
//         <button
//           onClick={() => setActiveTab('products')}
//           className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
//         >
//           My Products
//         </button>
//         <button
//           onClick={() => setActiveTab('jobs')}
//           className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
//         >
//           Available Jobs
//         </button>
//         <button
//           onClick={() => setActiveTab('sales')}
//           className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
//         >
//           My Sales
//         </button>
//       </div>

//       {activeTab === 'assets' && (
//         <div className="content">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="section-title">My Digital Assets</h2>
//             <button
//               onClick={() => setShowAssetForm(!showAssetForm)}
//               className="post-job-button"
//             >
//               <Upload size={20} />
//               <span>Upload Asset</span>
//             </button>
//           </div>

//           {showAssetForm && (
//             <div className="job-form">
//               <h3 className="form-title">Upload Digital Asset</h3>
//               <form onSubmit={handleUploadAsset} className="job-form-content">
//                 <div className="form-group">
//                   <label>Title</label>
//                   <input
//                     type="text"
//                     value={assetTitle}
//                     onChange={(e) => setAssetTitle(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Description</label>
//                   <textarea
//                     value={assetDescription}
//                     onChange={(e) => setAssetDescription(e.target.value)}
//                     required
//                     rows={4}
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Category</label>
//                   <select
//                     value={assetCategory}
//                     onChange={(e) => setAssetCategory(e.target.value)}
//                   >
//                     <option value="source_code">Source Code</option>
//                     <option value="dataset">Data Set</option>
//                     <option value="b2b_specialty">B2B Specialty</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label>Price ($)</label>
//                   <input
//                     type="number"
//                     value={assetPrice}
//                     onChange={(e) => setAssetPrice(e.target.value)}
//                     required
//                     min="0"
//                     step="0.01"
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>License Type</label>
//                   <input
//                     type="text"
//                     value={assetLicense}
//                     onChange={(e) => setAssetLicense(e.target.value)}
//                     required
//                     placeholder="e.g., MIT, Commercial, etc."
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>File URL</label>
//                   <input
//                     type="url"
//                     value={assetFile}
//                     onChange={(e) => setAssetFile(e.target.value)}
//                     required
//                     placeholder="https://example.com/file.zip"
//                   />
//                 </div>
//                 <button type="submit">Upload Asset</button>
//               </form>
//             </div>
//           )}

//           <div className="grid">
//             {myAssets.map((asset) => (
//               <div key={asset.id} className="card">
//                 <h3>{asset.title}</h3>
//                 <p>{asset.description}</p>
//                 <div className="card-footer">
//                   <span>${asset.price}</span>
//                   <span className={asset.status.toLowerCase().replace('_', '-')}>{asset.status}</span>
//                 </div>
//               </div>
//             ))}
//             {myAssets.length === 0 && <div className="no-items">No assets uploaded yet</div>}
//           </div>
//         </div>
//       )}

//       {activeTab === 'products' && (
//         <div className="content">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="section-title">My Products</h2>
//             <button
//               onClick={() => setShowProductForm(!showProductForm)}
//               className="post-job-button"
//             >
//               <Plus size={20} />
//               <span>Add Product</span>
//             </button>
//           </div>

//           {showProductForm && (
//             <div className="job-form">
//               <h3 className="form-title">Add New Product</h3>
//               <form onSubmit={handlePostProduct} className="job-form-content">
//                 <div className="form-group">
//                   <label>Product Name</label>
//                   <input
//                     type="text"
//                     value={productName}
//                     onChange={(e) => setProductName(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Subject</label>
//                   <input
//                     type="text"
//                     value={productSubject}
//                     onChange={(e) => setProductSubject(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Country</label>
//                   <input
//                     type="text"
//                     value={productCountry}
//                     onChange={(e) => setProductCountry(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Price ($)</label>
//                   <input
//                     type="number"
//                     value={productPrice}
//                     onChange={(e) => setProductPrice(e.target.value)}
//                     required
//                     min="0"
//                     step="0.01"
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Type</label>
//                   <select
//                     value={productType}
//                     onChange={(e) => setProductType(e.target.value)}
//                   >
//                     <option value="physical">Physical</option>
//                     <option value="digital">Digital</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label>Image 1 URL</label>
//                   <input
//                     type="url"
//                     value={productImage1}
//                     onChange={(e) => setProductImage1(e.target.value)}
//                     required
//                     placeholder="https://example.com/image1.jpg"
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Image 2 URL</label>
//                   <input
//                     type="url"
//                     value={productImage2}
//                     onChange={(e) => setProductImage2(e.target.value)}
//                     required
//                     placeholder="https://example.com/image2.jpg"
//                   />
//                 </div>
//                 <button type="submit">Post Product</button>
//               </form>
//             </div>
//           )}

//           <div className="grid">
//             {myProducts.map((product) => (
//               <div key={product.id} className="card">
//                 <img src={product.image_url_1} alt={product.product_name} className="card-image" />
//                 <h3>{product.product_name}</h3>
//                 <p>{product.subject}</p>
//                 <div className="card-footer">
//                   <span>${product.price}</span>
//                   <span className={product.status.toLowerCase().replace('_', '-')}>{product.status}</span>
//                 </div>
//               </div>
//             ))}
//             {myProducts.length === 0 && <div className="no-items">No products posted yet</div>}
//           </div>
//         </div>
//       )}

//       {activeTab === 'jobs' && (
//         <div className="content">
//           <h2 className="section-title">Available Jobs</h2>
//           <div className="space-y-4">
//             {availableJobs.map((job) => (
//               <div key={job.id} className="card">
//                 <h3>{job.title}</h3>
//                 <p>{job.description}</p>
//                 <div className="flex items-center justify-between mb-4">
//                   <span>Budget: ${job.budget}</span>
//                   <button
//                     onClick={() => setSelectedJobId(job.id)}
//                     className="card button"
//                   >
//                     Place Bid
//                   </button>
//                 </div>

//                 {selectedJobId === job.id && (
//                   <div className="mt-4 pt-4 border-t border-gray-200">
//                     <h4 className="font-bold text-gray-900 mb-2">Submit Your Bid</h4>
//                     <div className="space-y-3">
//                       <div className="form-group">
//                         <label>Bid Amount ($)</label>
//                         <input
//                           type="number"
//                           value={bidAmount}
//                           onChange={(e) => setBidAmount(e.target.value)}
//                           required
//                           min="0"
//                           step="0.01"
//                         />
//                       </div>
//                       <div className="form-group">
//                         <label>Proposal</label>
//                         <textarea
//                           value={bidProposal}
//                           onChange={(e) => setBidProposal(e.target.value)}
//                           required
//                           rows={3}
//                         />
//                       </div>
//                       <button
//                         onClick={() => handleSubmitBid(job.id)}
//                         className="card button"
//                       >
//                         Submit Bid
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//             {availableJobs.length === 0 && <div className="no-items">No jobs available</div>}
//           </div>
//         </div>
//       )}

//       {activeTab === 'sales' && (
//         <div className="content">
//           <h2 className="section-title">My Sales</h2>
//           <div className="purchase-list">
//             {mySales.map((sale) => (
//               <div key={sale.id} className="purchase-card">
//                 <div>
//                   <p>Transaction ID: {sale.id}</p>
//                   <p>Amount: ${sale.amount}</p>
//                   <p>Commission: ${sale.commission}</p>
//                   <p>Type: {sale.reference_type}</p>
//                 </div>
//                 <span className={sale.status.toLowerCase().replace('_', '-')}>{sale.status}</span>
//               </div>
//             ))}
//             {mySales.length === 0 && <div className="no-items">No sales yet</div>}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };



import { useState, useEffect, useRef } from 'react';
import { Plus, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DigitalAsset, Product, JobPosting, EscrowTransaction } from '../../types';
import './SellerDashboard.css';

// Sound file for typing effect
const typingSound = new Audio('/sounds/typing.mp3');

export const SellerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assets' | 'products' | 'jobs' | 'sales'>('assets');
  const [myAssets, setMyAssets] = useState<DigitalAsset[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [availableJobs, setAvailableJobs] = useState<JobPosting[]>([]);
  const [mySales, setMySales] = useState<EscrowTransaction[]>([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const matrixRainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    setupMatrixRain();
    setupTypingSound();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'assets') {
      const { data } = await supabase
        .from('digital_assets')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });
      setMyAssets(data || []);
    } else if (activeTab === 'products') {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });
      setMyProducts(data || []);
    } else if (activeTab === 'jobs') {
      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setAvailableJobs(data || []);
    } else if (activeTab === 'sales') {
      const { data } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });
      setMySales(data || []);
    }
  };

  const setupMatrixRain = () => {
    const matrixRain = matrixRainRef.current;
    if (!matrixRain) return;

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$';
    const createRainChar = () => {
      const char = document.createElement('span');
      char.className = 'rain-char';
      // 30% chance to show '$' for "tiny money" effect
      char.textContent = Math.random() < 0.3 ? '$' : characters[Math.floor(Math.random() * (characters.length - 1))];
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
      const animationDuration = parseFloat(getComputedStyle(el).animationDuration) * 1000;
      const steps = parseInt(getComputedStyle(el).animationTimingFunction.match(/steps\((\d+)/)?.[1] || '30');
      const interval = animationDuration / steps;

      const playSound = () => {
        typingSound.currentTime = 0;
        typingSound.play().catch(() => {});
      };

      for (let i = 0; i < steps; i++) {
        setTimeout(playSound, i * interval);
      }
    });
  };

  const [assetTitle, setAssetTitle] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetCategory, setAssetCategory] = useState('source_code');
  const [assetPrice, setAssetPrice] = useState('');
  const [assetLicense, setAssetLicense] = useState('');
  const [assetFile, setAssetFile] = useState('');

  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('digital_assets')
      .insert({
        seller_id: user?.id,
        title: assetTitle,
        description: assetDescription,
        category: assetCategory,
        price: parseFloat(assetPrice),
        license_type: assetLicense,
        file_url: assetFile,
        status: 'pending_review',
      });

    if (!error) {
      alert('Asset uploaded successfully! Pending admin review.');
      setShowAssetForm(false);
      setAssetTitle('');
      setAssetDescription('');
      setAssetPrice('');
      setAssetLicense('');
      setAssetFile('');
      loadData();
    } else {
      alert('Failed to upload asset');
    }
  };

  const [productName, setProductName] = useState('');
  const [productSubject, setProductSubject] = useState('');
  const [productCountry, setProductCountry] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage1, setProductImage1] = useState('');
  const [productImage2, setProductImage2] = useState('');
  const [productType, setProductType] = useState('physical');

  const handlePostProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('products')
      .insert({
        seller_id: user?.id,
        product_name: productName,
        subject: productSubject,
        country: productCountry,
        price: parseFloat(productPrice),
        image_url_1: productImage1,
        image_url_2: productImage2,
        type: productType,
        status: 'active',
      });

    if (!error) {
      alert('Product posted successfully!');
      setShowProductForm(false);
      setProductName('');
      setProductSubject('');
      setProductCountry('');
      setProductPrice('');
      setProductImage1('');
      setProductImage2('');
      loadData();
    } else {
      alert('Failed to post product');
    }
  };

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');

  const handleSubmitBid = async (jobId: string) => {
    const { error } = await supabase
      .from('job_bids')
      .insert({
        job_id: jobId,
        seller_id: user?.id,
        bid_amount: parseFloat(bidAmount),
        proposal: bidProposal,
        status: 'pending',
      });

    if (!error) {
      alert('Bid submitted successfully!');
      setSelectedJobId(null);
      setBidAmount('');
      setBidProposal('');
    } else {
      alert('Failed to submit bid');
    }
  };

  return (
    <div className="seller-dashboard-container">
      <header className="seller-dashboard-header">
        <div className="header-content" />
      </header>

      <div className="matrix-rain" ref={matrixRainRef}></div>

      <div className="tabs">
        <button
          onClick={() => setActiveTab('assets')}
          className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
        >
          <Upload size={20} />
          <span>My Digital Assets</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
        >
          <Plus size={20} />
          <span>My Products</span>
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
        >
          <Plus size={20} />
          <span>Available Jobs</span>
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
        >
          <Plus size={20} />
          <span>My Sales</span>
        </button>
      </div>

      <div className="content">
        {activeTab === 'assets' && (
          <div>
            <div className="job-header">
              <h2 className="section-title">My Digital Assets</h2>
              <button
                onClick={() => setShowAssetForm(!showAssetForm)}
                className="post-job-button"
              >
                <Upload size={20} />
                <span>Upload Asset</span>
              </button>
            </div>

            {showAssetForm && (
              <div className="job-form">
                <h3 className="form-title">Upload Digital Asset</h3>
                <form onSubmit={handleUploadAsset} className="job-form-content">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={assetTitle}
                      onChange={(e) => setAssetTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={assetDescription}
                      onChange={(e) => setAssetDescription(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={assetCategory}
                      onChange={(e) => setAssetCategory(e.target.value)}
                    >
                      <option value="source_code">Source Code</option>
                      <option value="dataset">Data Set</option>
                      <option value="b2b_specialty">B2B Specialty</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      value={assetPrice}
                      onChange={(e) => setAssetPrice(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>License Type</label>
                    <input
                      type="text"
                      value={assetLicense}
                      onChange={(e) => setAssetLicense(e.target.value)}
                      required
                      placeholder="e.g., MIT, Commercial, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label>File URL</label>
                    <input
                      type="url"
                      value={assetFile}
                      onChange={(e) => setAssetFile(e.target.value)}
                      required
                      placeholder="https://example.com/file.zip"
                    />
                  </div>
                  <button type="submit">Upload Asset</button>
                </form>
              </div>
            )}

            <div className="grid">
              {myAssets.map((asset, index) => (
                <div key={asset.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3>{asset.title}</h3>
                  <p>{asset.description}</p>
                  <div className="card-footer">
                    <span>${asset.price}</span>
                    <span className={asset.status.toLowerCase().replace('_', '-')}>{asset.status}</span>
                  </div>
                </div>
              ))}
              {myAssets.length === 0 && <div className="no-items">No assets uploaded yet</div>}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="job-header">
              <h2 className="section-title">My Products</h2>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="post-job-button"
              >
                <Plus size={20} />
                <span>Add Product</span>
              </button>
            </div>

            {showProductForm && (
              <div className="job-form">
                <h3 className="form-title">Add New Product</h3>
                <form onSubmit={handlePostProduct} className="job-form-content">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={productSubject}
                      onChange={(e) => setProductSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={productCountry}
                      onChange={(e) => setProductCountry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                    >
                      <option value="physical">Physical</option>
                      <option value="digital">Digital</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Image 1 URL</label>
                    <input
                      type="url"
                      value={productImage1}
                      onChange={(e) => setProductImage1(e.target.value)}
                      required
                      placeholder="https://example.com/image1.jpg"
                    />
                  </div>
                  <div className="form-group">
                    <label>Image 2 URL</label>
                    <input
                      type="url"
                      value={productImage2}
                      onChange={(e) => setProductImage2(e.target.value)}
                      required
                      placeholder="https://example.com/image2.jpg"
                    />
                  </div>
                  <button type="submit">Post Product</button>
                </form>
              </div>
            )}

            <div className="grid">
              {myProducts.map((product, index) => (
                <div key={product.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <img src={product.image_url_1} alt={product.product_name} className="card-image" />
                  <h3>{product.product_name}</h3>
                  <p>{product.subject}</p>
                  <p>{product.country}</p>
                  <div className="card-footer">
                    <span>${product.price}</span>
                    <span className={product.status.toLowerCase().replace('_', '-')}>{product.status}</span>
                  </div>
                </div>
              ))}
              {myProducts.length === 0 && <div className="no-items">No products posted yet</div>}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            <h2 className="section-title">Available Jobs</h2>
            <div className="job-list">
              {availableJobs.map((job, index) => (
                <div key={job.id} className="job-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.description}</p>
                    <p>Budget: ${job.budget}</p>
                  </div>
                  <button
                    onClick={() => setSelectedJobId(job.id)}
                    className="card button"
                  >
                    Place Bid
                  </button>
                  {selectedJobId === job.id && (
                    <div className="job-form">
                      <h3 className="form-title">Submit Your Bid</h3>
                      <div className="job-form-content">
                        <div className="form-group">
                          <label>Bid Amount ($)</label>
                          <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="form-group">
                          <label>Proposal</label>
                          <textarea
                            value={bidProposal}
                            onChange={(e) => setBidProposal(e.target.value)}
                            required
                            rows={3}
                          />
                        </div>
                        <button
                          onClick={() => handleSubmitBid(job.id)}
                          className="card button"
                        >
                          Submit Bid
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {availableJobs.length === 0 && <div className="no-items">No jobs available</div>}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            <h2 className="section-title">My Sales</h2>
            <div className="purchase-list">
              {mySales.map((sale, index) => (
                <div key={sale.id} className="purchase-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div>
                    <p>Transaction ID: {sale.id}</p>
                    <p>Amount: ${sale.amount}</p>
                    <p>Commission: ${sale.commission}</p>
                    <p>Type: {sale.reference_type}</p>
                  </div>
                  <span className={sale.status.toLowerCase().replace('_', '-')}>{sale.status}</span>
                </div>
              ))}
              {mySales.length === 0 && <div className="no-items">No sales yet</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};