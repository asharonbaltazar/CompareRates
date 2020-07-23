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
  ];

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

  getRates(
    flktyTop.selectedElement.innerText,
    rate,
    dateMonth().month,
    dateMonth().date
  ).then((data) => {
    applyToGraph(data);
  });
});

// Removing the tag and relevant data from the tag div
currencyTags.addEventListener("click", (e) => {
  if (e.target.className === "tag is-delete is-medium") {
    for (let i = 0; i < chartConfig.data.datasets.length; i++) {
      if (chartConfig.data.datasets[i].label === e.target.id) {
        chartConfig.data.datasets.splice(i, 1);
      }
    }
    e.target.parentNode.remove();
    myChart.update();
  }
});

// Changing the top carousel and base currency
flktyTop.on("settle", () => {
  chartConfig.data.datasets.forEach(async (element) => {
    let data = await updateBaseCurrency(
      flktyTop.selectedElement.innerText,
      element.label,
      dateMonth().month,
      dateMonth().date
    );
    element.data.splice(0, element.data.length, ...data);
    myChart.update();
  });

  chartConfig.options.scales.yAxes[0].scaleLabel.labelString =
    flktyTop.selectedElement.innerText;
});

// Functions //
function getDaysFromLastMonth() {
  // Set variables for last month's date
  let year = new Date().getFullYear(),
    month = new Date().getMonth() - 1,
    day = new Date().getDate();
  // Set the imaginary new date to match
  let date = new Date(year, month, day);
  // Set  the array
  let days = [];
  // Loop through the imaginary new date
  for (let i = 0; date <= new Date(year, month + 1, day); i++) {
    days.push(moment(date).format("MMM Do YY"));
    date.setDate(date.getDate() + 2);
  }
  // Return the array
  return days;
}
// This is the labels for the chart
let days = getDaysFromLastMonth();

// This is for the (stupid) API date format
function dateMonth() {
  // Get today's date
  let date = new Date();
  // Get last month
  let month = new Date().setMonth(new Date().getMonth() - 1);
  // Convert to regular format from EPOCH seconds
  month = new Date(month);
  // Function to convert the date to API format
  function convertDate(date) {
    let dateString = new Date(
      date.getTime() - new Date().getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    return dateString;
  }
  // Assign function to variables
  date = convertDate(date);
  month = convertDate(month);
  // Return data object with dates
  return {
    date,
    month,
  };
}

async function getRates(base, rate, startDate, endDate) {
  // Fetch the data from the API
  const data = await fetch(
    `https://api.exchangeratesapi.io/history?start_at=${startDate}&end_at=${endDate}&base=${base}&symbols=${rate}`
  );
  const jsonData = await data.json();

  // Make the array for the currency data
  const currencyArray = [];

  // Push data into the array
  for (let property in jsonData.rates) {
    currencyArray.push({
      y: parseFloat(jsonData.rates[property][rate].toFixed(2)),
    });
  }

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
  };

  pushToCurrecyTag(rate, color);

  // Return the dataset
  return newDataSet;
}

// Initialize the graph upon the webpage loading
getRates(
  flktyTop.selectedElement.innerText,
  flktyBottom.selectedElement.innerText,
  dateMonth().month,
  dateMonth().date
).then((data) => {
  applyToGraph(data);
});

function applyToGraph(data) {
  chartConfig.data.datasets.push(data);
  chartConfig.options.scales.yAxes[0].scaleLabel.labelString =
    flktyTop.selectedElement.innerText;
  myChart.update();
}

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
async function updateBaseCurrency(base, rate, startDate, endDate) {
  let data = await fetch(
    `https://api.exchangeratesapi.io/history?start_at=${startDate}&end_at=${endDate}&base=${base}&symbols=${rate}`
  );
  let jsonData = await data.json();

  // Make the array for the currency data
  const currencyArray = [];

  // Push data into the array
  for (let property in jsonData.rates) {
    currencyArray.push({
      y: parseFloat(jsonData.rates[property][rate].toFixed(2)),
    });
  }

  return currencyArray;
}

Chart.defaults.global.defaultFontFamily = "Baloo Da 2";
// Chart configurations
let chartConfig = {
    type: "line",
    data: {
      labels: days,
      datasets: [],
    },
    options: {
      title: {
        display: true,
        text: "Your selected currencies",
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
      responsive: true,
      tooltips: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "nearest",
        intersect: true,
      },
      scales: {
        xAxes: [{}],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value",
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  },
  myChart = new Chart(ctx, chartConfig);
