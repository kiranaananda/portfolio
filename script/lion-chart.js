// --- SHARED UTILS ---
const dateParser = d3.timeParse("%Y-%m-%d");
const dateFormatter = d3.timeFormat("%b %Y"); 

// Helper to get or create the shared tooltip
function getTooltip() {
    let tooltip = d3.select("#global-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("id", "global-tooltip");
    }
    return tooltip;
}

// =========================================================
// CHART TYPE A: COMPETITOR COMPARISON (Lion vs Olio...)
// =========================================================
async function drawCompetitorChart(containerId, csvFilePath) {
    const data = await d3.csv(csvFilePath);
    const companies = ["Lion", "Olio", "Festo"];
    
    // Parse Data
    data.forEach(d => {
        d.Date = dateParser(d.Date);
        companies.forEach(c => d[c] = +d[c]);
    });

    // Setup Dimensions
    const wrapper = document.querySelector(containerId);
    if (!wrapper) return; // Safety check
    const width = wrapper.clientWidth;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const boundsWidth = width - margin.left - margin.right;
    const boundsHeight = height - margin.top - margin.bottom;

    // Draw SVG
    d3.select(containerId).html("");
    const svg = d3.select(containerId).append("svg")
        .attr("width", width).attr("height", height);
    const bounds = svg.append("g")
        .style("transform", `translate(${margin.left}px, ${margin.top}px)`);

    // Scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, boundsWidth]);
    
    const allValues = data.flatMap(d => companies.map(c => d[c]));
    const yScale = d3.scaleLinear()
        .domain([d3.min(allValues)*0.9, d3.max(allValues)*1.1])
        .range([boundsHeight, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(companies)
        .range(["#FF6B6B", "#4ECDC4", "#FFE66D"]); // Company Colors

    // Axes
    bounds.append("g").call(d3.axisLeft(yScale).ticks(5));
    bounds.append("g").style("transform", `translateY(${boundsHeight}px)`)
        .call(d3.axisBottom(xScale).ticks(6));

    // Lines
    const lineGenerator = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    const formattedData = companies.map(c => ({
        name: c,
        values: data.map(d => ({ Date: d.Date, value: d[c] }))
    }));

    bounds.selectAll(".line-path")
        .data(formattedData).enter().append("path")
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke-width", 3)
        .attr("d", d => lineGenerator(d.values))
        .attr("stroke", d => colorScale(d.name));

    // Labels at end of line
    bounds.selectAll(".label")
        .data(formattedData).enter().append("text")
        .attr("x", boundsWidth + 10)
        .attr("y", d => yScale(d.values[d.values.length-1].value))
        .text(d => d.name)
        .style("fill", d => colorScale(d.name))
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    // Interaction
    addInteraction(bounds, width, height, data, xScale, companies, colorScale);
}

// =========================================================
// CHART TYPE B: BRAND PROFILE (Top of Mind vs Loyalty...)
// =========================================================
async function drawBrandChart(containerId, csvFilePath) {
    const data = await d3.csv(csvFilePath);
    const metrics = ["Top of Mind", "Spontaneous", "Regularly", "Most Often"];

    // 1. Parse Data
    data.forEach(d => {
        d.Date = dateParser(d.Date);
        metrics.forEach(m => d[m] = +d[m]);
    });

    // 2. SETUP FLUID DIMENSIONS
    // We draw on a virtual canvas of 450x300. 
    // This aspect ratio (3:2) looks good in columns.
    const width = 450; 
    const height = 300; 
    const margin = { top: 20, right: 15, bottom: 40, left: 35 };

    const boundsWidth = width - margin.left - margin.right;
    const boundsHeight = height - margin.top - margin.bottom;

    // 3. DRAW SVG (Responsive)
    d3.select(containerId).html("");
    
    const svg = d3.select(containerId).append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "auto")
        .style("display", "block"); // Removes bottom whitespace

    const bounds = svg.append("g")
        .style("transform", `translate(${margin.left}px, ${margin.top}px)`);

    // 4. SCALES
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, boundsWidth]);
    
    const allValues = data.flatMap(d => metrics.map(m => d[m]));
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(allValues) * 1.1])
        .range([boundsHeight, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(metrics)
        .range(["#A0C4FF", "#72EFDD", "#FFD166", "#EF476F"]);

    // 5. DRAW AXES (With slightly smaller text for clean look)
    const yAxis = d3.axisLeft(yScale).ticks(5);
    bounds.append("g")
        .call(yAxis)
        .style("font-size", "10px") 
        .style("color", "#888");

    const xAxis = d3.axisBottom(xScale)
        .ticks(4) // Only 4 dates to prevent overlapping
        .tickFormat(d3.timeFormat("%b %y")); // Short date (e.g., Apr 16)
        
    bounds.append("g")
        .style("transform", `translateY(${boundsHeight}px)`)
        .call(xAxis)
        .style("font-size", "10px")
        .style("color", "#888");

    // 6. DRAW LINES
    const lineGenerator = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    const formattedData = metrics.map(m => ({
        name: m,
        values: data.map(d => ({ Date: d.Date, value: d[m] }))
    }));

    bounds.selectAll(".line-path")
        .data(formattedData).enter().append("path")
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke-width", 2) // Thinner lines look cleaner in small columns
        .attr("d", d => lineGenerator(d.values))
        .attr("stroke", d => colorScale(d.name));

    // 7. INTERACTION
    // We pass the boundsWidth/Height so the hover line matches the SVG coordinates
    addInteraction(bounds, boundsWidth, boundsHeight, data, xScale, metrics, colorScale);
}

// =========================================================
// SHARED INTERACTION LOGIC (The Hover Magic)
// =========================================================
function addInteraction(bounds, w, h, data, xScale, keys, colorScale) {
    const tooltip = getTooltip();
    
    const hoverLine = bounds.append("line")
        .attr("y1", 0).attr("y2", h)
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "4 4")
        .style("opacity", 0);

    const listeningRect = bounds.append("rect")
        .attr("width", w).attr("height", h)
        .attr("fill", "transparent")
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event);
            const hoveredDate = xScale.invert(mouseX);
            
            // Find closest date
            const getDist = d => Math.abs(d.Date - hoveredDate);
            const closestIndex = d3.scan(data, (a, b) => getDist(a) - getDist(b));
            const d = data[closestIndex];

            if (d) {
                const x = xScale(d.Date);
                hoverLine.style("opacity", 1).attr("x1", x).attr("x2", x);
                
                // Sort keys by value (highest on top)
                const sortedKeys = keys.slice().sort((a,b) => d[b] - d[a]);

                let html = `<span class="tooltip-date">${dateFormatter(d.Date)}</span>`;
                sortedKeys.forEach(k => {
                    html += `<div class="tooltip-row">
                        <span><span class="color-dot" style="background:${colorScale(k)}"></span>${k}</span>
                        <b>${d[k].toLocaleString()}</b>
                    </div>`;
                });

                tooltip.style("opacity", 1).html(html)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            }
        })
        .on("mouseleave", () => {
            hoverLine.style("opacity", 0);
            tooltip.style("opacity", 0);
        });
}

// =========================================================
// EXECUTE
// =========================================================

// 1. Draw the Competitor Chart
drawCompetitorChart("#wrapper-revenue", "./data_revenue.csv");

// 2. Draw the Brand Charts
drawBrandChart("#chart-lion",  "./data_lion.csv");
drawBrandChart("#chart-olio",  "./data_olio.csv");
drawBrandChart("#chart-festo", "./data_festo.csv");
