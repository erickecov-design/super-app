// src/pages/News.jsx
import React, { useState, useEffect } from 'react';

const VITE_NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      // We will search for articles about "fantasy football" but exclude common irrelevant terms
      const query = encodeURIComponent('fantasy football OR NFL -soccer -daily');
      const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&apiKey=${VITE_NEWS_API_KEY}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === "error") {
          throw new Error(data.message);
        }
        setArticles(data.articles);
      } catch (e) {
        setError(e.message);
        console.error("Error fetching news:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) return <div className="news-container"><h2>Loading Latest News...</h2></div>;
  if (error) return <div className="news-container"><h2 style={{color: 'red'}}>Error: {error}</h2><p>Please check your NewsAPI key in the .env.local file and ensure you are on the free developer plan.</p></div>;

  return (
    <div className="news-container">
      <h2>Fantasy Football News Hub</h2>
      <div className="articles-grid">
        {articles.map((article, index) => (
          <a href={article.url} target="_blank" rel="noopener noreferrer" key={index} className="article-card">
            {article.urlToImage && <img src={article.urlToImage} alt={article.title} className="article-image" />}
            <div className="article-content">
              <span className="article-source">{article.source.name}</span>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-description">{article.description}</p>
              <span className="article-date">{new Date(article.publishedAt).toLocaleString()}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}