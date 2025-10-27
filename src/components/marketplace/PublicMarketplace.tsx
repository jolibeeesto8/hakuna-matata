// import { useState, useEffect } from 'react';
// import { ShoppingBag, Briefcase, BookOpen, Package } from 'lucide-react';
// import { supabase } from '../../lib/supabase';
// import { DigitalAsset, Product, JobPosting, Course } from '../../types';

// export const PublicMarketplace = ({ onAuthRequired }: { onAuthRequired: () => void }) => {
//   const [activeTab, setActiveTab] = useState<'assets' | 'products' | 'jobs' | 'courses'>('assets');
//   const [assets, setAssets] = useState<DigitalAsset[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [jobs, setJobs] = useState<JobPosting[]>([]);
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadData();
//   }, [activeTab]);

//   const loadData = async () => {
//     setLoading(true);

//     if (activeTab === 'assets') {
//       const { data } = await supabase
//         .from('digital_assets')
//         .select('*')
//         .eq('status', 'approved')
//         .order('created_at', { ascending: false });
//       setAssets(data || []);
//     } else if (activeTab === 'products') {
//       const { data } = await supabase
//         .from('products')
//         .select('*')
//         .eq('status', 'active')
//         .order('created_at', { ascending: false });
//       setProducts(data || []);
//     } else if (activeTab === 'jobs') {
//       const { data } = await supabase
//         .from('job_postings')
//         .select('*')
//         .eq('status', 'open')
//         .order('created_at', { ascending: false });
//       setJobs(data || []);
//     } else if (activeTab === 'courses') {
//       const { data } = await supabase
//         .from('courses')
//         .select('*')
//         .order('created_at', { ascending: false });
//       setCourses(data || []);
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <header className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold text-gray-900">Hakuna Matata Online Services</h1>
//             <button
//               onClick={onAuthRequired}
//               className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
//             >
//               Sign In / Sign Up
//             </button>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="flex space-x-4 mb-8">
//           <button
//             onClick={() => setActiveTab('assets')}
//             className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
//               activeTab === 'assets'
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-white text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <Package size={20} />
//             <span>Digital Assets</span>
//           </button>
//           <button
//             onClick={() => setActiveTab('products')}
//             className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
//               activeTab === 'products'
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-white text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <ShoppingBag size={20} />
//             <span>Products</span>
//           </button>
//           <button
//             onClick={() => setActiveTab('jobs')}
//             className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
//               activeTab === 'jobs'
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-white text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <Briefcase size={20} />
//             <span>Jobs</span>
//           </button>
//           <button
//             onClick={() => setActiveTab('courses')}
//             className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
//               activeTab === 'courses'
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-white text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <BookOpen size={20} />
//             <span>Courses</span>
//           </button>
//         </div>

//         {loading ? (
//           <div className="text-center py-12 text-gray-600">Loading...</div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {activeTab === 'assets' &&
//               assets.map((asset) => (
//                 <div key={asset.id} className="bg-white rounded-lg shadow p-6">
//                   <h3 className="font-bold text-lg text-gray-900 mb-2">{asset.title}</h3>
//                   <p className="text-gray-600 text-sm mb-4 line-clamp-3">{asset.description}</p>
//                   <div className="flex items-center justify-between">
//                     <span className="text-2xl font-bold text-gray-900">${asset.price}</span>
//                     <button
//                       onClick={onAuthRequired}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               ))}

//             {activeTab === 'products' &&
//               products.map((product) => (
//                 <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
//                   <img
//                     src={product.image_url_1}
//                     alt={product.product_name}
//                     className="w-full h-48 object-cover"
//                   />
//                   <div className="p-6">
//                     <h3 className="font-bold text-lg text-gray-900 mb-2">{product.product_name}</h3>
//                     <p className="text-gray-600 text-sm mb-2">{product.subject}</p>
//                     <p className="text-gray-500 text-xs mb-4">{product.country}</p>
//                     <div className="flex items-center justify-between">
//                       <span className="text-2xl font-bold text-gray-900">${product.price}</span>
//                       <button
//                         onClick={onAuthRequired}
//                         className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
//                       >
//                         Buy Now
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}

//             {activeTab === 'jobs' &&
//               jobs.map((job) => (
//                 <div key={job.id} className="bg-white rounded-lg shadow p-6">
//                   <h3 className="font-bold text-lg text-gray-900 mb-2">{job.title}</h3>
//                   <p className="text-gray-600 text-sm mb-4 line-clamp-3">{job.description}</p>
//                   <div className="flex items-center justify-between">
//                     <span className="text-xl font-bold text-gray-900">Budget: ${job.budget}</span>
//                     <button
//                       onClick={onAuthRequired}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
//                     >
//                       Bid Now
//                     </button>
//                   </div>
//                 </div>
//               ))}

//             {activeTab === 'courses' &&
//               courses.map((course) => (
//                 <div key={course.id} className="bg-white rounded-lg shadow p-6">
//                   <h3 className="font-bold text-lg text-gray-900 mb-2">{course.title}</h3>
//                   <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
//                   <button
//                     onClick={onAuthRequired}
//                     className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
//                   >
//                     Enroll Now
//                   </button>
//                 </div>
//               ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };




import { useState, useEffect } from 'react';
import { ShoppingBag, Briefcase, BookOpen, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DigitalAsset, Product, JobPosting, Course } from '../../types';
import './PublicMarketplace.css'; // Import the CSS file

export const PublicMarketplace = ({ onAuthRequired }: { onAuthRequired: () => void }) => {
  const [activeTab, setActiveTab] = useState<'assets' | 'products' | 'jobs' | 'courses'>('assets');
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);

    if (activeTab === 'assets') {
      const { data } = await supabase
        .from('digital_assets')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      setAssets(data || []);
    } else if (activeTab === 'products') {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setProducts(data || []);
    } else if (activeTab === 'jobs') {
      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setJobs(data || []);
    } else if (activeTab === 'courses') {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      setCourses(data || []);
    }

    setLoading(false);
  };

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1 className="header-title">Hakuna Matata Online Services</h1>
          <button onClick={onAuthRequired} className="auth-button">
            Sign In / Sign Up
          </button>
        </div>
      </header>

      <div className="tabs">
        {['assets', 'products', 'jobs', 'courses'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'assets' && <Package size={20} />}
            {tab === 'products' && <ShoppingBag size={20} />}
            {tab === 'jobs' && <Briefcase size={20} />}
            {tab === 'courses' && <BookOpen size={20} />}
            <span>
              {tab === 'assets' ? 'Digital Assets' : 
               tab === 'products' ? 'Products' : 
               tab === 'jobs' ? 'Jobs' : 'Courses'}
            </span>
          </button>
        ))}
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="grid">
            {activeTab === 'assets' &&
              assets.map((asset, index) => (
                <div key={asset.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3>{asset.title}</h3>
                  <p>{asset.description}</p>
                  <div className="card-footer">
                    <span>${asset.price}</span>
                    <button onClick={onAuthRequired}>Buy Now</button>
                  </div>
                </div>
              ))}

            {activeTab === 'products' &&
              products.map((product, index) => (
                <div key={product.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <img src={product.image_url_1} alt={product.product_name} className="card-image" />
                  <h3>{product.product_name}</h3>
                  <p>{product.subject}</p>
                  <p>{product.country}</p>
                  <div className="card-footer">
                    <span>${product.price}</span>
                    <button onClick={onAuthRequired}>Buy Now</button>
                  </div>
                </div>
              ))}

            {activeTab === 'jobs' &&
              jobs.map((job, index) => (
                <div key={job.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <div className="card-footer">
                    <span>Budget: ${job.budget}</span>
                    <button onClick={onAuthRequired}>Bid Now</button>
                  </div>
                </div>
              ))}

            {activeTab === 'courses' &&
              courses.map((course, index) => (
                <div key={course.id} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <button onClick={onAuthRequired} className="full-width-button">
                    Enroll Now
                  </button>
                </div>
              ))}
          </div>
        )}
        {(!assets.length && activeTab === 'assets') || (!products.length && activeTab === 'products') || (!jobs.length && activeTab === 'jobs') || (!courses.length && activeTab === 'courses') ? (
          <div className="no-items">No items available</div>
        ) : null}
      </div>
    </div>
  );
};