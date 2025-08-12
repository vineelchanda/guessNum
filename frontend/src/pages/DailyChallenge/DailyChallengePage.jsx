import React, { useState } from "react";
import styles from "./DailyChallengePage.module.css";

function DailyChallengePage({ send, state }) {
  const [guess, setGuess] = useState("");
  const [playerName, setPlayerName] = useState("");

  const { loading, error, dailyChallengeData, attempts, isWinner, currentAttempt } = state.context;

  const handleSubmitGuess = () => {
    if (!guess || guess.length !== 4) {
      alert("Please enter a 4-digit number");
      return;
    }
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    
    send({
      type: "SUBMIT_GUESS",
      guess,
      playerName: playerName.trim(),
    });
    setGuess("");
  };

  const renderAttempts = () => {
    if (attempts.length === 0) return null;

    return (
      <div className={styles.attemptsSection}>
        <h3>Your Attempts:</h3>
        <div className={styles.attemptsList}>
          {attempts.map((attempt, index) => (
            <div key={index} className={styles.attempt}>
              <span className={styles.guessNumber}>{attempt.guess}</span>
              <div className={styles.feedback}>
                <span className={styles.correctDigits}>
                  ✓ {attempt.result.correct_digits} correct digits
                </span>
                <span className={styles.correctPositions}>
                  📍 {attempt.result.correct_positions} correct positions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading && !dailyChallengeData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading today's challenge...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <div className={styles.buttonContainer}>
            <button
              onClick={() => send({ type: "RETRY" })}
              className={styles.retryButton}
            >
              Retry
            </button>
            <button
              onClick={() => send({ type: "GO_TO_HOME" })}
              className={styles.homeButton}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isWinner) {
    return (
      <div className={styles.container}>
        <div className={styles.winner}>
          <h1>🎉 Congratulations! 🎉</h1>
          <h2>You guessed today's number!</h2>
          {currentAttempt?.result?.daily_number && (
            <div className={styles.winnerNumber}>
              The number was: <strong>{currentAttempt.result.daily_number}</strong>
            </div>
          )}
          <p>You completed today's challenge in {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}!</p>
          
          {renderAttempts()}
          
          <div className={styles.buttonContainer}>
            <button
              onClick={() => send({ type: "PLAY_AGAIN" })}
              className={styles.playAgainButton}
            >
              Try Tomorrow's Challenge
            </button>
            <button
              onClick={() => send({ type: "GO_TO_HOME" })}
              className={styles.homeButton}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎯 Daily Number Challenge</h1>
        <p>Guess today's 4-digit number!</p>
        {dailyChallengeData?.date && (
          <div className={styles.dateInfo}>
            Challenge for: {new Date(dailyChallengeData.date).toLocaleDateString()}
          </div>
        )}
        {dailyChallengeData?.hint && (
          <div className={styles.hint}>
            💡 Hint: {dailyChallengeData.hint}
          </div>
        )}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.inputSection}>
          <div className={styles.nameInput}>
            <label htmlFor="playerName">Your Name:</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className={styles.nameField}
              maxLength="20"
            />
          </div>

          <div className={styles.guessInput}>
            <label htmlFor="guess">Your Guess (4 digits):</label>
            <input
              id="guess"
              type="text"
              value={guess}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setGuess(value);
              }}
              placeholder="0000"
              className={styles.guessField}
              maxLength="4"
            />
          </div>

          <button
            onClick={handleSubmitGuess}
            disabled={loading || !guess || guess.length !== 4 || !playerName.trim()}
            className={styles.submitButton}
          >
            {loading ? "Submitting..." : "Submit Guess"}
          </button>
        </div>

        {renderAttempts()}

        <div className={styles.instructions}>
          <h3>How to play:</h3>
          <ul>
            <li>✓ <strong>Correct digits</strong>: How many digits are in the target number</li>
            <li>📍 <strong>Correct positions</strong>: How many digits are in the right position</li>
            <li>🎯 Your goal is to get 4 correct digits in 4 correct positions!</li>
          </ul>
        </div>
      </div>

      <div className={styles.navigation}>
        <button
          onClick={() => send({ type: "GO_TO_HOME" })}
          className={styles.backButton}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default DailyChallengePage;