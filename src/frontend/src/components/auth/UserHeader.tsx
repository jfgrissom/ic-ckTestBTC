import React from 'react';
import { UserHeaderProps } from '../../types/auth.types';
import './UserHeader.css';

const UserHeader: React.FC<UserHeaderProps> = ({ principal, onLogout }) => {
  return (
    <header className="header">
      <h1>ckTestBTC Wallet</h1>
      <div className="user-info">
        <span>Principal: {principal.slice(0, 8)}...</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
};

export default UserHeader;