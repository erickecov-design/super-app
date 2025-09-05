// src/components/NewsTicker.jsx
import React, { useState, useEffect } from 'react';

const VITE_NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState('');

  useEffect(() => {
    const fetchHeadlines = async () => {
      const query = encodeURIComponent('NFL football headlines');
      const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${VITE_NEWS_API_KEY}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          // Join headlines with a distinct separator for the ticker animation
          const headlinesText = data.articles.map(a => a.title.toUpperCase()).join(' +++ ');
          setHeadlines(headlinesText);
        } else {
          setHeadlines('LATEST NFL NEWS AND UPDATES...');
        }
      } catch (e) {
        console.error("Error fetching ticker news:", e);
        setHeadlines('LATEST NFL NEWS AND UPDATES...');
      }
    };

    fetchHeadlines();
  }, []);

  if (!headlines) return null;

  return (
    <div className="ticker-container-v2">
      <div className="ticker-content">
        <span>{headlines}</span>
        <span>{headlines}</span>
      </div>
    </div>
  );
}