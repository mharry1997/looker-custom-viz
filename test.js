/**
 * Metric with Progress Bar Visualization
 **/

function extractNumber(str) {
    var regex = /(\d+)$/;
    var matches = regex.exec(str);
    return matches ? parseInt(matches[1], 10) : null;
}

const visObject = {
    options: {
        metricColor: {
            type: "string",
            label: "Metric Color",
            display: "color",
            default: "#0374da",
            section: "Metric",
            order: 1
        },
        metricFormat: {
            type: "string",
            label: "Metric Format",
            display: "select",
            values: [
                {"Percent 0": "percent_0"},
                {"Percent 1": "percent_1"},
                {"Percent 2": "percent_2"},
                {"Decimal 0": "decimal_0"},
                {"Decimal 1": "decimal_1"},
                {"Decimal 2": "decimal_2"},
            ],
            default: "decimal_2",
            section: "Metric",
            order: 2
        },
        greenThreshold: {
            type: "number",
            label: "Green Threshold (%)",
            default: 95,
            min: 0,
            max: 100,
            section: "Thresholds",
            order: 1
        },
        amberThreshold: {
            type: "number",
            label: "Amber Threshold (%)",
            default: 85,
            min: 0,
            max: 100,
            section: "Thresholds",
            order: 2
        },
        greenColor: {
            type: "string",
            label: "Green Color",
            display: "color",
            default: "#34A853",
            section: "Colors",
            order: 1
        },
        amberColor: {
            type: "string",
            label: "Amber Color",
            display: "color",
            default: "#FFBF00",
            section: "Colors",
            order: 2
        },
        redColor: {
            type: "string",
            label: "Red Color",
            display: "color",
            default: "#EA4335",
            section: "Colors",
            order: 3
        },
        benchmarkFormat: {
            type: "string",
            label: "Benchmark Format",
            display: "select",
            values: [
                {"Percent 0": "percent_0"},
                {"Percent 1": "percent_1"},
                {"Percent 2": "percent_2"},
                {"Decimal 0": "decimal_0"},
                {"Decimal 1": "decimal_1"},
                {"Decimal 2": "decimal_2"},
            ],
            default: "decimal_2",
            section: "Benchmark",
            order: 1
        }
    },

    create: function(element, config) {
        element.innerHTML = "<h1>Ready to render!</h1>";
    },

    updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
        // Clear existing content
        element.innerHTML = "";

        var container = document.createElement("div");
        container.style.fontFamily = "'Roboto', sans-serif";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.justifyContent = "center";
        container.style.alignItems = "center";
        container.style.height = "100%";
        container.style.padding = "20px";

        var rowData = data[0];
        var fields = queryResponse.fields.dimensions.map(field => field.name)
            .concat(queryResponse.fields.measures.map(field => field.name))
            .concat(queryResponse.fields.table_calculations.map(field => field.name));

        // Get metric and benchmark fields
        var metricField = fields[0];
        var benchmarkField = fields[1];

        // Parse values
        var metricValue = parseFloat(rowData[metricField].value);
        var benchmarkValue = parseFloat(rowData[benchmarkField].value);

        // Calculate percentage progress
        var progressPercent = benchmarkValue !== 0 ? (metricValue / benchmarkValue) * 100 : 0;

        // Determine color based on thresholds
        var barColor;
        if (progressPercent >= config.greenThreshold) {
            barColor = config.greenColor;
        } else if (progressPercent >= config.amberThreshold) {
            barColor = config.amberColor;
        } else {
            barColor = config.redColor;
        }

        // Format metric value
        var formattedMetricValue;
        var metricFormat = config.metricFormat;
        if (metricFormat.includes('decimal')) {
            formattedMetricValue = metricValue.toFixed(extractNumber(metricFormat));
        } else {
            formattedMetricValue = (metricValue * 100).toFixed(extractNumber(metricFormat)) + '%';
        }

        // Format benchmark value
        var formattedBenchmarkValue;
        var benchmarkFormat = config.benchmarkFormat;
        if (benchmarkFormat.includes('decimal')) {
            formattedBenchmarkValue = benchmarkValue.toFixed(extractNumber(benchmarkFormat));
        } else {
            formattedBenchmarkValue = (benchmarkValue * 100).toFixed(extractNumber(benchmarkFormat)) + '%';
        }

        // Create metric value
        var metricValueDiv = document.createElement("div");
        metricValueDiv.style.fontSize = "4em";
        metricValueDiv.style.fontWeight = "500";
        metricValueDiv.style.color = config.metricColor;
        metricValueDiv.style.margin = "0";
        metricValueDiv.textContent = formattedMetricValue;

        // Create metric label
        var metricLabelDiv = document.createElement("div");
        metricLabelDiv.style.fontSize = "1.2em";
        metricLabelDiv.style.color = "#5f6368";
        metricLabelDiv.style.marginTop = "10px";
        metricLabelDiv.style.marginBottom = "20px";
        metricLabelDiv.textContent = queryResponse.fields.measures[0].label_short || queryResponse.fields.measures[0].label;

        // Create progress bar container
        var progressContainer = document.createElement("div");
        progressContainer.style.width = "100%";
        progressContainer.style.maxWidth = "400px";

        var progressBarBg = document.createElement("div");
        progressBarBg.style.width = "100%";
        progressBarBg.style.height = "30px";
        progressBarBg.style.backgroundColor = "#e8eaed";
        progressBarBg.style.borderRadius = "15px";
        progressBarBg.style.overflow = "hidden";

        var progressBarFill = document.createElement("div");
        progressBarFill.style.height = "100%";
        progressBarFill.style.width = Math.min(progressPercent, 100) + "%";
        progressBarFill.style.backgroundColor = barColor;
        progressBarFill.style.borderRadius = "15px";
        progressBarFill.style.transition = "width 0.3s ease";

        // Create benchmark label
        var benchmarkLabelDiv = document.createElement("div");
        benchmarkLabelDiv.style.fontSize = "0.9em";
        benchmarkLabelDiv.style.color = "#5f6368";
        benchmarkLabelDiv.style.marginTop = "8px";
        benchmarkLabelDiv.style.textAlign = "center";
        var benchmarkFieldLabel = queryResponse.fields.measures[1] ? (queryResponse.fields.measures[1].label_short || queryResponse.fields.measures[1].label) : "Benchmark";
        benchmarkLabelDiv.textContent = benchmarkFieldLabel + ': ' + formattedBenchmarkValue;

        // Append elements
        progressBarBg.appendChild(progressBarFill);
        progressContainer.appendChild(progressBarBg);
        progressContainer.appendChild(benchmarkLabelDiv);

        container.appendChild(metricValueDiv);
        container.appendChild(metricLabelDiv);
        container.appendChild(progressContainer);

        element.appendChild(container);
        doneRendering();
    }
};

looker.plugins.visualizations.add(visObject);
