export const githubService = {
  async parseGithubProfile(githubUrl: string) {
    if (!githubUrl) return null;
    try {
        let username = githubUrl.trim();
        
        // Remove trailing slashes
        username = username.replace(/\/+$/, '');
        
        if (username.includes('github.com/')) {
            const parts = username.split('github.com/');
            const pathParts = parts[1].split('/');
            username = pathParts[0] === '' ? pathParts[1] : pathParts[0];
        } else if (username.startsWith('@')) {
            username = username.substring(1);
        }

        if (!username || username === 'github.com') return null;

        // Check if user exists and get total repo count
        const userRes = await fetch(`https://api.github.com/users/${username}`, {
            headers: { 'User-Agent': 'PathForge-Agent' }
        });
        
        if (!userRes.ok) {
            console.warn(`GitHub user ${username} not found or rate limited.`);
            return null;
        }
        
        const userData = await userRes.json();

        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
            headers: { 'User-Agent': 'PathForge-Agent' }
        });
        
        if (!reposRes.ok) return { username, public_repos_count: 0, all_repos: [] };
        
        const repos = await reposRes.json();
        const parsedRepos = [];

        for (const repo of repos) {
            let readme = '';
            try {
                // Fetch readme snippet
                const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
                    headers: { 'User-Agent': 'PathForge-Agent', 'Accept': 'application/vnd.github.v3.raw' }
                });
                if (readmeRes.ok) {
                    const text = await readmeRes.text();
                    readme = text.substring(0, 500); // Increased snippet size
                }
            } catch (e) {}

            parsedRepos.push({
                name: repo.name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                topics: repo.topics || [],
                updated_at: repo.updated_at,
                readme_snippet: readme
            });
        }

        return {
            username,
            public_repos_count: repos.length,
            all_repos: parsedRepos
        };
    } catch (err) {
        console.error('Failed to parse github:', err);
        return null;
    }
  }
};
