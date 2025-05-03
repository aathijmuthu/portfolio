import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Get project data and create pie chart
(async function initProjectsPage() {
    try {
        const projects = await fetchJSON('../lib/projects.json');
        
        // Update title with project count
        const titleEl = document.querySelector('.projects-title');
        if (titleEl) {
            titleEl.textContent = `${projects.length} Projects`;
        }

        // Group projects by year and count them
        const rolledData = d3.rollups(
            projects,
            v => v.length,
            d => d.year
        );

        // Convert to array of objects for pie chart
        const data = rolledData.map(([year, count]) => ({
            value: count,
            label: year.toString()
        }));

        let sliceGenerator = d3.pie().value(d => d.value);
        let arcData = sliceGenerator(data);
        let arcs = arcData.map(d => arcGenerator(d));
        let colors = d3.scaleOrdinal(d3.schemeTableau10);

        // Create pie chart
        arcs.forEach((arc, idx) => {
            d3.select('svg')
                .append('path')
                .attr('d', arc)
                .attr('fill', colors(idx));
        });

        // Create legend
        let legend = d3.select('.legend');
        data.forEach((d, idx) => {
            legend
                .append('li')
                .attr('style', `--color:${colors(idx)}`)
                .attr('class', 'legend-item')
                .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
        });

        // Render projects list
        const projectsContainer = document.querySelector('.projects');
        renderProjects(projects, projectsContainer, 'h2');
    } catch (err) {
        console.error('Error initializing projects page:', err);
    }
})();