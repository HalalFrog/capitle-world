"use client";
import React, { useState, useEffect, useCallback } from "react";
import countries from "@/app/countries";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function Home() {
  const MAX_GUESSES = 5;

  const [country, setCountry] = useState(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("playing");
  const [usedLetters, setUsedLetters] = useState({});
  const [guessCount, setGuessCount] = useState(0);
  const [guessHistory, setGuessHistory] = useState([]);
  const [error, setError] = useState("");

  const allCapitals = countries.map((c) =>
    c.capital.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim()
  );

  const pickCountry = useCallback(() => {
    const index = Math.floor(Math.random() * countries.length);
    setCountry(countries[index]);
    setInput("");
    setStatus("playing");
    setUsedLetters({});
    setGuessCount(0);
    setGuessHistory([]);
    setError("");
  }, []);

  useEffect(() => {
    pickCountry();
  }, [pickCountry]);

  const cleanString = (str) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

  const capitalClean = country ? cleanString(country.capital) : "";

  const processGuess = () => {
    if (!input) return;

    const guessClean = cleanString(input);

    if (!allCapitals.includes(guessClean)) {
      setError("That's not a Capital");
      return;
    }

    setError("");

    const result = [];
    const capitalChars = capitalClean.split("");
    const guessChars = guessClean.split("");

    const letterCount = {};
    capitalChars.forEach((ch) => {
      letterCount[ch] = (letterCount[ch] || 0) + 1;
    });

    guessChars.forEach((ch, i) => {
      if (ch === capitalChars[i]) {
        result[i] = "correct";
        letterCount[ch] -= 1;
      } else {
        result[i] = null;
      }
    });

    guessChars.forEach((ch, i) => {
      if (result[i] === null) {
        if (letterCount[ch] > 0) {
          result[i] = "present";
          letterCount[ch] -= 1;
        } else {
          result[i] = "absent";
        }
      }
    });

    const newUsed = { ...usedLetters };
    guessChars.forEach((ch, i) => {
      if (result[i] === "correct") {
        newUsed[ch] = "correct";
      } else if (result[i] === "present" && newUsed[ch] !== "correct") {
        newUsed[ch] = "present";
      } else if (!newUsed[ch]) {
        newUsed[ch] = "absent";
      }
    });

    setUsedLetters(newUsed);
    setGuessHistory((prev) => [...prev, { guess: guessClean, result }]);

    // ⭐ Directional Hint
    const guessedCountry = countries.find(
      (c) => cleanString(c.capital) === guessClean
    );

    if (guessedCountry) {
      const latDiff = country.lat - guessedCountry.lat;
      const lonDiff = country.lon - guessedCountry.lon;

      const hints = [];
      if (Math.abs(latDiff) < 10 && Math.abs(lonDiff) < 10) {
        if (latDiff > 1) hints.push("more north");
        else if (latDiff < -1) hints.push("more south");

        if (lonDiff > 1) hints.push("more east");
        else if (lonDiff < -1) hints.push("more west");

        if (hints.length > 0) {
          setError(`Close! Try ${hints.join(" and ")}`);
        }
      }
    }

    if (guessClean === capitalClean) {
      setStatus("correct");
    } else if (guessCount + 1 >= MAX_GUESSES) {
      setStatus("out-of-guesses");
    } else {
      setStatus("incorrect");
    }

    setGuessCount((c) => c + 1);
    setInput("");
  };

  const handleKeyPress = (key) => {
    if (status === "correct" || status === "out-of-guesses") return;

    if (key === "←") {
      setInput((prev) => prev.slice(0, -1));
      setError("");
    } else if (key === "Enter") {
      processGuess();
    } else {
      if ((ALPHABET + " ").includes(key) && input.length < 30) {
        setInput((prev) => prev + key);
        setError("");
      }
    }
  };

  useEffect(() => {
    const downHandler = (e) => {
      const key = e.key.toUpperCase();

      if (key === "BACKSPACE") {
        e.preventDefault();
        handleKeyPress("←");
      } else if (key === "ENTER") {
        e.preventDefault();
        handleKeyPress("Enter");
      } else if (key === " ") {
        e.preventDefault();
        handleKeyPress(" ");
      } else if (ALPHABET.includes(key)) {
        e.preventDefault();
        handleKeyPress(key);
      }
    };
    window.addEventListener("keydown", downHandler);
    return () => window.removeEventListener("keydown", downHandler);
  }, [handleKeyPress]);

  if (!country) return null;

  const qwertyLayout = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Enter", "Z", "X", "C", "V", "B", "N", "M", "←", " "],
  ];

  return (
    <div className="h-screen flex flex-col justify-center items-center p-4 max-w-md mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      
      {/* Silhouette Image Crossfade */}
    <div className="mb-4">
      <img
        src={status === "correct" ? country.coloredImage : country.image}
        alt="Country Silhouette"
        className="w-[300px] h-auto rounded shadow transition-all duration-700"
      />
    </div>


      <div className="text-xl font-medium text-gray-300 mb-2 text-center">
        Guess the capital of <strong>{country.country}</strong>!
      </div>

      {/* Guess history */}
      <div className="mb-4 w-full">
        {guessHistory.map(({ guess, result }, idx) => (
          <div key={idx} className="flex justify-center mb-1">
            {guess.split("").map((char, i) => {
              let styleClass = "bg-gray-700 text-white";
              if (result[i] === "correct") styleClass = "bg-green-600 text-white";
              else if (result[i] === "present") styleClass = "bg-yellow-500 text-black";
              else if (result[i] === "absent") styleClass = "bg-gray-500 text-white";

              return (
                <div
                  key={i}
                  className={`w-8 h-8 mx-0.5 flex items-center justify-center font-bold rounded select-none ${styleClass}`}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Current input display */}
      <div className="text-2xl font-bold tracking-widest mb-2 min-h-[2.5rem] text-center select-none">
        {input.split("").map((char, i) => {
          const styleClass =
            usedLetters[char] === "correct"
              ? "text-green-600"
              : usedLetters[char] === "present"
              ? "text-yellow-600"
              : usedLetters[char] === "absent"
              ? "text-gray-400"
              : "";

          return (
            <span
              key={i}
              className={`inline-block mx-[0.15em] ${styleClass} ${
                char === " " ? "w-3" : ""
              }`}
            >
              {char}
            </span>
          );
        })}
      </div>

      {error && (
        <div className="text-red-500 font-semibold mb-2 text-center select-none">
          {error}
        </div>
      )}

      {status === "correct" && (
        <div className="text-green-400 font-semibold mb-4 text-center select-none">
          🎉 Correct! The capital is {country.capital}.
        </div>
      )}
      {status === "incorrect" && (
        <div className="text-red-400 font-semibold mb-4 text-center select-none">
          ❌ Incorrect, try again! ({guessCount} / {MAX_GUESSES})
        </div>
      )}
      {status === "out-of-guesses" && (
        <div className="text-red-600 font-semibold mb-4 text-center select-none">
          🛑 Out of guesses! The capital was <strong>{country.capital}</strong>.
        </div>
      )}

      {/* Keyboard */}
      <div className="flex flex-col gap-2 items-center select-none">
        {qwertyLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((key) => {
              const keyUpper = key.toUpperCase();
              const keyClass =
                usedLetters[keyUpper] === "correct"
                  ? "bg-green-500 text-white"
                  : usedLetters[keyUpper] === "present"
                  ? "bg-yellow-400 text-black"
                  : usedLetters[keyUpper] === "absent"
                  ? "bg-gray-400 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-black";

              const displayKey = key === " " ? "Space" : key;

              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key === " " ? " " : keyUpper)}
                  disabled={status === "correct" || status === "out-of-guesses"}
                  className={`w-12 h-12 rounded font-bold transition ${keyClass} ${
                    status === "correct" || status === "out-of-guesses"
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  {displayKey}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {(status === "correct" || status === "out-of-guesses") && (
        <button
          onClick={pickCountry}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition select-none"
        >
          Next Round
        </button>
      )}
    </div>
  );
}
