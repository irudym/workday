import puppeteer from "puppeteer-core";

//get this from CLI as an argument
const start_week = "Dec 7"; //"Sep 21";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//compare the dates and return 0 if they are same, -1 if the first date in the future, -1 if in the past.
function compareDates(date1, date2) {
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const parseDate = (str) => {
    const [mon, day] = str.split(" ");
    return { month: months[mon], day: parseInt(day, 10) };
  };

  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (d1.month === d2.month && d1.day === d2.day) return 0;
  if (d1.month === d2.month) {
    return (d2.day - d1.day) / Math.abs(d2.day - d1.day);
  }
  return (d2.month - d1.month) / Math.abs(d2.month - d1.month);
}

function covert_to_startdate(str) {
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const [mon, day] = str.split(" ");
  const monthNum = months[mon] + 1;
  if (!monthNum) throw new Error("Invalid month: " + mon);

  return `${monthNum}-${parseInt(day, 10)}-7-0`;
}

function get_date(str, year, offset) {
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const [mon, day] = str.split(" ");
  const monthIndex = months[mon];
  const dayNum = parseInt(day, 10);

  if (monthIndex === undefined || isNaN(dayNum)) {
    throw new Error("Invalid date format: " + str);
  }

  const date = new Date(year, monthIndex, dayNum);
  date.setDate(date.getDate() + offset);

  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

function generateScheduleText() {
  // Pick start hour: 8 or 9 AM
  const A = Math.random() < 0.5 ? 8 : 9;

  // Pick first block length: 3 or 4 hours
  const firstBlockLength = Math.random() < 0.5 ? 3 : 4;

  const B = A + firstBlockLength;
  const C = B + 1; // 1-hour break

  // Remaining hours to make total work time = 8
  const secondBlockLength = 8 - firstBlockLength;
  const D = C + secondBlockLength;

  // Helper to format hour -> "hh:00AM/PM"
  function formatHour(hour24) {
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const padded = hour12.toString().padStart(2, "0");
    return `${padded}:00${period}`;
  }

  return [
    formatHour(A), // start first block
    formatHour(B), // end first block
    formatHour(C), // start second block
    formatHour(D), // end second block
  ];
}

async function iterate_tabs(page, items) {
  for await (const e of [1, 2, 3, 4, 5]) {
    console.log("Click on ", e, " element: ", items[e]);
    await items[e].click();
    // enter time
    const panel = await page.waitForSelector('div[class="wd-TimeEntry WD5"]');
    const inputs = await panel.$$("input");

    console.log("Inputs lenght: ", inputs.length);
    console.log("==>> Inputs: ", inputs);

    /*
    for (let i = 0; i < inputs.length; i++) {
      const html = await inputs[i].evaluate((el) => el.outerHTML);
      console.log(`==>> Input[${i}]: `, html);

      await inputs[i].type(`${i + 1} AM`);
      await sleep(500);
    }
    */

    const first_index = e * 6;

    const times = generateScheduleText();

    await inputs[first_index].type(times[0]);
    await inputs[first_index + 1].type(times[1]);
    await inputs[first_index + 3].type(times[2]);
    await inputs[first_index + 4].type(times[3]);

    await sleep(300);
  }
}

const browser = await puppeteer.launch({
  headless: false,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();

await page.goto("https://www.myworkday.com/intel/d/home.htmld");

await page.setViewport({ width: 1080, height: 1024 });

const button = await page.waitForSelector("button ::-p-aria(Time and Absence)");
await button.click();

const this_week_button = await page.waitForSelector(
  "button ::-p-aria(This Week (40 Hours))", // TODO:: in some cases it's This Week (40 Hours)
);
console.log("button = ", this_week_button);
await this_week_button.click();

// select the the right week
// TODO:: there is a 'select week' link, there the user should provide the date
let watchdog = 0;
while (true) {
  //check the amount of jumps in case of wrong week or a mistake in the provided week name
  if (watchdog > 55) {
    console.log("Probably there is a mistake in week name!");
    throw new Error("too many hops to find the right week!");
  }
  watchdog += 1;
  // select week select buttons
  const prev_week = await page.waitForSelector(
    "button ::-p-aria(Previous Week)",
  );
  const next_week = await page.waitForSelector("button ::-p-aria(Next Week)");

  //find the week
  const the_current_week_element = await page
    .locator('h2[data-automation-id="dateRangeTitle"]')
    .waitHandle();
  const currentWeekText = await the_current_week_element?.evaluate(
    (el) => el.textContent,
  );

  const current_week = currentWeekText.split("-")[0].trim();
  console.log("Current week: ", currentWeekText, ", looking for ", start_week);

  const week_move = compareDates(start_week, currentWeekText);

  let button_to_click = false;
  if (week_move === 0) {
    console.log("This is it!");
    break;
  }

  if (week_move < 0) {
    button_to_click = next_week;
  } else {
    button_to_click = prev_week;
  }
  await button_to_click.click();
}

const actions_button = await page.waitForSelector('button[title="Actions"]');
console.log("Button Actions: ", actions_button);
const actions_point = await actions_button.clickablePoint();
console.log("=>> point: ", actions_point);

await actions_button.click();
await page.mouse.click(actions_point.x, actions_point.y);

//const enter_time_link = await page
//  .locator('div[data-automation-label="Enter Time"]')
//  .waitHandle();
const enter_time_menuitem = await page.waitForSelector(
  'div[data-automation-label="Enter Time"]',
);

console.log("Enter time menu_item: ", enter_time_menuitem);
await enter_time_menuitem.click();
const bounding_box = await enter_time_menuitem.boundingBox();

console.log("Bounding Box: ", bounding_box);

await page.mouse.click(bounding_box.x + 5, bounding_box.y + 5);

console.log("Wait till Enter Time");
const enter_time_popup = await page.waitForSelector('span[title="Enter Time"]');
const items = await page.waitForSelector(`ul[data-automation-id="tabBar"]`);

console.log("Should be loaded");
//console.log("==>> Items: ", items);
const lis = await items.$$("li");
//console.log("==>> Items: ", lis);

await iterate_tabs(page, lis);

const ok_button = await page.waitForSelector(
  'button[data-automation-id="wd-CommandButton_uic_okButton"',
);
await ok_button.click();

await sleep(30000);

//items.forEach((item) => {});

/*
// click somewhere in calendar to start entering the time table
await page.mouse.move(450, 800);
await page.mouse.down();
await page.mouse.up();



await page.locator('div[data-automation-id="popUpDialog"]').waitHandle();

//Fill the fields
const inputs = await page.$$("input");

console.log("Inputs: ", inputs);

// TODO: random!

await inputs[3].type("8:00 AM");
await inputs[4].type("12:00 PM");

const type_select = await page.waitForSelector(
  'div[data-automation-id="selectShowAll"]',
);
await type_select.click();

const meal = await page.waitForSelector('div[data-automation-label="Meal"]');
await meal.click();

const ok_button = await page.waitForSelector(
  'button[data-automation-id="wd-CommandButton"]',
);
ok_button.click();
// console.log("button = ", button);

*/

await browser.close();
