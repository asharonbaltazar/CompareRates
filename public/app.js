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
  mainCurrencyArray = [],
  mainDatesArray = [];

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
  topLabel = flktyTop.selectedElement.innerText,
  bottomLabel = flktyBottom.selectedElement.innerText;

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
  topLabel = flktyTop.selectedElement.innerText;
  chartConfig.data.datasets.forEach(async (element) => {
    let data = await updateCurrency(
      topLabel,
      bottomLabel,
      dateMonth(NOM).month,
      dateMonth(NOM).date
    );
    element.data.splice(0, element.data.length, ...data.currencyArray);
    myChart.update();
  });
});

flktyBottom.on("settle", () => {
  bottomLabel = flktyBottom.selectedElement.innerText;
});

// Event Listeners //
// For add button
document.getElementById("add-btn").addEventListener("click", addBtnHandler);
// For deleting currencies
currencyTags.addEventListener("click", deleteCurrency);

// Functions //
// Add button click handler
function addBtnHandler() {
  // Check whether currency already exists within database
  for (let i = 0; i < chartConfig.data.datasets.length; i++) {
    if (chartConfig.data.datasets[i].label === bottomLabel) {
      return;
    }
  }

  addCurrency(mainCurrencyArray, mainDatesArray);
}

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

// This is for the API date format in months
function dateInMonths(numberOfMonths) {
  // Get today's date
  let todaysDate = new Date();
  // Get last history
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
function filterDateBySelectedTime(currency, dates) {
  // Declare assigned time
  let { todaysDate, history } = dateInMonths(1);
  // Filter currencyData based on time
  currency = currency.filter((element) => {
    return element.date >= history && element.date <= todaysDate;
  });
  // Map dates in currencyData to labels
  dates = currency.map((element) => {
    return moment(element.date, "YYYY-MM-DD").format("MMM Do YY");
  });
  // Extract the bottom label currency from the array
  currency = currency.map((element) => {
    return { y: parseFloat(element.value[bottomLabel].toFixed(2)) };
  });

  return { currency, dates };
}

// Format the JSON data and generate chart labels
function formatJSONData(jsonData) {
  // Push data into the array
  for (let date in jsonData.rates) {
    mainCurrencyArray.push({ date, value: jsonData.rates[date] });
  }
  // Sort the data by dates
  mainCurrencyArray.sort(
    (a, b) =>
      moment(a.date).format("YYYYMMDD") - moment(b.date).format("YYYYMMDD")
  );
  // Format the label date
  mainDatesArray = mainCurrencyArray.map((element) => {
    let date = moment(element.date, "YYYY-MM-DD").format("MMM Do YY");
    return date;
  });

  return { mainCurrencyArray, mainDatesArray };
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
function currencyToDOM(currencyData, dates) {
  // Assign a random color
  let color = randomColor({
    luminosity: "dark",
    format: "rgb",
  });
  // Make a dataset
  let newDataSet = {
    label: bottomLabel,
    data: currencyData,
    fill: false,
    borderColor: color,
    borderWidth: 3,
    pointRadius: 0,
  };
  // Add element to the DOM
  pushToCurrecyTag(bottomLabel, color);

  updateChart(newDataSet, dates);
}

// Self explanatory
function updateChart(currencyData, dateData) {
  chartConfig.data.datasets.push(currencyData);
  chartConfig.options.scales.yAxes[0].scaleLabel.labelString = topLabel;
  chartConfig.options.scales.xAxes[0].labels = dateData;
  myChart.update();
}

// Add currency from main database
function addCurrency(currencyData, datesData) {
  let { currency, dates } = filterDateBySelectedTime(currencyData, datesData);
  currencyToDOM(currency, dates);
}

let { todaysDate, history } = dateInMonths(60);
// Initialize upon webpage loading
getRatesForBaseCurrency(history, todaysDate, topLabel).then((data) => {
  let { mainCurrencyArray, mainDatesArray } = formatJSONData(data);
  addCurrency(mainCurrencyArray, mainDatesArray);
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
              min: 0,
            },
          },
        ],
      },
    },
  },
  myChart = new Chart(ctx, chartConfig);
