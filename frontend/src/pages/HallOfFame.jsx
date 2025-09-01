// src/pages/HallOfFame.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function HallOfFame({ session, league }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for commissioner
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [championName, setChampionName] = useState('');
  const [story, setStory] = useState('');

  const isCommissioner = league && session && league.commissioner_id === session.user.id;

  const fetchData = async () => {
    if (!league) return;
    
    // Fetch HOF entries for the current league
    const { data: entriesData, error: entriesError } = await supabase
      .from('hall_of_fame_entries')
      .select('id, year, champion_name, story') // Select the new champion_name column
      .eq('league_id', league.id)
      .order('year', { ascending: false });
    
    if (entriesError) console.error('Error fetching HOF entries:', entriesError);
    else setEntries(entriesData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [league]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!year || !championName.trim()) return alert('Year and Champion Name are required.');

    const { error } = await supabase
      .from('hall_of_fame_entries')
      .insert({
        league_id: league.id,
        year,
        champion_name: championName, // Insert the text name
        story,
      });

    if (error) {
      alert(error.message);
    } else {
      // Reset form and refetch data
      setYear(new Date().getFullYear() - 1);
      setChampionName('');
      setStory('');
      fetchData();
    }
  };

  if (loading) return <h2>Loading Hall of Fame...</h2>;

  return (
    <div className="hof-container">
      <h1>{league?.name} - Hall of Fame</h1>
      
      {isCommissioner && (
        <form onSubmit={handleAddEntry} className="hof-form">
          <h3>Add New Entry</h3>
          <input type="number" placeholder="Year" value={year} onChange={e => setYear(e.target.value)} required />
          {/* This is the changed input */}
          <input type="text" placeholder="Champion's Name (e.g., 'Erick's Eagles '23')" value={championName} onChange={e => setChampionName(e.target.value)} required />
          
          <textarea placeholder="Write the story of the season..." value={story} onChange={e => setStory(e.target.value)} />
          <button type="submit">Immortalize</button>
        </form>
      )}

      <div className="hof-grid">
        {entries.length === 0 ? (
          <p>The history of this league is yet to be written...</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="hof-card">
              <div className="hof-card-header">
                <h2>{entry.year}</h2>
                <div className="hof-champion">
                  <span className="trophy">🏆</span>
                  {/* Display the text name */}
                  <span>{entry.champion_name}</span>
                </div>
              </div>
              <div className="hof-card-body">
                <p>{entry.story || 'No story recorded for this season.'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}