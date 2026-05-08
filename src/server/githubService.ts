export const githubService = {
  async parseGithubProfile(githubUrl: string) {
    if (!githubUrl) return null;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const headers: any = { 'User-Agent': 'PathForge-Agent' };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    try {
        let username = githubUrl.trim();
        username = username.replace(/\/+$/, '');
        
        if (username.includes('github.com/')) {
            const parts = username.split('github.com/');
            const pathParts = parts[1].split('/');
            username = pathParts[0] === '' ? pathParts[1] : pathParts[0];
        } else if (username.startsWith('@')) {
            username = username.substring(1);
        }

        if (!username || username === 'github.com') return null;

        const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
        if (!userRes.ok) return null;
        
        const userData = await userRes.json();

        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=50`, { headers });
        if (!reposRes.ok) return { username, public_repos_count: 0, all_repos: [] };
        
        const repos = await reposRes.json();
        const parsedRepos = [];

        for (const repo of repos) {
            let readme = '';
            let commitCount = 0;
            
            try {
                const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
                    headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' }
                });
                if (readmeRes.ok) {
                    const text = await readmeRes.text();
                    readme = text.substring(0, 500);
                }

                // Get some commit activity for "consistency" metric
                const activityRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/stats/commit_activity`, { headers });
                if (activityRes.ok) {
                    const activity = await activityRes.json();
                    if (Array.isArray(activity)) {
                        commitCount = activity.reduce((acc: number, week: any) => acc + week.total, 0);
                    }
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
                commit_activity_total: commitCount,
                readme_snippet: readme
            });
        }

        return {
            username,
            bio: userData.bio,
            public_repos_count: userData.public_repos,
            followers: userData.followers,
            all_repos: parsedRepos
        };
    } catch (err) {
        console.error('Failed to parse github:', err);
        return null;
    }
  }
};
