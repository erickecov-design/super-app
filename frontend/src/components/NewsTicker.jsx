// src/components/NewsTicker.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const VITE_NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState('LOADING LATEST NFL HEADLINES...');

  useEffect(() => {
    const fetchTickerData = async () => {
      // 1. Get the query from our database settings
      const { data: settings, error: settingsError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'ticker_query')
        .single();

      if (settingsError || !settings) {
        console.error("Could not fetch ticker query setting:", settingsError);
        setHeadlines('ERROR: COULD NOT LOAD TICKER CONFIG');
        return;
      }
      
      const query = encodeURIComponent(settings.value.query);
      const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${VITE_NEWS_API_KEY}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          const headlinesText = data.articles.map(a => a.title.toUpperCase()).join(' +++ ');
          setHeadlines(headlinesText);
        } else {
          setHeadlines('LATEST NFL NEWS AND UPDATES +++ NO NEW ARTICLES FOUND');
        }
      } catch (e) {
        console.error("Error fetching ticker news:", e);
        setHeadlines('ERROR FETCHING NEWS +++ CHECK API KEY');
      }
    };

    fetchTickerData();
  }, []);

  return (
    <div className="ticker-container-v2">
      <div className="ticker-content">
        <span>{headlines}</span>
        <span>{headlines}</span>
      </div>
    </div>
  );
}