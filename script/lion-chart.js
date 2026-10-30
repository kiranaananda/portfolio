// --- SHARED UTILS ---
const dateFormatter = d3.timeFormat("%b %Y"); 

function getTooltip() {
    let tooltip = d3.select("#global-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("id", "global-tooltip");
    }
    return tooltip;
}

// Flexible Date Parser handling various CSV date formats
function parseFlexibleDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const str = String(dateStr).trim();
    
    const formats = [
        d3.timeParse("%Y-%m-%d"),
        d3.timeParse("%Y/%m/%d"),
        d3.timeParse("%d-%m-%Y"),
        d3.timeParse("%d/%m/%Y"),
        d3.timeParse("%m/%d/%Y"),
        d3.timeParse("%b %Y"),
        d3.timeParse("%b %y"),
        d3.timeParse("%b-%Y"),
        d3.timeParse("%b-%y"),
        d3.timeParse("%Y-%m")
    ];

    for (const fmt of formats) {
        const parsed = fmt(str);
        if (parsed && !isNaN(parsed.getTime())) return parsed;
    }

    const jsDate = new Date(str);
    if (!isNaN(jsDate.getTime())) return jsDate;

    return null;
}

// Safe case-insensitive getter for CSV row keys
function getRowValue(row, colName) {
    if (row[colName] !== undefined && !isNaN(+row[colName])) return +row[colName];
    const target = colName.toLowerCase().trim();
    for (const key of Object.keys(row)) {
        if (key.toLowerCase().trim() === target) {
            return +row[key] || 0;
        }
    }
    return 0;
}

// Find Date column safely regardless of header casing
function getRowDate(row) {
    for (const key of Object.keys(row)) {
        if (key.toLowerCase().trim() === "date") {
            return parseFlexibleDate(row[key]);
        }
    }
    return parseFlexibleDate(row.Date || row.date);
}

// Helper to safely load CSV across candidate paths
async function loadData(csvFilePath) {
    const fileName = csvFilePath.split('/').pop();
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);

    // Candidate path resolution for GitHub Pages subfolders (/portfolio/) & local servers
    const candidatePaths = [
        csvFilePath,
        `${currentDir}${fileName}`,
        `${currentDir}data/${fileName}`,
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
                console.log(`[Chart Success] Loaded CSV from: ${path}`);
                // Clean up BOM and whitespace in column keys
                rawData.forEach(row => {
                    Object.keys(row).forEach(key => {
                        const cleanKey = key.trim().replace(/^\uFEFF/, '');
                        if (cleanKey !== key) {
                            row[cleanKey] = row[key];
                        }
                    });
                });
                return rawData;
            }
        } catch (e) {
            // Try next path
        }
    }

    console.error(`[Chart Error] Could not fetch "${csvFilePath}". Tried paths:`, uniquePaths);
    return [];
}

// =========================================================
// CHART TYPE A: COMPETITOR COMPARISON (Lion vs Olio vs Festo)
// =========================================================
async function drawCompetitorChart(containerId, csvFilePath) {
    const data = await loadData(csvFilePath);
    if (!data || data.length === 0) {
        console.warn(`[Chart Warning] No data available for ${containerId}`);
        return;
    }
    const companies = ["Lion", "Olio", "Festo"];
    
    // Parse & Validate Data
    const cleanData = [];
    data.forEach(d => {
        const parsedDate = getRowDate(d);
        if (parsedDate) {
            const rowObj = { Date: parsedDate };
            companies.forEach(c => {
                rowObj[c] = getRowValue(d, c);
            });
            cleanData.push(rowObj);
        }
    });

    if (cleanData.length === 0) {
        console.error(`[Chart Error] Failed to parse valid dates in ${csvFilePath}`);
        return;
    }

    // Sort chronologically
    cleanData.sort((a, b) => a.Date - b.Date);

    // Setup Dimensions
    const wrapper = document.querySelector(containerId);
    if (!wrapper) {
        console.error(`[Chart Error] Element ${containerId} not found in DOM`);
        return;
    }
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
        .domain(d3.extent(cleanData, d => d.Date))
        .range([0, boundsWidth]);
    
    const allValues = cleanData.flatMap(d => companies.map(c => d[c]));
    const minY = d3.min(allValues) || 0;
    const maxY = d3.max(allValues) || 100;

    const yScale = d3.scaleLinear()
        .domain([minY * 0.9, maxY * 1.1])
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
        values: cleanData.map(d => ({ Date: d.Date, value: d[c] }))
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
    addInteraction(bounds, boundsWidth, boundsHeight, cleanData, xScale, companies, colorScale);
}

// =========================================================
// CHART TYPE B: BRAND PROFILE (Top of Mind vs Loyalty...)
// =========================================================
async function drawBrandChart(containerId, csvFilePath) {
    const data = await loadData(csvFilePath);
    if (!data || data.length === 0) return;
    const metrics = ["Top of Mind", "Spontaneous", "Regularly", "Most Often"];

    // Parse & Validate Data
    const cleanData = [];
    data.forEach(d => {
        const parsedDate = getRowDate(d);
        if (parsedDate) {
            const rowObj = { Date: parsedDate };
            metrics.forEach(m => {
                rowObj[m] = getRowValue(d, m);
            });
            cleanData.push(rowObj);
        }
    });

    if (cleanData.length === 0) return;
    cleanData.sort((a, b) => a.Date - b.Date);

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
        .domain(d3.extent(cleanData, d => d.Date))
        .range([0, boundsWidth]);
    
    const allValues = cleanData.flatMap(d => metrics.map(m => d[m]));
    const maxY = d3.max(allValues) || 100;

    const yScale = d3.scaleLinear()
        .domain([0, maxY * 1.1])
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
        values: cleanData.map(d => ({ Date: d.Date, value: d[m] }))
    }));

    bounds.selectAll(".line-path")
        .data(formattedData).enter().append("path")
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("d", d => lineGenerator(d.values))
        .attr("stroke", d => colorScale(d.name));

    // Interaction
    addInteraction(bounds, boundsWidth, boundsHeight, cleanData, xScale, metrics, colorScale);
}

// =========================================================
// SHARED INTERACTION LOGIC
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
// EXECUTE (Handles DOM ready timing safely)
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
            
            // Find closest date (handles D3 v7 leastIndex & legacy scan)
            const getDist = d => Math.abs(d.Date - hoveredDate);
            const closestIndex = d3.leastIndex 
                ? d3.leastIndex(data, (a, b) => getDist(a) - getDist(b))
                : (d3.scan ? d3.scan(data, (a, b) => getDist(a) - getDist(b)) : 0);
                
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

function initCharts() {
    // 1. Draw the Competitor Chart
    drawCompetitorChart("#wrapper-revenue", "data/data_revenue.csv");

    // 2. Draw the Brand Charts
    drawBrandChart("#chart-lion",  "data/data_lion.csv");
    drawBrandChart("#chart-olio",  "data/data_olio.csv");
    drawBrandChart("#chart-festo", "data/data_festo.csv");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCharts);
} else {
    initCharts();
}
