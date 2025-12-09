// Waiting until document has loaded
window.onload = () => {

    console.log("Document loaded. Starting D3...");

    // Helper: try multiple possible header names and return the first non-empty value
    function getField(d, candidates) {
        for (let key of candidates) {
            // Trim keys to handle accidental whitespace in CSV headers
            let foundKey = Object.keys(d).find(k => k.trim() === key);
            if (foundKey && d[foundKey] !== "" && d[foundKey] !== undefined) {
                return d[foundKey];
            }
        }
        return undefined;
    }

    // Helper to parse numbers and strip common non-numeric characters
    function toNumber(val) {
        if (val === undefined || val === null) return NaN;
        let cleaned = String(val).replace(/[$,()]/g, "").trim();
        cleaned = cleaned.replace(/\s+/g, " ");
        let n = parseFloat(cleaned);
        return isNaN(n) ? NaN : n;
    }

    // Candidate header names
    const HP_KEYS = ['Horsepower', 'Horsepower(HP)', 'Horsepower (HP)', 'HP'];
    const RETAIL_KEYS = ['Retail Price', 'RetailPrice', 'Retail_Price'];
    const DEALER_KEYS = ['Dealer Cost', 'DealerCost', 'Dealer_Cost'];
    const ENGINE_KEYS = ['Engine Size', 'EngineSize', 'Engine Size (l)', 'Engine Size (L)'];
    const CITYMPG_KEYS = ['City Miles Per Gallon', 'CityMPG', 'City Miles Per\nGallon'];
    const NAME_KEYS = ['Name', 'Model', 'Vehicle'];
    const TYPE_KEYS = ['Type', 'Body Type', 'BodyType'];

    // SVG / chart dimensions
    const width = 800;
    const height = 600;
    const margin = { top: 40, right: 150, bottom: 60, left: 80 };

    // Select the DIV we added to index.html
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Load CSV
    d3.csv("cars.csv").then(function(rawData) {
        
        console.log("Raw Data Loaded:", rawData.length, "rows");

        // Map and normalize data
        const data = rawData.map(d => {
            return {
                raw: d,
                Name: getField(d, NAME_KEYS) || "Unknown",
                Type: getField(d, TYPE_KEYS) || "Unknown",
                Horsepower: toNumber(getField(d, HP_KEYS)),
                RetailPrice: toNumber(getField(d, RETAIL_KEYS)),
                DealerCost: toNumber(getField(d, DEALER_KEYS)),
                EngineSize: toNumber(getField(d, ENGINE_KEYS)),
                CityMPG: toNumber(getField(d, CITYMPG_KEYS))
            };
        });

        // Filter out bad rows
        const filtered = data.filter(d => 
            !isNaN(d.Horsepower) && 
            !isNaN(d.RetailPrice) && 
            !isNaN(d.EngineSize) && 
            !isNaN(d.CityMPG)
        );

        console.log("Filtered Data:", filtered.length, "rows");

        if (filtered.length === 0) {
            svg.append("text")
                .attr("x", 20).attr("y", 20)
                .text("No valid data found. Check CSV headers.")
                .style("fill", "red");
            return;
        }

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(filtered, d => d.Horsepower)])
            .nice()
            .range([margin.left, width - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filtered, d => d.RetailPrice)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain(d3.extent(filtered, d => d.EngineSize));

        const sizeScale = d3.scaleLinear()
            .domain(d3.extent(filtered, d => d.CityMPG))
            .range([3, 10]);

        // Axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(xAxis);

        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis);

        // Axis Labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", (width - margin.left - margin.right)/2 + margin.left)
            .attr("y", height - 15)
            .attr("text-anchor", "middle")
            .text("Horsepower (HP)");

        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .text("Retail Price (USD)");

        // Draw Circles
        svg.selectAll(".dot")
            .data(filtered)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.Horsepower))   
            .attr("cy", d => yScale(d.RetailPrice))  
            .attr("r", d => sizeScale(d.CityMPG))    
            .attr("fill", d => colorScale(d.EngineSize))
            .attr("opacity", 0.7)
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .style("cursor", "pointer")
            .on("click", function(d) {
                // Highlight selected circle
                svg.selectAll(".dot")
                    .attr("stroke-width", 0.5)
                    .attr("opacity", 0.7);
                
                d3.select(this)
                    .attr("stroke-width", 2.5)
                    .attr("opacity", 1);
                
                showDetails(d);
            })
            .on("mouseover", function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("stroke-width", 2);
            })
            .on("mouseout", function() {
                const currentWidth = d3.select(this).attr("stroke-width");
                if (currentWidth != 2.5) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("stroke-width", 0.5);
                }
            });

        // Color Legend (Engine Size)
        const legendX = width - margin.right + 20;
        const legendY = margin.top;
        
        svg.append("text")
            .attr("x", legendX)
            .attr("y", legendY - 10)
            .text("Engine Size (L)")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        const legendData = d3.range(5).map(i => {
            const domain = d3.extent(filtered, d => d.EngineSize);
            return domain[0] + (i * (domain[1] - domain[0]) / 4);
        });

        const legendGroup = svg.append("g");
        
        legendGroup.selectAll("rect")
            .data(legendData)
            .enter()
            .append("rect")
            .attr("x", legendX)
            .attr("y", (d, i) => legendY + i * 20)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => colorScale(d));

        legendGroup.selectAll("text")
            .data(legendData)
            .enter()
            .append("text")
            .attr("x", legendX + 25)
            .attr("y", (d, i) => legendY + i * 20 + 15)
            .text(d => d.toFixed(1))
            .style("font-size", "11px");

        // Size Legend (City MPG)
        const sizeLegendY = legendY + 140;
        
        svg.append("text")
            .attr("x", legendX)
            .attr("y", sizeLegendY - 10)
            .text("City MPG")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        const sizeExtent = d3.extent(filtered, d => d.CityMPG);
        const sizeLegendData = [
            { mpg: sizeExtent[0], label: Math.round(sizeExtent[0]) },
            { mpg: (sizeExtent[0] + sizeExtent[1]) / 2, label: Math.round((sizeExtent[0] + sizeExtent[1]) / 2) },
            { mpg: sizeExtent[1], label: Math.round(sizeExtent[1]) }
        ];

        const sizeLegendGroup = svg.append("g");
        
        sizeLegendGroup.selectAll("circle")
            .data(sizeLegendData)
            .enter()
            .append("circle")
            .attr("cx", legendX + 10)
            .attr("cy", (d, i) => sizeLegendY + i * 25 + 10)
            .attr("r", d => sizeScale(d.mpg))
            .attr("fill", "none")
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        sizeLegendGroup.selectAll("text")
            .data(sizeLegendData)
            .enter()
            .append("text")
            .attr("x", legendX + 25)
            .attr("y", (d, i) => sizeLegendY + i * 25 + 13)
            .text(d => d.label)
            .style("font-size", "11px");

        // Details Function
        function showDetails(d) {
            const panel = d3.select("#details");
            panel.html(`
                <h3>${d.Name}</h3>
                <p><strong>Type:</strong> ${d.Type}</p>
                <p><strong>Retail Price:</strong> $${d.RetailPrice.toLocaleString()}</p>
                <p><strong>Horsepower:</strong> ${d.Horsepower} HP</p>
                <p><strong>Engine Size:</strong> ${d.EngineSize} L</p>
                <p><strong>City MPG:</strong> ${d.CityMPG}</p>
            `);
        }

    }).catch(function(error) {
        console.error("Error loading CSV:", error);
        d3.select("#chart").html("<p style='color:red'>Error loading CSV. Check console for details.</p>");
    });
};
