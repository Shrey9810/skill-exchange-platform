import React, { useState, useEffect } from 'react';
import api from '../../api';
import useAuth from '../../hooks/useAuth';
import SkillCard from './SkillCard';
import ProposalModal from './ProposalModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const categories = ['All', 'Tech', 'Creative', 'Business', 'Home', 'Writing', 'Lifestyle'];

const HomePage = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          search: searchTerm,
          category: category,
          userId: user ? user._id : null,
        };
        const res = await api.get('/skills', { params });
        setSkills(res.data);
      } catch (err) {
        setError('Could not fetch skills. Please try refreshing the page.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchSkills();
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm, category, user]);

  const handleProposeClick = (skill) => {
    if (!user) {
      navigate('/login');
    } else {
      setSelectedSkill(skill);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
          Exchange Skills, <span className="text-indigo-600">Build Community</span>
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-gray-600">
          Unlock your potential by trading your talents. Learn something new, get help with a project, and connect with skilled individuals—all without spending a dime.
        </p>
      </div>

      {/* Modern Search & Filter */}
      <div className="mb-12 p-4 bg-white rounded-xl shadow-lg sticky top-[68px] z-30">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                </div>
                <input
                type="text"
                placeholder="Search for a skill (e.g., 'React Development')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                />
            </div>
            <div className="w-full md:w-auto">
                <span className="md:hidden text-sm font-medium text-gray-700 mb-2 block">Category:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                            category === cat 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
                </div>
            </div>
        </div>
      </div>

      <div className="mb-24">
        {loading ? (
            <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
        ) : error ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>
        ) : skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {skills.map(skill => (
                <SkillCard key={`${skill.id}-${skill.owner.id}`} skill={skill} onPropose={handleProposeClick} />
            ))}
            </div>
        ) : (
            <div className="text-center text-gray-500 py-16">
            <h3 className="text-2xl font-semibold">No Skills Found</h3>
            <p>Try adjusting your search or filter criteria.</p>
            </div>
        )}
      </div>

      <div id="about" className="py-16 bg-white rounded-2xl shadow-xl mb-24">
        <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">About SkillSwap</h2>
                    <p className="text-gray-600 mb-4">
                        We believe everyone has a skill worth sharing. SkillSwap was born from the idea that knowledge and talent should be accessible to all, not just those who can afford it. Our mission is to create a vibrant community where individuals can connect, collaborate, and grow by exchanging their unique abilities.
                    </p>
                    <p className="text-gray-600">
                        Whether you're a developer looking for a logo, a writer needing a website, or a musician wanting to learn photography, SkillSwap is the place to make it happen through the power of bartering.
                    </p>
                </div>
                <div className="flex justify-center">
                    <svg className="w-64 h-64 text-indigo-100" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.5a5.5 5.5 0 013.096 10.047 9.005 9.005 0 015.9 8.181.75.75 0 01-1.496.07 7.502 7.502 0 00-14.992 0 .75.75 0 01-1.496-.07 9.005 9.005 0 015.9-8.181A5.5 5.5 0 0112 2.5zM12 4a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM8.25 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM18.75 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
                </div>
            </div>
        </div>
      </div>

      {/* --- NEW: IMPROVED CONTACT US SECTION --- */}
      <div id="contact" className="py-16 mb-16">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl mx-auto p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h2>
            <p className="text-gray-600 mb-6">
                Have questions, feedback, or a collaboration idea? We'd love to hear from you.
            </p>
            <div className="inline-block bg-indigo-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-800">Shreyash Chaudhary</p>
                <a href="mailto:shreyash9810@gmail.com" className="text-indigo-600 hover:underline">
                    shreyash9810@gmail.com
                </a>
            </div>
        </div>
      </div>

      {isModalOpen && selectedSkill && (
        <ProposalModal 
          skill={selectedSkill} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default HomePage;
