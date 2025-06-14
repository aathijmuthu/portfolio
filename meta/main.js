import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale;
let yScale;
let data;
let commits;


async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    return data;
  }


  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/aathijmuthu/portfolio/commit/main' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
          configurable: true,
          writable: true,
          enumerable: true,
        });
  
        return ret;
      })
      .sort((a, b) => a.datetime - b.datetime); // Sort commits by datetime
  }
  
  function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    // Add unique authors
    dl.append('dt').text('Unique authors');
    dl.append('dd').text(new Set(commits.map(c => c.author)).size);

    // Add average lines per commit
    dl.append('dt').text('Average lines per commit');
    dl.append('dd').text(Math.round(data.length / commits.length));

    // Calculate day of week with most commits
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCount = commits.reduce((acc, commit) => {
      const day = commit.datetime.getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    
    const mostActiveDay = Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])[0];

    dl.append('dt').text('Most active day');
    dl.append('dd').text(`${dayNames[mostActiveDay[0]]}`);

    // Calculate longest line length
    const longestLine = data.reduce((max, line) => Math.max(max, line.length), 0);
    
    dl.append('dt').text('Longest line length');
    dl.append('dd').text(`${longestLine} characters`);

  }

  function renderScatterPlot(data, commits) {
    // Put all the JS code of Steps inside this function
    const width = 1000;
    const height = 600;
    
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const dots = svg.append('g').attr('class', 'dots');

    dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue');

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
      };
      
      // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

      // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

        // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 30]); // adjust these values based on your experimentation
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    });


  }

function renderTooltipContent(commit) {
const link = document.getElementById('commit-link');
const date = document.getElementById('commit-date');

if (Object.keys(commit).length === 0) return;

link.href = commit.url;
link.textContent = commit.id;
date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
});
}

function updateTooltipVisibility(isVisible) {
const tooltip = document.getElementById('commit-tooltip');
tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
const tooltip = document.getElementById('commit-tooltip');
tooltip.style.left = `${event.clientX}px`;
tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
    svg.call(d3.brush().on('start brush end', brushed));
    svg.selectAll('.dots, .overlay ~ *').raise()
}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }
  
function isCommitSelected(selection, commit) {
    if (!selection) {
        return false;
    }
    // TODO: return true if commit is within brushSelection
    // and false if not
    const [[x0, y0], [x1, y1]] = selection;

    // Map commit data to screen coordinates using the scales
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    // Check if the point is within the selection rectangle
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
}
  
data = await loadData();
commits = processCommits(data);
  
renderCommitInfo(data, commits);

renderScatterPlot(data, commits);

const theSvg = d3.select("#chart").select("svg");
createBrushSelector(theSvg);

let commitProgress = 100;
let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);

// Will get updated as user changes slider
let filteredCommits = commits;

function updateFileDisplay(filteredCommits) {
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        })
        .sort((a, b) => b.lines.length - a.lines.length);

    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let filesContainer = d3
        .select('#files')
        .selectAll('div')
        .data(files, (d) => d.name)
        .join(
            // This code only runs when the div is initially rendered
            (enter) =>
                enter.append('div').call((div) => {
                    div.append('dt');
                    div.append('dd');
                }),
        );

    // Update the dt content with filename and line count as subtitle
    filesContainer.select('dt').html(
        (d) => `<code>${d.name}</code><br><small>${d.lines.length} lines</small>`
    );

    // Create unit visualization for each line
    filesContainer
        .select('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .join('div')
        .attr('class', 'loc')
        .attr('style', (d) => `--color: ${colors(d.type)}`);
}

function onTimeSliderChange() {
    const slider = document.getElementById('commit-progress');
    const timeElement = document.getElementById('commit-time');
    
    commitProgress = Number(slider.value);
    commitMaxTime = timeScale.invert(commitProgress);
    timeElement.textContent = commitMaxTime.toLocaleString('en', {
        dateStyle: 'long',
        timeStyle: 'short'
    });

    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    updateScatterPlot(data, filteredCommits);
    updateFileDisplay(filteredCommits);
}

// Add event listener to slider
document.getElementById('commit-progress').addEventListener('input', onTimeSliderChange);

// Initialize the time display
onTimeSliderChange();

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // Update the x-axis
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// Generate commit descriptions
d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

// Generate file descriptions
let allFiles = d3.rollups(
  data,
  (lines) => lines,
  (d) => d.file,
).map(([name, lines]) => ({
  name,
  lines,
  firstCommit: d3.min(lines, d => d.datetime),
  totalLines: lines.length,
  types: d3.rollups(lines, v => v.length, d => d.type)
}))
.sort((a, b) => a.firstCommit - b.firstCommit);

d3.select('#files-story')
  .selectAll('.step')
  .data(allFiles)
  .join('div')
  .attr('class', 'step')
  .html(
    (d) => `
    The file <code>${d.name}</code> was first created on ${d.firstCommit.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })}.
    It has been modified ${d.lines.length} times.
    The file contains code in ${d.types.map(([type, count]) => 
      `${type} (${count} lines)`
    ).join(', ')}.
    `
  );

function onStepEnter(response) {
    const commitDate = response.element.__data__.datetime;
    filteredCommits = commits.filter((d) => d.datetime <= commitDate);
    updateScatterPlot(data, filteredCommits);
    updateFileDisplay(filteredCommits);
}

function onFileStepEnter(response) {
    const fileDate = response.element.__data__.firstCommit;
    filteredCommits = commits.filter((d) => d.datetime <= fileDate);
    updateFileDisplay(filteredCommits);
}

const scroller = scrollama();
scroller
    .setup({
        container: '#scrolly-1',
        step: '#scrolly-1 .step',
    })
    .onStepEnter(onStepEnter);

const fileScroller = scrollama();
fileScroller
    .setup({
        container: '#scrolly-2',
        step: '#scrolly-2 .step',
    })
    .onStepEnter(onFileStepEnter);




  