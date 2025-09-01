// src/components/DailyTasks.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAndFetchTasks = async () => {
      // First, ensure tasks for the day are assigned
      await supabase.rpc('assign_daily_tasks_for_user');

      // Then, fetch the assigned tasks and their definitions
      const { data, error } = await supabase
        .from('user_task_progress')
        .select('*, tasks:daily_tasks(*)')
        .eq('task_day', new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
      
      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data);
      }
      setLoading(false);
    };

    setupAndFetchTasks();
  }, []);

  if (loading) return <div className="tasks-container">Loading tasks...</div>;

  return (
    <div className="tasks-container">
      <h4>Daily Tasks</h4>
      <ul>
        {tasks.map(task => {
          const progress = (task.progress_count / task.tasks.target_count) * 100;
          return (
            <li key={task.id} className={task.is_completed ? 'completed' : ''}>
              <div className="task-info">
                <span>{task.tasks.description}</span>
                <span>{task.is_completed ? '✅' : `${task.progress_count}/${task.tasks.target_count}`}</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress > 100 ? 100 : progress}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}