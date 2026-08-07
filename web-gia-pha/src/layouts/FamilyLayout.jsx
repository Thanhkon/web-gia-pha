import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navigation/Navbar';

const FamilyLayout = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
};

export default FamilyLayout;
