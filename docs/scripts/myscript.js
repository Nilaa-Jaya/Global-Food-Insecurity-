// add your JavaScript/D3 to this file
// Set up SVG dimensions and map projection
const width = 960, height = 600;

const svg = d3.select("#plot").append("svg")
    .attr("width", width)
    .attr("height", height);

const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

let colorScale;

Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("data_files/r_cleaned_data.csv")
]).then(([world, data]) => {
    const dataByCountryYear = {};
    data.forEach(d => {
        const key = `${d.iso3c}_${d.year}`;
        dataByCountryYear[key] = {
            value: +d.value,
            type: d.type
        };
    });

    let currentYear = 1999;

    // Function to update the color scale and map
    const updateMap = () => {
        const currentYearValues = data
            .filter(d => +d.year === +currentYear && +d.value > 0)
            .map(d => +d.value);

        if (currentYearValues.length === 0) return;

        const minValue = Math.min(...currentYearValues);
        const maxValue = Math.max(...currentYearValues);

        colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([Math.log10(minValue + 1), Math.log10(maxValue + 1)]);

        svg.selectAll("path")
            .attr("fill", d => {
                const key = `${d.id}_${currentYear}`;
                const value = dataByCountryYear[key]?.value;
                return value && value > 0 ? colorScale(Math.log10(value + 1)) : "#ccc";
            });

        updateLegend(minValue, maxValue);
    };

    // Function to create and update legend
    const updateLegend = (minValue, maxValue) => {
        const legendWidth = 300, legendHeight = 20;

        d3.select("#legend").remove();

        const legendGroup = svg.append("g")
            .attr("id", "legend")
            .attr("transform", `translate(${width - legendWidth - 50},${height - 40})`);

        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(Math.log10(minValue + 1)));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(Math.log10(maxValue + 1)));

        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        legendGroup.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -10)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Population");

        legendGroup.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 15)
            .style("text-anchor", "start")
            .text(Math.round(minValue));

        legendGroup.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 15)
            .style("text-anchor", "end")
            .text(Math.round(maxValue));
    };

    // Draw the map
    const countries = svg.selectAll("path")
        .data(world.features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "#333")
        .on("mouseover", (event, d) => {
            const key = `${d.id}_${currentYear}`;
            const data = dataByCountryYear[key];
            const tooltipContent = data
                ? `<strong>${d.properties.name}</strong><br>Year: ${currentYear}<br>Value: ${data.value}<br>Type: ${data.type}`
                : `<strong>${d.properties.name}</strong><br>No data available`;

            d3.select("#tooltip")
                .style("opacity", 1)
                .html(tooltipContent)
                .style("left", `${Math.min(event.pageX + 10, width - 150)}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => {
            d3.select("#tooltip").style("opacity", 0);
        });

    // Add a graph title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "26px")
        .style("font-weight", "bold")
        .text("Global Food Insecurity Trends (1999–2028): A Population Perspective");

    // Add year slider title
    d3.select("#plot").append("div")
        .attr("id", "year-slider-title")
        .style("text-align", "center")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("margin-bottom", "10px")
        .text("Select Year");

    // Add year slider
    d3.select("#plot").append("input")
        .attr("type", "range")
        .attr("min", 1999)
        .attr("max", 2028)
        .attr("value", 1999)
        .style("width", "300px")
        .style("margin", "10px auto")
        .style("display", "block")
        .style("background", "linear-gradient(to right, red, #ffcccc)")
        .style("outline", "none")
        .on("input", function () {
            currentYear = this.value;
            d3.select("#current-year").text(currentYear);
            updateMap();
        });

    // Display current year
    d3.select("#plot").append("div")
        .attr("id", "current-year")
        .style("text-align", "center")
        .style("font-size", "16px")
        .style("margin-top", "5px")
        .text(currentYear);

    // Tooltip setup
    d3.select("#plot").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("opacity", 0);

    updateMap();
}).catch(err => console.error("Data Load Error:", err));
