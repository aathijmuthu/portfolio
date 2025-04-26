console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$('nav a');

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');

// console.log('currentLink', currentLink);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/aathijmuthu', title: 'GitHub Profile' },
  // add the rest of your pages here
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  // next step: create link and add it to nav
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );
  if (a.host != location.host) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  nav.append(a);
}

// Add Dark Mode Toggle
document.body.insertAdjacentHTML(
  "afterbegin",
  `
	<label class="color-scheme">
		Theme:
		<select>
      <option value="light dark">Auto</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`
);

const select = document.querySelector(".color-scheme select");

// Set color scheme helper
const setColorScheme = (colorScheme) => {
  document.documentElement.style.setProperty("color-scheme", colorScheme);
  console.log("color scheme set to", colorScheme);
  select.value = colorScheme;
  localStorage.setItem("colorScheme", colorScheme);
};

// Set initial color scheme based on localStorage or system preference
const savedColorScheme = localStorage.getItem("colorScheme");
const initialColorScheme = ["light dark", "light", "dark"].includes(
  savedColorScheme
)
  ? savedColorScheme
  : "light dark";
setColorScheme(initialColorScheme);

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  localStorage.colorScheme = event.target.value
  document.documentElement.style.setProperty('color-scheme', event.target.value);
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
	containerElement.innerHTML = '';
  
	project.forEach(proj => {
	  const article = document.createElement('article');
	  article.innerHTML = `
		<${headingLevel}>${proj.title}</${headingLevel}>
		<img src="${proj.image}" alt="${proj.title}">
		<p>${proj.description}</p>
	  `;
	  containerElement.appendChild(article);
	});
  }

  export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
  }