import React from "react";
import styles from "./HomePage.module.css";

function HomePage({ send }) {
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
      </div>
    </div>
  );
}

export default HomePage;
