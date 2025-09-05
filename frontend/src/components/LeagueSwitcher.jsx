// src/components/LeagueSwitcher.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

export default function LeagueSwitcher({ session, activeLeague, onSwitch }) {
  const [leagues, setLeagues] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      const { data, error } = await supabase
        .from('league_members')
        .select('leagues(id, name)') // Fetches id and name from the related leagues table
        .eq('profile_id', session.user.id);
      
      if (error) {
        console.error("Error fetching user's leagues:", error);
      } else {
        setLeagues(data.map(item => item.leagues));
      }
    };
    if (session) fetchLeagues();
  }, [session, activeLeague]); // Refetch when active league changes

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = async (leagueId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ active_league_id: leagueId })
      .eq('id', session.user.id);

    if (error) {
      toast.error(error.message);
    } else {
      onSwitch(); // Tell App.jsx to refetch all user data
      setIsOpen(false);
    }
  };

  if (!activeLeague) return null;

  return (
    <div className="league-switcher" ref={switcherRef}>
      <div className="active-league" onClick={() => setIsOpen(!isOpen)}>
        <span className="active-league-label">Active League:</span>
        <span className="league-name">{activeLeague.name}</span>
        <span className="dropdown-arrow">▼</span>
      </div>
      {isOpen && (
        <div className="league-dropdown">
          {leagues.map(league => (
            <div 
              key={league.id} 
              className={`league-option ${league.id === activeLeague.id ? 'selected' : ''}`}
              onClick={() => handleSwitch(league.id)}
            >
              {league.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}