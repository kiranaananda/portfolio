// --- SHARED UTILS ---
const dateParser = d3.timeParse("%Y-%m-%d");
const dateFormatter = d3.timeFormat("%b %Y"); 

function getTooltip() {
    let tooltip = d3.select("#global-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("id", "global-tooltip");
    }
    return tooltip;
}

// Helper to safely load CSV with fallback data
async function loadData(csvFilePath, fallbackKey) {
    const fileName = csvFilePath.split('/').pop();
    
    // Candidate path resolution to support GitHub Pages subfolder (/portfolio/) & relative paths
    const candidatePaths = [
        csvFilePath,
        `data/${fileName}`,
        `./data/${fileName}`,
        `/portfolio/data/${fileName}`,
        `../data/${fileName}`
    ];

    const uniquePaths = [...new Set(candidatePaths)];

    for (const path of uniquePaths) {
        try {
            const rawData = await d3.csv(path);
            if (rawData && rawData.length > 0) {
                return rawData;
            }
        } catch (e) {
            // Try next candidate path
        }
    }

    console.warn(`Could not fetch ${csvFilePath} from candidate paths, using embedded fallback dataset.`);
    if (fallbackKey === 'revenue') return JSON.parse(JSON.stringify(FALLBACK_REVENUE));
    return JSON.parse(JSON.stringify(FALLBACK_BRAND_PROFILES[fallbackKey] || FALLBACK_BRAND_PROFILES.lion));
}

// =========================================================
// CHART TYPE A: COMPETITOR COMPARISON (Lion vs Olio vs Festo)
// =========================================================
async function drawCompetitorChart(containerId, csvFilePath) {
    const data = await loadData(csvFilePath, 'revenue');
    const companies = ["Lion", "Olio", "Festo"];
    
    // Parse Data
    data.forEach(d => {
        if (typeof d.Date === 'string') d.Date = dateParser(d.Date) || new Date(d.Date);
        companies.forEach(c => d[c] = +d[c]);
    });

    // Setup Dimensions
    const wrapper = document.querySelector(containerId);
    if (!wrapper) return;
    const width = wrapper.clientWidth || 800;
    const height = 380;
    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const boundsWidth = width - margin.left - margin.right;
    const boundsHeight = height - margin.top - margin.bottom;

    // Draw SVG
    d3.select(containerId).html("");
    const svg = d3.select(containerId).append("svg")
        .attr("width", width)
        .attr("height", height);
        
    const bounds = svg.append("g")
        .style("transform", `translate(${margin.left}px, ${margin.top}px)`);

    // Scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, boundsWidth]);
    
    const allValues = data.flatMap(d => companies.map(c => d[c]));
    const yScale = d3.scaleLinear()
        .domain([d3.min(allValues) * 0.9, d3.max(allValues) * 1.1])
        .range([boundsHeight, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(companies)
        .range(["#FF6B6B", "#4ECDC4", "#FFE66D"]);

    // Axes
    bounds.append("g").call(d3.axisLeft(yScale).ticks(5));
    bounds.append("g")
        .style("transform", `translateY(${boundsHeight}px)`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(dateFormatter));

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
        .attr("class", d => `line-path line-${d.name}`)
        .attr("fill", "none")
        .attr("stroke-width", 3)
        .attr("d", d => lineGenerator(d.values))
        .attr("stroke", d => colorScale(d.name));

    // Labels at end of line
    bounds.selectAll(".label")
        .data(formattedData).enter().append("text")
        .attr("x", boundsWidth + 10)
        .attr("y", d => yScale(d.values[d.values.length - 1].value))
        .text(d => d.name)
        .style("fill", d => colorScale(d.name))
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    // Interaction
    addInteraction(bounds, boundsWidth, boundsHeight, data, xScale, companies, colorScale);
}

// =========================================================
// CHART TYPE B: BRAND PROFILE (Top of Mind vs Loyalty...)
// =========================================================
async function drawBrandChart(containerId, csvFilePath, brandKey) {
    const data = await loadData(csvFilePath, brandKey);
    const metrics = ["Top of Mind", "Spontaneous", "Regularly", "Most Often"];

    // Parse Data
    data.forEach(d => {
        if (typeof d.Date === 'string') d.Date = dateParser(d.Date) || new Date(d.Date);
        metrics.forEach(m => d[m] = +d[m]);
    });

    // Dimensions
    const width = 450; 
    const height = 300; 
    const margin = { top: 20, right: 15, bottom: 40, left: 35 };

    const boundsWidth = width - margin.left - margin.right;
    const boundsHeight = height - margin.top - margin.bottom;

    // Draw SVG
    d3.select(containerId).html("");
    
    const svg = d3.select(containerId).append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "auto")
        .style("display", "block");

    const bounds = svg.append("g")
        .style("transform", `translate(${margin.left}px, ${margin.top}px)`);

    // Scales
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

    // Axes
    const yAxis = d3.axisLeft(yScale).ticks(5);
    bounds.append("g")
        .call(yAxis)
        .style("font-size", "10px") 
        .style("color", "#888");

    const xAxis = d3.axisBottom(xScale)
        .ticks(4)
        .tickFormat(d3.timeFormat("%b %y"));
        
    bounds.append("g")
        .style("transform", `translateY(${boundsHeight}px)`)
        .call(xAxis)
        .style("font-size", "10px")
        .style("color", "#888");

    // Lines
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
        .attr("stroke-width", 2)
        .attr("d", d => lineGenerator(d.values))
        .attr("stroke", d => colorScale(d.name));

    // Interaction
    addInteraction(bounds, boundsWidth, boundsHeight, data, xScale, metrics, colorScale);
}

// =========================================================
// SHARED INTERACTION LOGIC (Fixed for D3 v7)
// =========================================================
function addInteraction(bounds, w, h, data, xScale, keys, colorScale) {
    const tooltip = getTooltip();
    
    const hoverLine = bounds.append("line")
        .attr("y1", 0).attr("y2", h)
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "4 4")
        .style("opacity", 0);

    bounds.append("rect")
        .attr("width", w).attr("height", h)
        .attr("fill", "transparent")
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event);
            const hoveredDate = xScale.invert(mouseX);
            
            // Distance calculation
            const getDist = d => Math.abs(d.Date - hoveredDate);
            
            // FIXED FOR D3 v7: Replaced deprecated `d3.scan` with `d3.leastIndex`
            const closestIndex = d3.leastIndex ? d3.leastIndex(data, (a, b) => getDist(a) - getDist(b)) : 0;
            const d = data[closestIndex];

            if (d) {
                const x = xScale(d.Date);
                hoverLine.style("opacity", 1).attr("x1", x).attr("x2", x);
                
                // Sort keys by value (highest on top)
                const sortedKeys = keys.slice().sort((a, b) => d[b] - d[a]);

                let html = `<span class="tooltip-date">${dateFormatter(d.Date)}</span>`;
                sortedKeys.forEach(k => {
                    html += `<div class="tooltip-row">
                        <span><span class="color-dot" style="background:${colorScale(k)}"></span>${k}</span>
                        <b>${d[k] ? d[k].toLocaleString() : 0}</b>
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
document.addEventListener("DOMContentLoaded", function () {
    drawCompetitorChart("#wrapper-revenue", "data/data_revenue.csv");

    drawBrandChart("#chart-lion",  "data/data_lion.csv", "lion");
    drawBrandChart("#chart-olio",  "data/data_olio.csv", "olio");
    drawBrandChart("#chart-festo", "data/data_festo.csv", "festo");
});
