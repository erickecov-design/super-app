// src/pages/PaperFootball.jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

const FIELD_WIDTH = 400;
const FIELD_HEIGHT = 600;

export default function PaperFootball() {
  const [footballPos, setFootballPos] = useState({ x: FIELD_WIDTH / 2, y: FIELD_HEIGHT - 50, rot: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [flickStart, setFlickStart] = useState(null);
  const [aimLine, setAimLine] = useState(null);
  const [gameState, setGameState] = useState('ready');
  
  const gameLoopRef = useRef();
  const fieldRef = useRef(null);

  const handleMouseDown = (e) => { if (gameState !== 'ready') return; setGameState('aiming'); setFlickStart({ x: footballPos.x, y: footballPos.y }); };
  const handleMouseMove = (e) => { if (gameState !== 'aiming') return; const rect = fieldRef.current.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; setAimLine({ x1: footballPos.x, y1: footballPos.y, x2: mouseX, y2: mouseY }); };
  const handleMouseUp = (e) => { if (gameState !== 'aiming' || !aimLine) return; const dx = aimLine.x2 - flickStart.x; const dy = aimLine.y2 - flickStart.y; const power = 0.2; setVelocity({ x: -dx * power, y: -dy * power }); setGameState('animating'); setFlickStart(null); setAimLine(null); };
  const resetFootball = () => { setFootballPos({ x: FIELD_WIDTH / 2, y: FIELD_HEIGHT - 50, rot: 0 }); setVelocity({ x: 0, y: 0 }); setGameState('ready'); };

  useEffect(() => {
    const gameTick = () => {
      if (gameState === 'animating') {
        let newX = footballPos.x + velocity.x; let newY = footballPos.y + velocity.y; let newRot = footballPos.rot + velocity.y * 0.5; let newVelX = velocity.x * 0.98; let newVelY = velocity.y * 0.98;
        if (newY < 80 && newY > 70 && newX > FIELD_WIDTH / 2 - 50 && newX < FIELD_WIDTH / 2 + 50) {
          setGameState('scored'); const score = Math.round(Math.abs(velocity.y * 10)); toast.success(`IT'S GOOD! +${score} pts!`);
          supabase.rpc('log_paper_football_score', { score_achieved: score }).then(({ data, error }) => { if (error) toast.error(error.message); else if (data.includes('already claimed')) toast.error(data, {icon: '⏰'}); });
          setTimeout(resetFootball, 2000);
        } else if (newY < 0 || newY > FIELD_HEIGHT || newX < 0 || newX > FIELD_WIDTH || (Math.abs(newVelX) < 0.1 && Math.abs(newVelY) < 0.1)) {
          setGameState('missed'); toast.error('MISSED!'); setTimeout(resetFootball, 2000);
        } else {
          setFootballPos({ x: newX, y: newY, rot: newRot }); setVelocity({ x: newVelX, y: newVelY });
        }
      }
      gameLoopRef.current = requestAnimationFrame(gameTick);
    };
    gameLoopRef.current = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, footballPos, velocity]);

  return (
    <div className="football-container-v2">
      <h2>Paper Football</h2>
      <div className="football-stadium">
        <div className="crowd" />
        <div className="football-field-v2" ref={fieldRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => gameState === 'aiming' && handleMouseUp()}>
          <div className="goalpost-v2" style={{ left: FIELD_WIDTH / 2 - 75 }} />
          {aimLine && <div className="aiming-line" style={{ width: `${Math.hypot(aimLine.x2 - aimLine.x1, aimLine.y2 - aimLine.y1)}px`, transform: `translate(${aimLine.x1}px, ${aimLine.y1}px) rotate(${Math.atan2(aimLine.y2 - aimLine.y1, aimLine.x2 - aimLine.x1)}rad)`}}/>}
          <div className="football-v2" style={{ left: footballPos.x - 15, top: footballPos.y - 10, cursor: gameState === 'ready' ? 'grab' : 'default', transform: `rotate(${footballPos.rot}deg)` }} onMouseDown={handleMouseDown}>
            <svg className="football-svg" viewBox="0 0 100 60"><path d="M50 0 C 10 0, 0 30, 0 30 C 0 30, 10 60, 50 60 C 90 60, 100 30, 100 30 C 100 30, 90 0, 50 0 Z" fill="#964B00"/><path d="M50 5 L 50 55" stroke="white" strokeWidth="3" /><path d="M30 30 L 70 30" stroke="white" strokeWidth="3" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}