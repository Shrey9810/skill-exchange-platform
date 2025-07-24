import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';
import StarDisplay from '../common/StarDisplay';
import ProposalModal from '../home/ProposalModal';

const PublicProfilePage = () => {
    const { userId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [completedExchanges, setCompletedExchanges] = useState(0);
    const [totalReviewCount, setTotalReviewCount] = useState(0); // --- NEW STATE ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);

    useEffect(() => {
        if (user && user._id === userId) {
            navigate('/profile');
            return;
        }

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/profile/${userId}`);
                setProfileData(res.data.profile);
                setCompletedExchanges(res.data.completedExchanges);
                setTotalReviewCount(res.data.totalReviewCount); // --- SET NEW STATE ---
            } catch (err) {
                setError('Could not find this user.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId, user, navigate]);

    const handleProposeClick = (skill) => {
        if (!user) {
            navigate('/login');
        } else {
            const skillWithOwner = {
                ...skill,
                owner: {
                    id: profileData._id,
                    name: profileData.name,
                    avatar: profileData.avatar,
                }
            };
            setSelectedSkill(skillWithOwner);
            setIsModalOpen(true);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    if (error) return <div className="text-center text-red-500 text-2xl mt-20">{error}</div>;
    if (!profileData) return null;

    return (
        <>
            <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                        <img src={profileData.avatar} alt={profileData.name} className="w-32 h-32 rounded-full border-4 border-indigo-200 object-cover" />
                        <div className="sm:ml-8 mt-4 sm:mt-0">
                            <h1 className="text-4xl font-bold text-gray-900">{profileData.name}</h1>
                            <div className="flex items-center justify-center sm:justify-start space-x-6 mt-2">
                                {/* --- FIX: Use totalReviewCount here --- */}
                                <StarDisplay rating={profileData.avgRating} reviewCount={totalReviewCount} />
                                <div className="text-gray-600">
                                    <span className="font-bold">{completedExchanges}</span> exchanges completed
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">About</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{profileData.bio}</p>
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Skills Offered</h2>
                        <div className="space-y-3">
                            {profileData.skillsOffered.length > 0 ? (
                                profileData.skillsOffered.map((skill) => (
                                    <div key={skill._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center mb-1">
                                                <p className="font-semibold text-gray-900 mr-3">{skill.title}</p>
                                                <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{skill.category}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                                        </div>
                                        {user && user._id !== profileData._id && (
                                            <button 
                                                onClick={() => handleProposeClick(skill)}
                                                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all text-sm w-full sm:w-auto flex-shrink-0"
                                            >
                                                Propose Exchange
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">This user hasn't added any skills yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Reviews</h2>
                        <div className="space-y-4">
                            {profileData.reviews.length > 0 ? (
                                profileData.reviews.map((review) => (
                                    <div key={review._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <StarDisplay rating={review.rating} />
                                            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-700 italic">"{review.comment}"</p>
                                        <div className="text-right mt-2 text-sm text-gray-500">
                                            - <Link to={`/user/${review.reviewer._id}`} className="font-semibold text-indigo-600 hover:underline">{review.reviewer.name}</Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No detailed reviews yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && selectedSkill && (
                <ProposalModal 
                    skill={selectedSkill} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </>
    );
};

export default PublicProfilePage;
