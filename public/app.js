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
  NOM = 0,
  currencyDataset = [],
  dateDataset = [];

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
  }),
  flktyBottom = new Flickity(".bottom-carousel", {
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
  }),
  base = flktyTop.selectedElement.innerText,
  rate = flktyBottom.selectedElement.innerText;

// Static click on top carousel to select other cells
flktyTop.on("staticClick", (event, pointer, cellElement, cellIndex) =>
  flktyTop.select(cellIndex)
);

// Static click on bottom carousel to select other cells
flktyBottom.on("staticClick", (event, pointer, cellElement, cellIndex) =>
  flktyBottom.select(cellIndex)
);

// Changing the top carousel and base currency
flktyTop.on("settle", () => {
  base = flktyTop.selectedElement.innerText;
  // Empty the arrays for new data
  currencyDataset = [];
  dateDataset = [];
  // Prepare for ten years of data
  let { todaysDate, history } = dateInMonths(120);
  // Get new rates and update all existing ones
  getRatesForBaseCurrency(history, todaysDate, base).then((data) => {
    currencyDataset = formatJSONData(data).currencyDataset;
    dateDataset = formatJSONData(data).dateDataset;
    cycleThroughCurrenciesAndUpdate(NOM);
  });
  // Assign the Y Axis to the new base currency
  chartConfig.options.scales.yAxes[0].scaleLabel.labelString = base;
});

flktyBottom.on("settle", () => {
  rate = flktyBottom.selectedElement.innerText;
});

// Event Listeners //
// For add button
document.getElementById("add-btn").addEventListener("click", addBtnHandler);
// For deleting currencies
currencyTags.addEventListener("click", deleteCurrency);
// For the button group
document
  .getElementById("btn-group")
  .addEventListener("click", btnGroupSelection);

// Functions //
// Add button click handler
function addBtnHandler() {
  // Check whether currency already exists within database
  for (let i = 0; i < chartConfig.data.datasets.length; i++) {
    if (chartConfig.data.datasets[i].label === rate) {
      return;
    }
  }
  addCurrency(currencyDataset, dateDataset, NOM);
}

// Delete currencies from the tags and chart
function deleteCurrency(e) {
  if (e.target.className === "tag is-delete is-medium") {
    for (let i = 0; i < chartConfig.data.datasets.length; i++) {
      if (chartConfig.data.datasets[i].label === e.target.id) {
        chartConfig.data.datasets.splice(i, 1);
      }
    }
    e.target.parentNode.parentNode.remove();
    myChart.update();
  }
}

function btnGroupSelection(e) {
  // Toggling the selected class in the button group
  let btnGroup = e.target.parentNode.querySelectorAll("button");
  btnGroup.forEach((element) => {
    if (e.target.className === "button") {
      element.classList.remove("is-link", "is-selected");
    }
  });
  e.target.classList.add("is-link", "is-selected");
  // Assign global number of months variable

  // Cycle through the currencies in the database
  if (e.target.getAttribute("data")) {
    NOM = parseInt(e.target.getAttribute("data"));
    cycleThroughCurrenciesAndUpdate(NOM);
  } else {
  }
}

// This is for the API date format in months
function dateInMonths(numberOfMonths) {
  // Get today's date
  let todaysDate = new Date();
  // Get last months
  let history = new Date().setMonth(new Date().getMonth() - numberOfMonths);
  // Convert to regular format from EPOCH seconds
  history = new Date(history);
  // Assign convertData function to variables
  todaysDate = convertDate(todaysDate);
  history = convertDate(history);
  // Return data object with dates
  return {
    todaysDate,
    history,
  };
}

// Convert the date to API format
function convertDate(date) {
  let dateString = new Date(
    date.getTime() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];
  return dateString;
}

// Get rates for a base currency
async function getRatesForBaseCurrency(startDate, endDate, base) {
  let serverResponse = await fetch(
    `https://api.exchangeratesapi.io/history?start_at=${startDate}&end_at=${endDate}&base=${base}`
  );
  let jsonResponse = await serverResponse.json();
  return jsonResponse;
}

// Filter the list of JSON to specific dates
function filterDateBySelectedTime(currency, dates, selectedDate, rate) {
  // Declare assigned time
  let { todaysDate, history } = dateInMonths(selectedDate);
  // Filter currency based on time
  currency = currency.filter((element) => {
    return element.date >= history && element.date <= todaysDate;
  });
  // Map dates in currency to labels
  dates = currency.map((element) => {
    return moment(element.date, "YYYY-MM-DD").format("MMM Do YY");
  });
  // Extract the bottom label currency from the array
  currency = currency.map((element) => {
    return { y: parseFloat(element.value[rate].toFixed(2)) };
  });

  return { currency, dates };
}

// Format the JSON data and generate chart labels
function formatJSONData(jsonData) {
  // Push data into the array
  for (let date in jsonData.rates) {
    currencyDataset.push({ date, value: jsonData.rates[date] });
  }
  // Sort the data by dates
  currencyDataset.sort(
    (a, b) =>
      moment(a.date).format("YYYYMMDD") - moment(b.date).format("YYYYMMDD")
  );
  // Format the label date
  dateDataset = currencyDataset.map((element) => {
    let date = moment(element.date, "YYYY-MM-DD").format("MMM Do YY");
    return date;
  });

  return { currencyDataset, dateDataset };
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

// Apply the currency data to DOM
function currencyToDOM(currency, dates) {
  // Assign a random color
  let color = randomColor({
    luminosity: "dark",
    format: "rgb",
  });
  // Make a dataset
  let newDataSet = {
    label: rate,
    data: currency,
    fill: false,
    borderColor: color,
    borderWidth: 3,
    pointRadius: 0,
  };
  // Add element to the DOM
  pushToCurrecyTag(rate, color);

  updateChart(newDataSet, dates);
}

// Self explanatory
function updateChart(currencyData, dateData) {
  chartConfig.data.datasets.push(currencyData);
  // generateGraphTicks();
  chartConfig.options.scales.yAxes[0].scaleLabel.labelString = base;
  chartConfig.options.scales.xAxes[0].labels = dateData;
  myChart.update();
}

function findValues(mathFunc, array, property) {
  return Math[mathFunc].apply(
    array,
    array.map(function (item) {
      return item[property];
    })
  );
}

// Add currency from main database
function addCurrency(currencyData, datesData, selectedDate) {
  let { currency, dates } = filterDateBySelectedTime(
    currencyData,
    datesData,
    selectedDate,
    rate
  );
  currencyToDOM(currency, dates);
}

// Find the lowest and highest values in the currency arrays
function generateGraphTicks() {
  let min,
    max = 0;
  chartConfig.data.datasets.forEach((element) => {
    min = Math.min.apply(
      element.data,
      element.data.map((item) => {
        if (item.y < min) console.log(item.y - 0.001);
      })
    );

    console.log(min);

    max = Math.max.apply(
      element.data,
      element.data.map((item) => {
        if (item.y >= max) return item.y + 0.001;
      })
    );
  });

  // chartConfig.options.scales.yAxes[0].ticks.min = min;
  chartConfig.options.scales.yAxes[0].ticks.max = max;
}

// Cycle through existing currencies and update their values
function cycleThroughCurrenciesAndUpdate(selectedDate) {
  chartConfig.data.datasets.forEach((element) => {
    let { currency, dates } = filterDateBySelectedTime(
      currencyDataset,
      dateDataset,
      selectedDate,
      element.label
    );
    element.data.splice(0, element.data.length, ...currency);
    // generateGraphTicks();
    chartConfig.options.scales.xAxes[0].labels = dates;
    myChart.update();
  });
}

let { todaysDate, history } = dateInMonths(120);
// Initialize upon webpage loading
getRatesForBaseCurrency(history, todaysDate, base).then((data) => {
  let { currencyDataset, dateDataset } = formatJSONData(data);
  NOM = 1;
  addCurrency(currencyDataset, dateDataset, NOM);
});

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
              suggestedMin: 0,
            },
          },
        ],
      },
    },
  },
  myChart = new Chart(ctx, chartConfig);
