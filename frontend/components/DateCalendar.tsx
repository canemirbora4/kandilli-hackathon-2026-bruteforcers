"use client";

import { useMemo } from "react";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

interface DateCalendarProps {
  availableDates: string[];   // ["1980-01-15", "1980-02-03", ...]
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  year: number;
}

export default function DateCalendar({
  availableDates,
  selectedDate,
  onDateSelect,
  year,
}: DateCalendarProps) {
  const dateSet = useMemo(() => new Set(availableDates), [availableDates]);

  // Group available dates by month
  const monthData = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const d of availableDates) {
      const parts = d.split("-");
      const m = parseInt(parts[1]);
      if (!map[m]) map[m] = [];
      map[m].push(d);
    }
    return map;
  }, [availableDates]);

  // Days in each month for the given year
  const getDaysInMonth = (month: number) => new Date(year, month, 0).getDate();

  return (
    <div className="date-calendar">
      <div className="calendar-grid">
        {MONTHS.map((monthName, idx) => {
          const monthNum = idx + 1;
          const daysInMonth = getDaysInMonth(monthNum);
          const monthDates = monthData[monthNum] || [];
          const hasData = monthDates.length > 0;

          return (
            <div
              key={monthNum}
              className={`calendar-month ${hasData ? "has-data" : "no-data"}`}
            >
              <div className="calendar-month-name">{monthName}</div>
              <div className="calendar-days">
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const available = dateSet.has(dateStr);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={day}
                      className={`calendar-day ${available ? "available" : "disabled"} ${isSelected ? "selected" : ""}`}
                      disabled={!available}
                      onClick={() => available && onDateSelect(dateStr)}
                      title={dateStr}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {hasData && (
                <div className="calendar-month-count">{monthDates.length} kayıt</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
