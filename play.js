const start_week="Sep 21";

const start_date = new Date(start_week + " 2025");
console.log(start_date);

function get_date(str, year, offset) {
  const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3,
        May: 4, Jun: 5, Jul: 6, Aug: 7,
        Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const [mon, day] = str.split(" ");
    const monthIndex = months[mon];
    const dayNum = parseInt(day, 10);

    if (monthIndex === undefined || isNaN(dayNum)) {
        throw new Error("Invalid date format: " + str);
    }

    const date = new Date(year, monthIndex, dayNum);
    date.setDate(date.getDate() + offset);

    return `${monthNames[date.getMonth()]} ${date.getDate()}`
}


console.log(get_date("Sep 21", 2025, 1)); // "Sep 22"
console.log(get_date("Sep 30", 2025, 1)); // "Oct 1"
console.log(get_date("Dec 31", 2025, 1)); // "Jan 1"
console.log(get_date("Feb 27", 2025, 1)); // "Feb 29" (leap year handling)
console.log(get_date("Feb 28", 2025, 1)); // "Mar 1"