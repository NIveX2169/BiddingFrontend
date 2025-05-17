import React, { useState, useEffect, useMemo } from "react";

const CountdownTimer = ({ endTime, onAuctionEnd, status }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(endTime) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [auctionHasEnded, setAuctionHasEnded] = useState(
    status === "ended" ||
      status === "sold" ||
      status === "cancelled" ||
      Object.keys(calculateTimeLeft()).length === 0
  );

  useEffect(() => {
    if (status === "ended" || status === "sold" || status === "cancelled") {
      setAuctionHasEnded(true);
      setTimeLeft({});
      return;
    }

    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (Object.keys(newTimeLeft).length === 0) {
        setAuctionHasEnded(true);
        if (onAuctionEnd) {
          onAuctionEnd(); // Callback when timer reaches zero
        }
      }
    }, 1000);

    // Clear timeout if the component is unmounted or auction ends
    return () => clearTimeout(timer);
  }, [timeLeft, endTime, onAuctionEnd, status]); // Re-run effect if timeLeft, endTime, or status changes

  const timerComponents = useMemo(() => {
    const components = [];
    Object.keys(timeLeft).forEach((interval) => {
      if (timeLeft[interval] === undefined) return; // Skip undefined intervals

      let Suffix = interval.charAt(0).toUpperCase() + interval.slice(1);
      if (timeLeft[interval] === 1) Suffix = Suffix.slice(0, -1); // Singular (Day, Hour)

      components.push(
        <div key={interval} className="flex flex-col items-center mx-1.5">
          <span className="text-2xl md:text-3xl font-bold text-indigo-600 tabular-nums">
            {String(timeLeft[interval]).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {Suffix}
          </span>
        </div>
      );
    });
    return components;
  }, [timeLeft]);

  if (auctionHasEnded) {
    return (
      <div className="text-center py-3 px-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-xl font-semibold text-red-700">Auction Ended</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
      {timerComponents.length ? (
        timerComponents
      ) : (
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            Calculating time...
          </p>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
