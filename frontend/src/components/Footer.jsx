// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <p>&copy; {currentYear} SUPER. All Rights Reserved. | <Link to="/legal">Terms & Privacy</Link></p>
      <p>Powered by the <span className="rpl-link">Red Pen League</span></p>
    </footer>
  );
}