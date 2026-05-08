export const githubService = {
  async parseGithubProfile(githubUrl: string) {
    if (!githubUrl) return null;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const headers: any = { 'User-Agent': 'PathForge-Agent' };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    try {
        let username = githubUrl.trim().replace(/\/+$/, '');
        if (username.includes('github.com/')) {
            const parts = username.split('github.com/');
            const pathParts = parts[1].split('/');
            username = pathParts[0] === '' ? pathParts[1] : pathParts[0];
        } else if (username.startsWith('@')) {
            username = username.substring(1);
        }

        if (!username || username === 'github.com') return null;

        // Step 1 — Get User Information
        const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
        if (!userRes.ok) {
            console.warn(`GitHub API User Fetch Failed: ${userRes.status} ${userRes.statusText}`);
            throw new Error(`GitHub user not found or API rate limited (${userRes.status})`);
        }
        const userData = await userRes.json();

        // Step 2 — Fetch Repositories
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, { headers });
        if (!reposRes.ok) {
            console.warn(`GitHub API Repos Fetch Failed: ${reposRes.status} ${reposRes.statusText}`);
            throw new Error(`Failed to fetch repositories (${reposRes.status})`);
        }
        const repos = await reposRes.json();

        // Step 3 — Analyze Repository Data & Metrics
        let totalStars = 0;
        let totalForks = 0;
        const languageCounts: any = {};
        const parsedRepos = [];

        for (const repo of repos.slice(0, 15)) { // Limit to top 15 for depth
            totalStars += repo.stargazers_count;
            totalForks += repo.forks_count;

            // Step 4 — Analyze Languages (Detailed)
            let languages = {};
            try {
                const langRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/languages`, { headers });
                if (langRes.ok) languages = await langRes.json();
            } catch (e) {}

            // Step 5 — Analyze Commits/Activity
            let recentCommits = 0;
            try {
                const commitRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=10`, { headers });
                if (commitRes.ok) {
                    const commits = await commitRes.json();
                    recentCommits = Array.isArray(commits) ? commits.length : 0;
                }
            } catch (e) {}

            // Fetch README for AI context
            let readme = '';
            try {
                const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
                    headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' }
                });
                if (readmeRes.ok) readme = (await readmeRes.text()).substring(0, 600);
            } catch (e) {}

            parsedRepos.push({
                name: repo.name,
                description: repo.description,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                primary_language: repo.language,
                all_languages: languages,
                recent_commits_count: recentCommits,
                readme_snippet: readme,
                url: repo.html_url
            });
        }

        // Additional: Step 6 — Analyze Events (Heatmap/Consistency)
        let eventActivity = 0;
        try {
            const eventRes = await fetch(`https://api.github.com/users/${username}/events`, { headers });
            if (eventRes.ok) {
                const events = await eventRes.json();
                eventActivity = Array.isArray(events) ? events.length : 0;
            }
        } catch (e) {}

        return {
            profile: {
                username: userData.login,
                name: userData.name,
                bio: userData.bio,
                public_repos: userData.public_repos,
                followers: userData.followers,
                created_at: userData.created_at,
                avatar_url: userData.avatar_url
            },
            metrics: {
                total_stars: totalStars,
                total_forks: totalForks,
                event_activity_score: eventActivity,
                top_repos_analyzed: parsedRepos.length
            },
            all_repos: parsedRepos
        };
    } catch (err) {
        console.error('GitHub Deep Audit Failed:', err);
        return {
            profile: { public_repos: 0 },
            metrics: { total_stars: 0, total_forks: 0, event_activity_score: 0, top_repos_analyzed: 0 },
            all_repos: []
        };
    }
  }
};
