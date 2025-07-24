import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const NotificationBadge = ({ count }) => {
    if (!count || count === 0) return null;
    const displayCount = count > 9 ? '9+' : count;
    return (
        <span className="absolute -top-3 -right-5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {displayCount}
        </span>
    );
};

const Header = () => {
    const { user, logout, notifications } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const totalNotifications = (notifications?.newProposalsCount || 0) + (notifications?.unreadMessagesCount || 0);

    const activeLinkStyle = { color: '#4f46e5' };
    const navLinkClasses = "text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors";

    const renderLinks = (isMobile = false) => (
        <div className={isMobile ? "flex flex-col space-y-1 px-2 pt-2 pb-3" : "flex items-center space-x-4"}>
            <NavLink to="/" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>Marketplace</NavLink>
            {user ? (
                <>
                    <NavLink to="/dashboard" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="relative">
                            Dashboard
                            <NotificationBadge count={totalNotifications} />
                        </span>
                    </NavLink>
                    <NavLink to="/profile" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>Profile</NavLink>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className={`${navLinkClasses} text-left w-full`}>Logout</button>
                </>
            ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-indigo-600 text-white ml-2 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105">
                    Login / Sign Up
                </Link>
            )}
        </div>
    );

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center space-x-2">
                            <svg className="h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span className="text-2xl font-bold text-gray-800">SkillSwap</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        {renderLinks()}
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    {renderLinks(true)}
                </div>
            )}
        </nav>
    );
};

export default Header;
