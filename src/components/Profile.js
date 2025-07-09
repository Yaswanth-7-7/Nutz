import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user?.username}</h1>
            <p className="profile-email">{user?.email}</p>
            <p className="profile-joined">
              Member since {formatDate(user?.createdAt || new Date())}
            </p>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="change-password-btn"
            onClick={() => navigate('/change-password')}
          >
            Change Password
          </button>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">Username:</span>
            <span className="detail-value">{user?.username}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user?.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">User ID:</span>
            <span className="detail-value">{user?.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Account Created:</span>
            <span className="detail-value">{formatDate(user?.createdAt || new Date())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 