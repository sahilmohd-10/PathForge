export const githubService = {
  async parseGithubProfile(githubUrl: string) {
    if (!githubUrl) return null;
    try {
        let username = '';
        if (githubUrl.includes('github.com/')) {
            const parts = githubUrl.split('github.com/');
            username = parts[1].split('/')[0];
        } else {
            username = githubUrl.trim();
        }

        if (!username) return null;

        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`, {
            headers: { 'User-Agent': 'PathForge-Agent' }
        });
        
        if (!reposRes.ok) return null;
        
        const repos = await reposRes.json();
        const parsedRepos = [];

        for (const repo of repos) {
            let readme = '';
            try {
                const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
                    headers: { 'User-Agent': 'PathForge-Agent', 'Accept': 'application/vnd.github.v3.raw' }
                });
                if (readmeRes.ok) {
                    const text = await readmeRes.text();
                    readme = text.substring(0, 300);
                }
            } catch (e) {
                // Ignore if no readme
            }

            parsedRepos.push({
                name: repo.name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                readme_snippet: readme
            });
        }

        return {
            username,
            recent_repos: parsedRepos
        };
    } catch (err) {
        console.error('Failed to parse github:', err);
        return null;
    }
  }
};
