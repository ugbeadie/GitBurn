from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import engine, Base, get_db
import json
import asyncio
import models, schemas, auth
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import httpx

load_dotenv()

openai_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GitBurn - The Ultimate GitHub Roaster")

app.add_middleware(
    CORSMiddleware,
    # Remember to replace url with live url when deployed
    allow_origins=["http://localhost:5173", "https://your-gitburn-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.get("/ping")
def ping():
    """Endpoint to keep the Render free tier instance awake."""
    return {"status": "alive", "message": "GitBurn backend is awake!"}

async def fetch_github_data(username: str):
    headers = {
        "User-Agent": "GitBurn-App-Backend",
        "Accept": "application/vnd.github.v3+json"
    }
    
    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"
    
    async with httpx.AsyncClient(headers=headers) as client:
        user_res = await client.get(f"https://api.github.com/users/{username}")

        if user_res.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub user not found")
        elif user_res.status_code != 200:
            error_msg = user_res.json().get("message", "Rate limit exceeded or blocked by GitHub.")
            raise HTTPException(status_code=user_res.status_code, detail=f"GitHub API Error: {error_msg}")

        repos_res = await client.get(f"https://api.github.com/users/{username}/repos?per_page=100")
        user_data = user_res.json()
        repos_data = repos_res.json()

        if not isinstance(repos_data, list):
            repos_data = []

        total_repos = len(repos_data)
        forked_repos = sum(1 for repo in repos_data if isinstance(repo, dict) and repo.get("fork"))

        languages = []
        for repo in repos_data:
            if isinstance(repo, dict) and repo.get("language"):
                languages.append(repo["language"])

        sorted_repos = sorted(
            [r for r in repos_data if isinstance(r, dict) and r.get("pushed_at")],
            key=lambda x: x["pushed_at"],
            reverse=True
        )[:5]

        tasks = []
        
        for repo in sorted_repos:
            repo_name = repo["name"]
            commit_url = f"https://api.github.com/repos/{username}/{repo_name}/commits?per_page=5"
            tasks.append(client.get(commit_url))
            
        for repo in sorted_repos:
            repo_name = repo["name"]
            readme_url = f"https://api.github.com/repos/{username}/{repo_name}/readme"
            readme_headers = {**headers, "Accept": "application/vnd.github.v3.raw"}
            tasks.append(client.get(readme_url, headers=readme_headers))

        all_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Split the results back out
        commit_results = all_results[:len(sorted_repos)]
        readme_results = all_results[len(sorted_repos):]

        recent_commits = []
        for repo, res in zip(sorted_repos, commit_results):
            if not isinstance(res, Exception) and res.status_code == 200:
                commits = res.json()
                if isinstance(commits, list):
                    for c in commits:
                        msg = c.get("commit", {}).get("message", "").split("\n")[0]
                        recent_commits.append(f"[{repo['name']}] {msg}")

        repo_readmes = {}
        for repo, res in zip(sorted_repos, readme_results):
            repo_name = repo["name"]
            if isinstance(res, Exception):
                repo_readmes[repo_name] = "Failed to fetch."
            elif res.status_code == 200:
                # Grab the first 250 characters of the README to save token space
                snippet = res.text[:250].strip().replace("\n", " ")
                repo_readmes[repo_name] = snippet if snippet else "[Empty README file]"
            elif res.status_code == 404:
                repo_readmes[repo_name] = "[Missing / No README configured]"
            else:
                repo_readmes[repo_name] = "[Error reading file]"

        total_stars = sum(repo.get("stargazers_count", 0) for repo in repos_data if isinstance(repo, dict))

        return {
            "total_repos": total_repos,
            "forked_repos": forked_repos,
            "followers": user_data.get("followers", 0),
            "following": user_data.get("following", 0),
            "public_gists": user_data.get("public_gists", 0),
            "bio": user_data.get("bio") or "No bio declared on GitHub.",
            "languages": list(set(languages)),
            "recent_commits": recent_commits,
            "repo_readmes": repo_readmes,
            "total_stars": total_stars,
            "account_year": user_data.get("created_at", "")[:4] if user_data.get("created_at") else "Unknown"
        }

async def generate_openai_roast(username: str, metrics: dict):
    languages_str = ", ".join(metrics['languages']) if metrics['languages'] else "None"
    
    commits_list = metrics.get('recent_commits', [])
    commits_str = "\n".join(commits_list) if commits_list else "No recent commits found. Probably hasn't coded in months."
    
    readmes_dict = metrics.get('repo_readmes', {})
    readmes_str = "\n".join([f"- {repo}: {snippet}" for repo, snippet in readmes_dict.items()])

    prompt = f"""
    You are a ruthless, cynical senior full-stack developer doing a code review.
    Roast this developer's GitHub profile mercilessly. Be brutally funny, witty, and sharp. 
    Use direct modern developer sarcasm. Keep your response to 2 or 3 punchy paragraphs maximum.
    
    Target's GitHub Data:
    - Username: {username}
    - Total Repos: {metrics['total_repos']}
    - Forked Repos: {metrics['forked_repos']}
    - Followers: {metrics['followers']}
    - Bio: '{metrics['bio']}'
    - Languages they use: {languages_str}
    - Account Created In: {metrics['account_year']}
    - Total Stars Earned: {metrics['total_stars']}
    
    - Recent Commits (Top 25 across 5 most active repos):
    {commits_str}
    
    - README Snippets for their active repos:
    {readmes_str}
    
    Focus heavily on their terrible commit messages, low-effort or missing README documentation, overused languages, or lack of originality. If a repo has no README or an empty one, destroy them for it.
    """

    try:
        response = await openai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a savage code reviewer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.85,
            max_tokens=250,
        )
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"AI Generation Error: {str(e)}")
        return f"Even the AI crashed trying to parse {username}'s messy code. (Error: {str(e)})"

@app.post("/signup", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/roast", response_model=schemas.RoastResponse)
async def generate_roast(request: schemas.RoastRequest, db: Session = Depends(get_db)):
    metrics_dict = await fetch_github_data(request.github_username)
    
    ai_roast_text = await generate_openai_roast(request.github_username, metrics_dict)
    
    new_roast = models.Roast(
        github_username=request.github_username,
        roast_text=ai_roast_text,
        metrics_json=json.dumps(metrics_dict)
    )
    db.add(new_roast)
    db.commit()
    db.refresh(new_roast)
    
    return new_roast