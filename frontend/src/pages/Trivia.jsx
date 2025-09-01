// src/pages/Trivia.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const TIMER_SECONDS = 22;

export default function Trivia() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(''); // Correct, Incorrect, Time's Up!
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  const fetchNextQuestion = useCallback(async () => {
    setLoading(true);
    setFeedback('');
    setAnswered(false);
    setQuestion(null);
    setTimeLeft(TIMER_SECONDS);

    // This RPC calls a function to get one random, unanswered question for the current user
    const { data, error } = await supabase.rpc('get_unanswered_question');
    
    if (error) {
      console.error("Error fetching question:", error);
    } else if (data && data.length > 0) {
      setQuestion(data[0]);
    } else {
      setQuestion(null); // No more questions
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNextQuestion();
  }, [fetchNextQuestion]);

  useEffect(() => {
    if (!question || answered) return;

    if (timeLeft === 0) {
      setFeedback("Time's Up!");
      setAnswered(true);
      setTimeout(fetchNextQuestion, 2000); // Load next question after 2 seconds
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, question, answered, fetchNextQuestion]);

  const handleAnswer = async (answer) => {
    if (answered) return;
    setAnswered(true);

    const { data: isCorrect, error } = await supabase.rpc('submit_trivia_answer', {
      question_id_arg: question.id,
      answer_text_arg: answer,
    });

    if (error) {
      alert(error.message);
    } else {
      setFeedback(isCorrect ? 'Correct!' : 'Incorrect!');
    }
    setTimeout(fetchNextQuestion, 2000); // Load next question after 2 seconds
  };
  
  if (loading) return <div className="trivia-container"><h2>Loading Trivia...</h2></div>;

  return (
    <div className="trivia-container">
      <div className="trivia-card">
        {question ? (
          <>
            <div className="trivia-header">
              <h3>NFL Trivia</h3>
              <div className="trivia-timer">{timeLeft}s</div>
            </div>
            <p className="trivia-question">{question.question_text}</p>
            <div className="trivia-options">
              {question.options.map((option, index) => (
                <button 
                  key={index} 
                  className="trivia-option-btn"
                  onClick={() => handleAnswer(option)}
                  disabled={answered}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="trivia-question">No more questions available. Check back later!</p>
        )}
        {feedback && <div className={`trivia-feedback ${feedback.toLowerCase().replace('!', '').replace("'s ", '-')}`}>{feedback}</div>}
      </div>
    </div>
  );
}

// We need to create the get_unanswered_question function in SQL.