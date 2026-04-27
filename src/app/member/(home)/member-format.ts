export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
