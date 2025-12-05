/**
 * Metric with Progress Bar Visualization
 * Displays a single metric value with a progress bar showing progress towards a benchmark
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
                }
                .metric-value {
                    font-size: 4em;
                    font-weight: 500;
                    margin: 0;
                    line-height: 1;
                }
                .metric-label {
                    font-size: 1.2em;
                    color: #5f6368;
                    margin: 10px 0 20px 0;
                }
                .progress-container {
                    width: 100%;
                    max-width: 400px;
                }
                .progress-bar-bg {
                    width: 100%;
                    height: 30px;
                    background-color: #e8eaed;
                    border-radius: 15px;
                    overflow: hidden;
                    position: relative;
                }
                .progress-bar-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                    border-radius: 15px;
                }
                .benchmark-label {
                    font-size: 0.9em;
                    color: #5f6368;
                    margin-top: 8px;
                    text-align: center;
                }
            </style>
            <div class="metric-container">
                <div class="metric-value"></div>
                <div class="metric-label"></div>
                <div class="progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill"></div>
                    </div>
                    <div class="benchmark-label"></div>
                </div>
            </div>
        `;
    },

    updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
        // Clear any errors
        this.clearErrors();

        // Validate we have data
        if (!data || data.length === 0) {
            this.addError({
                title: 'No Data',
                message: 'No data available to display.'
            });
            return;
        }

        // Get all fields
        var fields = queryResponse.fields.dimensions.map(field => field.name)
            .concat(queryResponse.fields.measures.map(field => field.name))
            .concat(queryResponse.fields.table_calculations.map(field => field.name));

        // Validate we have at least 2 fields (metric and benchmark)
        if (fields.length < 2) {
            this.addError({
                title: 'Insufficient Fields',
                message: 'This visualization requires at least 2 fields: a metric value and a benchmark value.'
            });
            return;
        }

        var rowData = data[0];

        // Get metric and benchmark fields
        var metricField = fields[0];
        var benchmarkField = fields[1];

        // Validate fields exist in data
        if (!rowData[metricField] || !rowData[benchmarkField]) {
            this.addError({
                title: 'Field Not Found',
                message: 'Could not find metric or benchmark field in data. Available fields: ' + Object.keys(rowData).join(', ')
            });
            return;
        }

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

        // Update DOM
        var metricValueElement = element.querySelector('.metric-value');
        var metricLabelElement = element.querySelector('.metric-label');
        var progressBarFill = element.querySelector('.progress-bar-fill');
        var benchmarkLabelElement = element.querySelector('.benchmark-label');

        metricValueElement.textContent = formattedMetricValue;
        metricValueElement.style.color = config.metricColor;
        metricLabelElement.textContent = metricLabel;

        progressBarFill.style.width = Math.min(progressPercent, 100) + '%';
        progressBarFill.style.backgroundColor = barColor;

        benchmarkLabelElement.textContent = benchmarkLabel + ': ' + formattedBenchmarkValue;

        doneRendering();
    }
};

looker.plugins.visualizations.add(visObject);
