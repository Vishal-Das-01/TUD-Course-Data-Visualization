// Star Plot Visualization
window.onload = () => {
    console.log("Document loaded. Starting Star Plot...");

    // Helper functions
    function getField(d, candidates) {
        for (let key of candidates) {
            let foundKey = Object.keys(d).find(k => k.trim() === key);
            if (foundKey && d[foundKey] !== "" && d[foundKey] !== undefined) {
                return d[foundKey];
            }
        }
        return undefined;
    }

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
    const ENGINE_KEYS = ['Engine Size', 'EngineSize', 'Engine Size (l)', 'Engine Size (L)'];
    const CITYMPG_KEYS = ['City Miles Per Gallon', 'CityMPG', 'City Miles Per\nGallon'];
    const HIGHWAYMPG_KEYS = ['Highway Miles Per Gallon', 'HighwayMPG', 'Highway Miles Per\nGallon'];
    const WEIGHT_KEYS = ['Weight', 'weight'];
    const NAME_KEYS = ['Name', 'Model', 'Vehicle'];
    const TYPE_KEYS = ['Type', 'Body Type', 'BodyType'];

    // Six attributes for star plot
    const attributes = [
        { key: 'Horsepower', label: 'Horsepower', keys: HP_KEYS },
        { key: 'RetailPrice', label: 'Price ($)', keys: RETAIL_KEYS },
        { key: 'EngineSize', label: 'Engine (L)', keys: ENGINE_KEYS },
        { key: 'CityMPG', label: 'City MPG', keys: CITYMPG_KEYS },
        { key: 'HighwayMPG', label: 'Highway MPG', keys: HIGHWAYMPG_KEYS },
        { key: 'Weight', label: 'Weight (lbs)', keys: WEIGHT_KEYS }
    ];

    // SVG dimensions
    const width = 600;
    const height = 600;
    const radius = 220;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Load CSV
    d3.csv("cars.csv").then(function(rawData) {
        console.log("Raw Data Loaded:", rawData.length, "rows");

        // Parse data
        const data = rawData.map(d => {
            return {
                Name: getField(d, NAME_KEYS) || "Unknown",
                Type: getField(d, TYPE_KEYS) || "Unknown",
                Horsepower: toNumber(getField(d, HP_KEYS)),
                RetailPrice: toNumber(getField(d, RETAIL_KEYS)),
                EngineSize: toNumber(getField(d, ENGINE_KEYS)),
                CityMPG: toNumber(getField(d, CITYMPG_KEYS)),
                HighwayMPG: toNumber(getField(d, HIGHWAYMPG_KEYS)),
                Weight: toNumber(getField(d, WEIGHT_KEYS))
            };
        });

        // Filter valid data
        const filtered = data.filter(d => 
            !isNaN(d.Horsepower) && 
            !isNaN(d.RetailPrice) && 
            !isNaN(d.EngineSize) && 
            !isNaN(d.CityMPG) &&
            !isNaN(d.HighwayMPG) &&
            !isNaN(d.Weight)
        );

        console.log("Filtered Data:", filtered.length, "rows");

        if (filtered.length === 0) {
            svg.append("text")
                .attr("x", 20).attr("y", 20)
                .text("No valid data found.")
                .style("fill", "red");
            return;
        }

        // Create scales for each attribute
        const scales = {};
        attributes.forEach(attr => {
            scales[attr.key] = d3.scaleLinear()
                .domain([0, d3.max(filtered, d => d[attr.key])])
                .range([0, radius]);
        });

        // Populate dropdown
        const select = d3.select("#carSelect");
        select.selectAll("option")
            .data(filtered)
            .enter()
            .append("option")
            .text(d => d.Name)
            .attr("value", (d, i) => i);

        // Draw star plot
        function drawStarPlot(carData) {
            // Clear previous plot
            svg.selectAll("*").remove();

            // Draw grid circles
            const gridLevels = [0.25, 0.5, 0.75, 1.0];
            svg.selectAll(".grid-circle")
                .data(gridLevels)
                .enter()
                .append("circle")
                .attr("class", "grid-circle")
                .attr("cx", centerX)
                .attr("cy", centerY)
                .attr("r", d => d * radius);

            // Draw axes
            const angleStep = (2 * Math.PI) / attributes.length;
            
            attributes.forEach((attr, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x2 = centerX + radius * Math.cos(angle);
                const y2 = centerY + radius * Math.sin(angle);

                // Axis line
                svg.append("line")
                    .attr("class", "axis-line")
                    .attr("x1", centerX)
                    .attr("y1", centerY)
                    .attr("x2", x2)
                    .attr("y2", y2);

                // Axis label
                const labelDistance = radius + 30;
                const labelX = centerX + labelDistance * Math.cos(angle);
                const labelY = centerY + labelDistance * Math.sin(angle);

                svg.append("text")
                    .attr("class", "axis-label")
                    .attr("x", labelX)
                    .attr("y", labelY)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .text(attr.label);
            });

            // Calculate star points
            const starPoints = attributes.map((attr, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const value = carData[attr.key];
                const scaledValue = scales[attr.key](value);
                
                return {
                    x: centerX + scaledValue * Math.cos(angle),
                    y: centerY + scaledValue * Math.sin(angle),
                    value: value,
                    label: attr.label
                };
            });

            // Draw star polygon
            const lineGenerator = d3.line()
                .x(d => d.x)
                .y(d => d.y);

            svg.append("path")
                .datum(starPoints.concat([starPoints[0]])) // Close the path
                .attr("class", "star-path")
                .attr("d", lineGenerator);

            // Draw data points
            svg.selectAll(".data-point")
                .data(starPoints)
                .enter()
                .append("circle")
                .attr("class", "data-point")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", 5);

            // Update details panel
            showDetails(carData);
        }

        // Show details
        function showDetails(d) {
            const panel = d3.select("#details");
            panel.html(`
                <h3>${d.Name}</h3>
                <p><strong>Type:</strong> ${d.Type}</p>
                <p><strong>Horsepower:</strong> ${d.Horsepower} HP</p>
                <p><strong>Retail Price:</strong> $${d.RetailPrice.toLocaleString()}</p>
                <p><strong>Engine Size:</strong> ${d.EngineSize} L</p>
                <p><strong>City MPG:</strong> ${d.CityMPG}</p>
                <p><strong>Highway MPG:</strong> ${d.HighwayMPG}</p>
                <p><strong>Weight:</strong> ${d.Weight.toLocaleString()} lbs</p>
            `);
        }

        // Event listener for dropdown
        select.on("change", function() {
            const selectedIndex = this.value;
            const selectedCar = filtered[selectedIndex];
            drawStarPlot(selectedCar);
        });

        // Draw initial star plot
        drawStarPlot(filtered[0]);

    }).catch(function(error) {
        console.error("Error loading CSV:", error);
        d3.select("#chart").html("<p style='color:red'>Error loading CSV.</p>");
    });
};
