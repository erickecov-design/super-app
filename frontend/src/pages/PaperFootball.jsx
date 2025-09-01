// src/pages/PaperFootball.jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const FIELD_WIDTH = 400;
const FIELD_HEIGHT = 600;

export default function PaperFootball() {
  const [footballPos, setFootballPos] = useState({ x: FIELD_WIDTH / 2, y: FIELD_HEIGHT - 50 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [flickStart, setFlickStart] = useState(null);
  const [gameState, setGameState] = useState('ready'); // ready, aiming, animating, scored, missed
  const [feedback, setFeedback] = useState('Click and drag the football to flick.');
  const gameLoopRef = useRef();
  
  const handleMouseDown = (e) => {
    if (gameState !== 'ready') return;
    setGameState('aiming');
    setFlickStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e) => {
    if (gameState !== 'aiming') return;
    const flickEnd = { x: e.clientX, y: e.clientY };
    const dx = flickEnd.x - flickStart.x;
    const dy = flickEnd.y - flickStart.y;
    // Power scaling - adjust these values to change the feel
    const power = 0.15;
    setVelocity({ x: -dx * power, y: -dy * power });
    setGameState('animating');
    setFlickStart(null);
  };

  const resetFootball = () => {
    setFootballPos({ x: FIELD_WIDTH / 2, y: FIELD_HEIGHT - 50 });
    setVelocity({ x: 0, y: 0 });
    setGameState('ready');
    setFeedback('Click and drag the football to flick.');
  };

  useEffect(() => {
    const gameTick = () => {
      if (gameState !== 'animating') return;

      let newX = footballPos.x + velocity.x;
      let newY = footballPos.y + velocity.y;
      let newVelX = velocity.x * 0.98; // Friction
      let newVelY = velocity.y * 0.98; // Friction

      // Check for goal
      const goalpostLeft = FIELD_WIDTH / 2 - 50;
      const goalpostRight = FIELD_WIDTH / 2 + 50;
      if (newY < 50 && newY > 40 && newX > goalpostLeft && newX < goalpostRight) {
        setGameState('scored');
        setFeedback('IT\'S GOOD!');
        const score = Math.round(Math.abs(velocity.y * 10)); // Score based on power
        supabase.rpc('log_paper_football_score', { score_achieved: score })
          .then(({ data, error }) => {
            if (error) console.error(error);
            else setFeedback(`IT'S GOOD! ${data}`); // Show feedback from DB function
          });
        setTimeout(resetFootball, 2000);
        return;
      }
      
      // Check for out of bounds
      if (newY < 0 || newY > FIELD_HEIGHT || newX < 0 || newX > FIELD_WIDTH) {
        setGameState('missed');
        setFeedback('MISSED!');
        setTimeout(resetFootball, 2000);
        return;
      }

      setFootballPos({ x: newX, y: newY });
      setVelocity({ x: newVelX, y: newVelY });

      // Stop animation when velocity is very low
      if (Math.abs(newVelX) < 0.1 && Math.abs(newVelY) < 0.1) {
        setGameState('missed');
        setFeedback('MISSED!');
        setTimeout(resetFootball, 2000);
      }
    };

    gameLoopRef.current = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, footballPos, velocity]);

  return (
    <div className="football-container">
      <h2>Paper Football</h2>
      <p className={`football-feedback football-feedback-${gameState}`}>{feedback}</p>
      <div className="football-field" style={{ width: FIELD_WIDTH, height: FIELD_HEIGHT }} onMouseUp={handleMouseUp}>
        <div className="goalpost" style={{ left: FIELD_WIDTH / 2 - 75 }} />
        <div
          className="football"
          style={{ left: footballPos.x - 15, top: footballPos.y - 10, cursor: gameState === 'ready' ? 'grab' : 'default' }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}