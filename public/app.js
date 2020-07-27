// DOM Elements and variables
let ctx = document.getElementById("currency-canvas"),
  addBtn = document.getElementById("add-btn"),
  currencyTags = document.getElementById("currency-tags"),
  worldCurrencies = [
    "$",
    "лв",
    "R$",
    "$",
    "CHF",
    "¥",
    "Kč",
    "kr",
    "£",
    "€",
    "$",
    "Ft",
    "Rp",
    "₪",
    "₹",
    "kr",
    "¥",
    "₩",
    "$",
    "RM",
    "kr",
    "$",
    "₱",
    "zł",
    "lei",
    "₽",
    "kr",
    "$",
    "฿",
    "₺",
    "$",
    "R",
  ],
  NOM = 0, //<-- Global number of months
  NOD = 0, // <-- Global number of days
  selection = true;

// Flickity
// Initialize Flickity objects
let flktyTop = new Flickity(".top-carousel", {
  // Initial index
  initialIndex: 8,
  // Wrap around settings
  freeScroll: true,
  wrapAround: true,
  // Disable page dots
  pageDots: false,
  // Higher friction
  selectedAttraction: 0.2,
  friction: 0.8,
});
let flktyBottom = new Flickity(".bottom-carousel", {
  // Initial index
  initialIndex: 30,
  // Wrap around settings
  freeScroll: true,
  wrapAround: true,
  // Disable page dots
  pageDots: false,
  // Higher friction
  selectedAttraction: 0.2,
  friction: 0.8,
});

// Static click on top carousel to select other cells
flktyTop.on("staticClick", (event, pointer, cellElement, cellIndex) =>
  flktyTop.select(cellIndex)
);

// Static click on bottom carousel to select other cells
flktyBottom.on("staticClick", (event, pointer, cellElement, cellIndex) =>
  flktyBottom.select(cellIndex)
);

// Event Listeners //
// Event to add units to the graph
addBtn.addEventListener("click", () => {
  let rate = flktyBottom.selectedElement.innerText;

  // Check whether currency already exists within database
  for (let i = 0; i < chartConfig.data.datasets.length; i++) {
    if (chartConfig.data.datasets[i].label === rate) {
      return;
    }
  }

  if (selection === true) {
    getRates(
      flktyTop.selectedElement.innerText,
      rate,
      dateMonth(NOM).month,
      dateMonth(NOM).date
    ).then((data) => {
      applyToGraph(data);
      myChart.update();
    });
  } else {
    getRates(
      flktyTop.selectedElement.innerText,
      rate,
      dateDays(NOD).previousDates,
      dateDays(NOD).date
    ).then((data) => {
      applyToGraph(data);
      myChart.update();
    });
  }
});

// Removing the tag and relevant data from the tag div
currencyTags.addEventListener("click", (e) => {
  if (e.target.className === "tag is-delete is-medium") {
    for (let i = 0; i < chartConfig.data.datasets.length; i++) {
      if (chartConfig.data.datasets[i].label === e.target.id) {
        chartConfig.data.datasets.splice(i, 1);
      }
    }
    e.target.parentNode.parentNode.remove();
    myChart.update();
  }
});

// Changing the top carousel and base currency
flktyTop.on("settle", () => {
  chartConfig.data.datasets.forEach(async (element) => {
    let data = await updateCurrency(
      flktyTop.selectedElement.innerText,
      element.label,
      dateMonth(NOM).month,
      dateMonth(NOM).date
    );
    element.data.splice(0, element.data.length, ...data.currencyArray);
    myChart.update();
  });
});

// Changing the trend timeline
document.getElementById("btn-group").addEventListener("click", (e) => {
  if (e.target.id === "1d") {
    NOD = 2;
    selection = false;
    chartConfig.data.datasets.forEach(async (element) => {
      let data = await updateCurrency(
        flktyTop.selectedElement.innerText,
        element.label,
        dateDays(NOD).previousDates,
        dateDays(NOD).date
      );
      element.data.splice(0, element.data.length, ...data.currencyArray);
      chartConfig.options.scales.xAxes[0].labels = data.datesArray;
      myChart.update();
    });
  } else if (e.target.id === "1w") {
    NOD = 7;
    selection = false;
    chartConfig.data.datasets.forEach(async (element) => {
      let data = await updateCurrency(
        flktyTop.selectedElement.innerText,
        element.label,
        dateDays(NOD).previousDates,
        dateDays(NOD).date
      );
      element.data.splice(0, element.data.length, ...data.currencyArray);
      chartConfig.options.scales.xAxes[0].labels = data.datesArray;
      myChart.update();
    });
  } else if (e.target.id === "1m") {
    NOM = 1;
    chartConfig.data.datasets.forEach(async (element) => {
      let data = await updateCurrency(
        flktyTop.selectedElement.innerText,
        element.label,
        dateMonth(NOM).month,
        dateMonth(NOM).date
      );
      element.data.splice(0, element.data.length, ...data.currencyArray);
      chartConfig.options.scales.xAxes[0].labels = data.datesArray;
      myChart.update();
    });
  } else if (e.target.id === "1y") {
    NOM = 12;
    chartConfig.data.datasets.forEach(async (element) => {
      let data = await updateCurrency(
        flktyTop.selectedElement.innerText,
        element.label,
        dateMonth(NOM).month,
        dateMonth(NOM).date
      );
      element.data.splice(0, element.data.length, ...data.currencyArray);
      chartConfig.options.scales.xAxes[0].labels = data.datesArray;
      myChart.update();
    });
  } else if (e.target.id === "5y") {
    NOM = 60;
    chartConfig.data.datasets.forEach(async (element) => {
      let data = await updateCurrency(
        flktyTop.selectedElement.innerText,
        element.label,
        dateMonth(NOM).month,
        dateMonth(NOM).date
      );
      element.data.splice(0, element.data.length, ...data.currencyArray);
      chartConfig.options.scales.xAxes[0].labels = data.datesArray;
      myChart.update();
    });
  } else {
    return;
  }
});

// Functions //
// This is for the (stupid) API date format in months
function dateMonth(numberOfMonths) {
  // Get today's date
  let date = new Date();
  // Get last month
  let month = new Date().setMonth(new Date().getMonth() - numberOfMonths);
  // Convert to regular format from EPOCH seconds
  month = new Date(month);

  // Assign convertData function to variables
  date = convertDate(date);
  month = convertDate(month);
  // Return data object with dates
  return {
    date,
    month,
  };
}

// This is for the (stupid) API date format in days
function dateDays(numberOfDays) {
  // Get today's date
  let date = new Date();
  // Get last month
  let previousDates = new Date().setDate(new Date().getDate() - numberOfDays);
  // Convert to regular format from EPOCH seconds
  previousDates = new Date(previousDates);

  // Assign convertData function to variables
  date = convertDate(date);
  previousDates = convertDate(previousDates);
  // Return data object with dates
  return {
    date,
    previousDates,
  };
}

// Function to convert the date to API format
function convertDate(date) {
  let dateString = new Date(
    date.getTime() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  return dateString;
}

async function getRates(base, rate, startDate, endDate) {
  // Fetch the data from the API
  const data = await fetch(
    `https://api.exchangeratesapi.io/history?start_at=${startDate}&end_at=${endDate}&base=${base}&symbols=${rate}`
  );
  const jsonData = await data.json();

  // Make the array for the currency data
  let currencyArray = [],
    datesArray = [],
    ticks = [];

  // Push data into the array
  for (let date in jsonData.rates) {
    currencyArray.push({ date, value: jsonData.rates[date] });
  }
  // Sort the data by dates
  currencyArray.sort(
    (a, b) =>
      moment(a.date).format("YYYYMMDD") - moment(b.date).format("YYYYMMDD")
  );
  // Format the label date
  datesArray = currencyArray.map((element) => {
    let date = moment(element.date, "YYYY-MM-DD").format("MMM Do YY");
    return date;
  });
  // Extract the values
  currencyArray = currencyArray.map((element) => {
    return { y: parseFloat(element.value[rate].toFixed(2)) };
  });

  // Assign random color to variable
  let color = randomColor({
    luminosity: "dark",
    format: "rgb",
  });

  // Make a dataset
  let newDataSet = {
    label: rate,
    data: currencyArray,
    fill: false,
    borderColor: color,
    borderWidth: 3,
    pointRadius: 0,
  };

  pushToCurrecyTag(rate, color);

  // Return the dataset
  return {
    newDataSet,
    datesArray,
  };
}

// Initialize the graph upon the webpage loading
NOM = 1;
getRates(
  flktyTop.selectedElement.innerText,
  flktyBottom.selectedElement.innerText,
  dateMonth(NOM).month,
  dateMonth(NOM).date
).then((data) => {
  applyToGraph(data);
});

function applyToGraph({ newDataSet, datesArray }) {
  chartConfig.data.datasets.push(newDataSet);
  chartConfig.options.scales.yAxes[0].scaleLabel.labelString =
    flktyTop.selectedElement.innerText;
  chartConfig.options.scales.xAxes[0].labels = datesArray;
  myChart.update();
}

// Add the tag DOM element to the div below the add button
function pushToCurrecyTag(rate, color) {
  let element = `
  <div class="control">
    <div class="tags has-addons">
      <p class="tag is-link is-medium" style="background-color: ${color}">${rate}</p>
      <a class="tag is-delete is-medium" id="${rate}"></a>
    </div>
  </div>
  `;

  currencyTags.insertAdjacentHTML("beforeend", element);
}

// Update the base currency and subsequently update all the currencies stored in chart database
async function updateCurrency(base, rate, startDate, endDate) {
  let data = await fetch(
    `https://api.exchangeratesapi.io/history?start_at=${startDate}&end_at=${endDate}&base=${base}&symbols=${rate}`
  );
  let jsonData = await data.json();

  // Make the array for the currency data
  let currencyArray = [],
    datesArray = [];

  // Push data into the array
  for (let date in jsonData.rates) {
    currencyArray.push({ date, value: jsonData.rates[date] });
  }
  // Sort the dates
  currencyArray.sort(
    (a, b) =>
      moment(a.date).format("YYYYMMDD") - moment(b.date).format("YYYYMMDD")
  );
  // Format the label date
  datesArray = currencyArray.map((element) => {
    let date = moment(element.date, "YYYY-MM-DD").format("MMM Do YY");
    return date;
  });
  // Extract the rate values and return a new array
  currencyArray = currencyArray.map((element) => {
    return { y: parseFloat(element.value[rate].toFixed(2)) };
  });

  return { currencyArray, datesArray };
}

// Chart configurations
Chart.defaults.global.defaultFontFamily = "Baloo Da 2";
let chartConfig = {
    type: "line",
    data: {
      datasets: [],
    },
    options: {
      tooltips: {
        mode: "nearest",
        intersect: false,
      },
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        xAxes: [
          {
            type: "category",
            labels: null,
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
            },
            ticks: {
              beginAtZero: true,
              suggestedMax: 1,
              min: 0,
            },
          },
        ],
      },
    },
  },
  myChart = new Chart(ctx, chartConfig);
