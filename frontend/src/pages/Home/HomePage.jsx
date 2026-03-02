import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";

function HomePage({ send }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState("");

  return (
    <div className={styles.homePage}>
      <h1 className={styles.heading}>Welcome to GuessNum!</h1>
      <div className={styles.subText}>
        <strong className={styles.brand}>GuessNum</strong> is an{" "}
        <span className={styles.exciting}>exciting multiplayer game</span> where
        you and your friends try to outsmart each other by guessing the
        <span className={styles.secret}> secret number</span>!
        <br />
        <span className={styles.challenge}>Challenge your friends</span>, create
        suspense, and see who can guess the number first. <br />
        <span className={styles.ready}>Ready to play?</span>
      </div>
      <div className={styles.actionContainer}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Create Game</h2>
          <div className={styles.cardDesc}>
            Start a new game and become the host!
            <br />
            You will get a unique game code to share with your friends so they
            can join your game room.
          </div>
          <button
            className={
              hovered === "create"
                ? `${styles.button} ${styles.buttonActive}`
                : styles.button
            }
            onMouseEnter={() => setHovered("create")}
            onMouseLeave={() => setHovered("")}
            onClick={() => send({ type: "GO_TO_CREATE" })}
          >
            Create Game
          </button>
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Play vs System</h2>
          <div className={styles.cardDesc}>
            Challenge the AI system in a single-player game!
            <br />
            Test your skills against an intelligent computer opponent.
          </div>
          <button
            className={
              hovered === "system"
                ? `${styles.button} ${styles.buttonActive}`
                : styles.button
            }
            onMouseEnter={() => setHovered("system")}
            onMouseLeave={() => setHovered("")}
            onClick={() => send({ type: "GO_TO_CREATE", isSystemGame: true })}
          >
            Play vs System
          </button>
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Join Game</h2>
          <div className={styles.cardDesc}>
            Already have a game code? <br />
            Enter your friend's code to join their game room and start playing
            together!
          </div>
          <button
            className={
              hovered === "join"
                ? `${styles.button} ${styles.buttonActive}`
                : styles.button
            }
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered("")}
            onClick={() => send({ type: "GO_TO_JOIN" })}
          >
            Join Game
          </button>
        </div>
        <div className={`${styles.card} ${styles.cardDaily}`}>
          <h2 className={`${styles.cardTitle} ${styles.cardTitleDaily}`}>
            Daily Challenge
          </h2>
          <div className={styles.cardDesc}>
            A fresh 4-digit puzzle every day — same number for everyone!
            <br />
            Resets at 1:00 AM. Compete for the fastest solve.
          </div>
          <button
            className={
              hovered === "daily"
                ? `${styles.button} ${styles.buttonDaily} ${styles.buttonActive}`
                : `${styles.button} ${styles.buttonDaily}`
            }
            onMouseEnter={() => setHovered("daily")}
            onMouseLeave={() => setHovered("")}
            onClick={() => navigate("/daily")}
          >
            Play Daily Challenge
          </button>
        </div>
        <div className={`${styles.card} ${styles.cardLeaderboard}`}>
          <h2 className={`${styles.cardTitle} ${styles.cardTitleLeaderboard}`}>
            Leaderboard
          </h2>
          <div className={styles.cardDesc}>
            See today's top solvers ranked by fewest guesses and fastest time.
            <br />
            Can you make the board?
          </div>
          <button
            className={
              hovered === "leaderboard"
                ? `${styles.button} ${styles.buttonLeaderboard} ${styles.buttonActive}`
                : `${styles.button} ${styles.buttonLeaderboard}`
            }
            onMouseEnter={() => setHovered("leaderboard")}
            onMouseLeave={() => setHovered("")}
            onClick={() => navigate("/leaderboard")}
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
