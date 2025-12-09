# DataVis Assignment 2

This repository contains the bare-bones files to start up and solve the second assignment of the DataVis course at TU Dresden. 

It also contains the sample cars.csv dataset -- remember, it contains some errors! 

## Local development: 
Pre-requisite: [Node.js](https://nodejs.org/en). Install `serve` using: 
> npm install serve --global 

And start the application using 
> serve -p 8000 

You should then be able to see your website at [http://localhost:8000](http://localhost:8000). 

*Note:* feel free to explore other development environments such as [Vite](https://vite.dev/), [Flask (python)](https://flask.palletsprojects.com/en/stable/), etc. 

## Debugging: 
Feel free to make extensive use of your browser's development tools! 
In chrome-based browsers, you can simply use Ctrl+J to open the browser console, which will show all the `console.log` and similar that you write in the code. 


---

## Scatterplot Visualization

### Four Encoded Attributes:
1. **X-axis (Position)**: Horsepower (HP) - Shows engine power
2. **Y-axis (Position)**: Retail Price (USD) - Shows car cost
3. **Color (Hue)**: Engine Size (Liters) - Blue gradient from light (small) to dark (large)
4. **Size (Area)**: City MPG - Circle radius represents fuel efficiency

### Interactive Features:
- **Click** on any circle to view detailed car information in the details panel
- **Hover** over circles for visual feedback with border highlighting
- Selected circles are highlighted with a thicker border and full opacity

### Legends:
- **Engine Size Legend**: Color gradient showing engine displacement (top right)
- **City MPG Legend**: Circle sizes representing fuel efficiency (bottom right)

### Data Insights:
The visualization reveals interesting patterns:
- Higher horsepower generally correlates with higher prices
- Larger engines (darker blue) tend to have more horsepower
- Smaller circles (lower MPG) often appear in high-horsepower vehicles
- Sports cars and luxury sedans cluster in the upper-right region
