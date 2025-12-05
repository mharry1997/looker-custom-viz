/**
 * Metric with Progress Bar Visualization
 * Displays a single metric value with a progress bar showing progress towards a benchmark
 **/

function extractNumber(str) {
    var regex = /(\d+)$/;
    var matches = regex.exec(str);
    return matches ? parseInt(matches[1], 10) : null;
}

function lightenColor(color, percent) {
    // Convert hex to RGB
    var num = parseInt(color.replace("#",""), 16);
    var r = (num >> 16);
    var g = (num >> 8) & 0x00FF;
    var b = num & 0x0000FF;

    // Lighten by mixing with white
    r = Math.min(255, Math.floor(r + (255 - r) * percent));
    g = Math.min(255, Math.floor(g + (255 - g) * percent));
    b = Math.min(255, Math.floor(b + (255 - b) * percent));

    // Convert back to hex
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

const visObject = {
    options: {
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
        amberThreshold: {
            type: "number",
            label: "Amber Threshold (distance from benchmark)",
            default: 0.2,
            section: "Thresholds",
            order: 1
        },
        redThreshold: {
            type: "number",
            label: "Red Threshold (distance from benchmark)",
            default: 0.5,
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
        element.innerHTML = `
            <style>
                .metric-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    font-family: 'Roboto', 'Google Sans', sans-serif;
                    padding: 20px;
                    box-sizing: border-box;
                    border: 2px solid #ccc;
                }
                .metric-value {
                    font-weight: 500;
                    margin: 0;
                    line-height: 1;
                }
                .metric-label {
                    color: #5f6368;
                    margin: 10px 0 20px 0;
                }
                .progress-container {
                    width: 100%;
                    max-width: 400px;
                }
                .progress-bar-bg {
                    width: 100%;
                    border-radius: 15px;
                    overflow: visible;
                    position: relative;
                }
                .progress-bar-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                    border-radius: 15px;
                }
                .benchmark-label {
                    font-weight: 500;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    white-space: nowrap;
                }
            </style>
            <div class="metric-container">
                <div class="metric-value"></div>
                <div class="metric-label"></div>
                <div class="progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill"></div>
                        <div class="benchmark-label"></div>
                    </div>
                </div>
            </div>
        `;
    },

    updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
        // Calculate responsive sizing based on container
        var containerHeight = element.offsetHeight;
        var containerWidth = element.offsetWidth;
        var baseSize = Math.min(containerWidth / 15, containerHeight / 8);

        // Get all fields
        var fields = queryResponse.fields.dimensions.map(field => field.name)
            .concat(queryResponse.fields.measures.map(field => field.name))
            .concat(queryResponse.fields.table_calculations.map(field => field.name));

        var rowData = data[0];

        // Get metric and benchmark fields
        var metricField = fields[0];
        var benchmarkField = fields[1];

        // Get field labels
        var metricFieldDef = queryResponse.fields.dimensions.find(f => f.name === metricField) ||
                            queryResponse.fields.measures.find(f => f.name === metricField) ||
                            queryResponse.fields.table_calculations.find(f => f.name === metricField);
        var benchmarkFieldDef = queryResponse.fields.dimensions.find(f => f.name === benchmarkField) ||
                               queryResponse.fields.measures.find(f => f.name === benchmarkField) ||
                               queryResponse.fields.table_calculations.find(f => f.name === benchmarkField);

        var metricLabel = metricFieldDef ? metricFieldDef.label_short || metricFieldDef.label : metricField;
        var benchmarkLabel = benchmarkFieldDef ? benchmarkFieldDef.label_short || benchmarkFieldDef.label : benchmarkField;

        // Parse values
        var metricValue = parseFloat(rowData[metricField].value);
        var benchmarkValue = parseFloat(rowData[benchmarkField].value);

        // Calculate percentage progress
        var progressPercent = benchmarkValue !== 0 ? (metricValue / benchmarkValue) * 100 : 0;

        // Calculate distance from benchmark
        var distanceFromBenchmark = benchmarkValue - metricValue;

        // Determine color based on distance from benchmark
        var barColor;
        if (distanceFromBenchmark <= config.amberThreshold) {
            barColor = config.greenColor;
        } else if (distanceFromBenchmark <= config.redThreshold) {
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

        // Update DOM
        var metricValueElement = element.querySelector('.metric-value');
        var metricLabelElement = element.querySelector('.metric-label');
        var progressBarFill = element.querySelector('.progress-bar-fill');
        var benchmarkLabelElement = element.querySelector('.benchmark-label');

        // Create lighter versions of the color for the progress bar
        var lightBarColor = lightenColor(barColor, 0.75);  // 75% lighter for filled portion
        var veryLightBarColor = lightenColor(barColor, 0.92);  // 92% lighter for unfilled portion

        // Apply responsive sizing
        metricValueElement.style.fontSize = (baseSize * 1.5) + 'px';
        metricLabelElement.style.fontSize = (baseSize * 0.45) + 'px';
        benchmarkLabelElement.style.fontSize = (baseSize * 0.35) + 'px';

        // Update progress bar height
        var progressBarBg = element.querySelector('.progress-bar-bg');
        progressBarBg.style.height = (baseSize * 0.9) + 'px';

        metricValueElement.textContent = formattedMetricValue;
        metricValueElement.style.color = barColor;  // Exact color
        metricLabelElement.textContent = metricLabel;
        metricLabelElement.style.color = barColor;  // Exact color

        progressBarFill.style.width = Math.min(progressPercent, 100) + '%';
        progressBarFill.style.backgroundColor = lightBarColor;  // Lighter color

        // Update background color of progress bar
        progressBarBg.style.backgroundColor = veryLightBarColor;  // Very light color

        benchmarkLabelElement.textContent = benchmarkLabel + ': ' + formattedBenchmarkValue;
        benchmarkLabelElement.style.color = barColor;  // Exact color on the bar

        doneRendering();
    }
};

looker.plugins.visualizations.add(visObject);
