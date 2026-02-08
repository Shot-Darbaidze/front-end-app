"use client";

export const TIME_SLOTS = {
  generateHours: () => {
    const hours = [];
    for (let i = 8; i <= 20; i++) {
      hours.push(`${i.toString().padStart(2, "0")}:00`);
    }
    return hours;
  },

  getWeekDays: (currentWeekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  },

  isToday: (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  isPastDate: (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },

  isPastSlot: (date: Date, hourNum: number) => {
    const now = new Date();
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hourNum, 0, 0, 0);
    return slotDateTime < now;
  },

  formatWeekRange: (weekDays: Date[]) => {
    const start = weekDays[0];
    const end = weekDays[6];

    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric" }
      )}`;
    } else {
      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
  },
};
