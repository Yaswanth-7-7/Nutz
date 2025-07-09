import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const ChangePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setIsLoading(true);
    const success = await changePassword(data.currentPassword, data.newPassword);
    setIsLoading(false);
    
    if (success) {
      reset();
      navigate('/profile');
    }
  };

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <button 
            onClick={handleBackToProfile}
            className="back-button"
            type="button"
          >
            ← Back to Profile
          </button>
          <h2>Change Password</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              {...register('currentPassword', {
                required: 'Current password is required'
              })}
              className={errors.currentPassword ? 'error' : ''}
            />
            {errors.currentPassword && <span className="error-message">{errors.currentPassword.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              {...register('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className={errors.newPassword ? 'error' : ''}
            />
            {errors.newPassword && <span className="error-message">{errors.newPassword.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              {...register('confirmNewPassword', {
                required: 'Please confirm your new password',
                validate: value => value === newPassword || 'Passwords do not match'
              })}
              className={errors.confirmNewPassword ? 'error' : ''}
            />
            {errors.confirmNewPassword && <span className="error-message">{errors.confirmNewPassword.message}</span>}
          </div>

          <div className="password-requirements">
            <h4>Password Requirements:</h4>
            <ul>
              <li>At least 6 characters long</li>
              <li>Cannot be one of your last 3 passwords</li>
            </ul>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Changing password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 