import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../api';
import BioGenerator from '../gemini/BioGenerator';
import AISuggestionButton from '../gemini/AISuggestionButton';
import LoadingSpinner from '../common/LoadingSpinner';
import StarDisplay from '../common/StarDisplay';

const ProfilePage = () => {
    const { user, setUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [newSkill, setNewSkill] = useState({ title: '', category: 'Tech', description: '' });
    const [loadingSave, setLoadingSave] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profile/me');
                setProfileData(res.data);
                setFormData(res.data);
            } catch (error) {
                console.error("Could not fetch profile", error);
                setError("Could not load profile data.");
            }
        };
        fetchProfile();
    }, [user]);

    const handleEditToggle = () => {
        if (isEditing) {
            setFormData({ ...profileData });
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleNewSkillChange = (e) => setNewSkill({ ...newSkill, [e.target.name]: e.target.value });
    const handleAddSkill = () => {
        if (!newSkill.title || !newSkill.category) return;
        setFormData({ ...formData, skillsOffered: [...formData.skillsOffered, newSkill] });
        setNewSkill({ title: '', category: 'Tech', description: '' });
    };
    const handleRemoveSkill = (indexToRemove) => setFormData({ ...formData, skillsOffered: formData.skillsOffered.filter((_, index) => index !== indexToRemove) });
    const handleBioGenerated = (generatedBio) => setFormData({ ...formData, bio: generatedBio });

    const handleSave = async () => {
        setLoadingSave(true);
        setError('');
        try {
            const res = await api.put('/profile', formData);
            setUser(res.data);
            setProfileData(res.data);
            setIsEditing(false);
        } catch (err) {
            setError('Failed to update profile.');
        } finally {
            setLoadingSave(false);
        }
    };

    if (!profileData || !formData) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 mb-24">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                {/* --- REVISED HEADER SECTION FOR BETTER LAYOUT --- */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                    <img src={formData.avatar} alt="avatar" className="w-24 h-24 rounded-full border-4 border-indigo-200 object-cover flex-shrink-0" />
                    <div className="flex-grow w-full">
                        <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 ${isEditing ? 'border-b-2 border-gray-200' : ''}`}>
                            <div className="flex-grow">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        className="w-full text-3xl font-bold bg-transparent focus:outline-none"
                                    />
                                ) : (
                                    <h2 className="text-3xl font-bold text-gray-900">{profileData.name}</h2>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                                {isEditing && <button onClick={handleEditToggle} className="h-10 px-5 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center whitespace-nowrap">Cancel</button>}
                                <button onClick={isEditing ? handleSave : handleEditToggle} disabled={loadingSave} className="h-10 flex-grow justify-center px-5 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors flex items-center whitespace-nowrap">
                                    {loadingSave ? <LoadingSpinner size="small" /> : (isEditing ? 'Save Changes' : 'Edit Profile')}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                            <StarDisplay rating={profileData.avgRating || 0} reviewCount={profileData.reviews.length} />
                        </div>
                    </div>
                </div>
                
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

                <div className="mb-8"><h3 className="text-xl font-bold mb-2 text-gray-800 border-b pb-2">Bio</h3>
                    {isEditing ? (<><textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full p-2 mt-2 border rounded-md"></textarea><BioGenerator onBioGenerated={handleBioGenerated} currentBio={formData.bio} /></>) 
                    : (<p className="text-gray-700 mt-2 whitespace-pre-wrap">{profileData.bio}</p>)}
                </div>

                <div><h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Skills I Offer</h3>
                    <div className="space-y-3">
                        {formData.skillsOffered.map((skill, index) => (
                            <div key={index} className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
                                <div><p className="font-medium text-gray-900">{skill.title}</p><p className="text-sm text-gray-600">{skill.description}</p></div>
                                <div className="flex items-center">
                                    <span className="text-sm bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full mr-4">{skill.category}</span>
                                    {isEditing && (<button onClick={() => handleRemoveSkill(index)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>)}
                                </div>
                            </div>
                        ))}
                        {formData.skillsOffered.length === 0 && !isEditing && (<p className="text-gray-500 italic">No skills added yet.</p>)}
                    </div>
                    {isEditing && (
                        <div className="mt-6 border-t pt-4"><h4 className="font-semibold mb-2">Add a New Skill</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" name="title" placeholder="Skill Title" value={newSkill.title} onChange={handleNewSkillChange} className="p-2 border rounded-md" />
                                <select name="category" value={newSkill.category} onChange={handleNewSkillChange} className="p-2 border rounded-md bg-white"><option>Tech</option><option>Creative</option><option>Business</option><option>Home</option><option>Writing</option><option>Lifestyle</option></select>
                                <textarea name="description" placeholder="Brief description" value={newSkill.description} onChange={handleNewSkillChange} className="p-2 border rounded-md md:col-span-2" rows="2"></textarea>
                            </div>
                            <button onClick={handleAddSkill} className="mt-3 bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600">Add Skill</button>
                            <AISuggestionButton currentSkills={formData.skillsOffered} />
                        </div>
                    )}
                </div>

                <div className="mt-8 border-t pt-6"><h3 className="text-xl font-bold mb-4 text-gray-800">Reviews You've Received</h3>
                    <div className="space-y-4">
                        {profileData.reviews && profileData.reviews.length > 0 ? (
                            profileData.reviews.map(review => (
                                <div key={review._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <StarDisplay rating={review.rating} />
                                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {review.comment ? (
                                        <p className="text-gray-700 italic">"{review.comment}"</p>
                                    ) : (
                                        <p className="text-gray-500 italic">No comment left.</p>
                                    )}
                                    <div className="text-right mt-2 text-sm text-gray-500">
                                        - <Link to={`/user/${review.reviewer._id}`} className="font-semibold text-indigo-600 hover:underline">{review.reviewer.name}</Link>
                                    </div>
                                </div>
                            ))
                        ) : (<p className="text-gray-500 italic">No reviews yet.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
