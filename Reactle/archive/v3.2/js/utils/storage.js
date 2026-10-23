export const Storage = {
  // Theme Settings
  getTheme() {
    return localStorage.getItem('reactle_theme');
  },
  setTheme(theme) {
    localStorage.setItem('reactle_theme', theme);
  },

  // Sound Settings
  getSound() {
    const sound = localStorage.getItem('reactle_sound');
    return sound !== null ? sound === 'true' : true;
  },
  setSound(enabled) {
    localStorage.setItem('reactle_sound', enabled);
  },

  // Matrix Badge Setting
  getMatrixBadge() {
    const badge = localStorage.getItem('reactle_show_matrix_badge');
    return badge !== null ? badge === 'true' : false;
  },
  setMatrixBadge(enabled) {
    localStorage.setItem('reactle_show_matrix_badge', enabled);
  },

  // Game Stats
  getStats() {
    return {
      correct: parseInt(localStorage.getItem('reactle_correct')) || 0,
      attempts: parseInt(localStorage.getItem('reactle_attempts')) || 0,
      streak: parseInt(localStorage.getItem('reactle_streak')) || 0
    };
  },
  saveStats(correct, attempts, streak) {
    localStorage.setItem('reactle_correct', correct);
    localStorage.setItem('reactle_attempts', attempts);
    localStorage.setItem('reactle_streak', streak);
  },

  // Daily Challenge History
  getDailyHistory() {
    return JSON.parse(localStorage.getItem('reactle_daily_history') || '{}');
  },
  setDailyHistory(history) {
    localStorage.setItem('reactle_daily_history', JSON.stringify(history));
  },
  getDailyStreak() {
    const history = JSON.parse(localStorage.getItem('reactle_daily_history') || '{}');
    const dates = Object.keys(history)
        .filter(d => history[d].completed)
        .sort((a, b) => new Date(b) - new Date(a));

    if (dates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If the latest completion isn't today or yesterday, streak is broken
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
        return 0;
    }

    let streak = 0;
    let checkDate = new Date(dates[0]);

    for (let i = 0; i < dates.length; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (history[dateStr] && history[dateStr].completed) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  }
};
