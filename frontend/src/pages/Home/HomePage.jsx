import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";

const CARDS = [
  {
    id: "create",
    icon: "🎮",
    title: "Create Game",
    titleClass: "",
    desc: "Start a new game and become the host! Share a unique game code with friends to invite them.",
    btnLabel: "Create Game",
    btnClass: "",
    cardClass: "",
    action: (send) => send({ type: "GO_TO_CREATE" }),
  },
  {
    id: "system",
    icon: "🤖",
    title: "Play vs System",
    titleClass: "",
    desc: "Challenge the AI in a single-player game. Test your skills against an intelligent opponent.",
    btnLabel: "Play vs System",
    btnClass: "",
    cardClass: "",
    action: (send) => send({ type: "GO_TO_CREATE", isSystemGame: true }),
  },
  {
    id: "join",
    icon: "👥",
    title: "Join Game",
    titleClass: "",
    desc: "Already have a game code? Enter your friend's code to join their room and start playing.",
    btnLabel: "Join Game",
    btnClass: "",
    cardClass: "",
    action: (send) => send({ type: "GO_TO_JOIN" }),
  },
  {
    id: "daily",
    icon: "⚡",
    title: "Daily Challenge",
    titleClass: styles.cardTitleDaily,
    desc: "A fresh puzzle every day — same number for everyone. Resets at 1 AM. Race for the top spot!",
    btnLabel: "Play Daily Challenge",
    btnClass: styles.buttonDaily,
    cardClass: styles.cardDaily,
    isNav: "/daily",
  },
  {
    id: "leaderboard",
    icon: "🏆",
    title: "Leaderboard",
    titleClass: styles.cardTitleLeaderboard,
    desc: "See today's top solvers ranked by fewest guesses and fastest time. Can you make the board?",
    btnLabel: "View Leaderboard",
    btnClass: styles.buttonLeaderboard,
    cardClass: styles.cardLeaderboard,
    isNav: "/leaderboard",
  },
];

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
        <span className={styles.secret}> secret number</span>!{" "}
        <span className={styles.challenge}>Challenge your friends</span> or take on
        the daily puzzle — see who can crack it first.{" "}
        <span className={styles.ready}>Ready to play?</span>
      </div>

      <div className={styles.actionContainer}>
        {CARDS.map((card) => {
          const isHovered = hovered === card.id;
          return (
            <div
              key={card.id}
              className={`${styles.card} ${card.cardClass}`}
              onMouseEnter={() => setHovered(card.id)}
              onMouseLeave={() => setHovered("")}
            >
              <span className={styles.cardIcon}>{card.icon}</span>
              <h2 className={`${styles.cardTitle} ${card.titleClass}`}>
                {card.title}
              </h2>
              <div className={styles.cardDesc}>{card.desc}</div>
              <button
                className={`${styles.button} ${card.btnClass} ${isHovered ? styles.buttonActive : ""}`}
                onClick={() =>
                  card.isNav ? navigate(card.isNav) : card.action(send)
                }
              >
                {card.btnLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
