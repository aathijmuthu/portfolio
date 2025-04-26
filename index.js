import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('aathijmuthu');
const profileStats = document.querySelector('#profile-stats');

console.log(githubData)

if (profileStats) {
    profileStats.style.textAlign = 'center';
    profileStats.style.maxWidth = '800px';
    profileStats.style.margin = '0 auto';
    profileStats.innerHTML = `
        <dl style="display: grid; grid-template-columns: repeat(4, 1fr);">
            <dt style="grid-row: 1;">Public Repos:</dt>
            <dt style="grid-row: 1;">Public Gists:</dt>
            <dt style="grid-row: 1;">Followers:</dt>
            <dt style="grid-row: 1;">Following:</dt>
            <dd style="grid-row: 2;">${githubData.public_repos}</dd>
            <dd style="grid-row: 2;">${githubData.public_gists}</dd>
            <dd style="grid-row: 2;">${githubData.followers}</dd>
            <dd style="grid-row: 2;">${githubData.following}</dd>
        </dl>
    `;
}