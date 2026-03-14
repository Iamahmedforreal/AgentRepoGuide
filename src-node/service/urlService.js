// urlService.js
import { URL } from 'url';
import prisma from '../lib/prisma.js';
import { Octokit } from 'octokit';
import { AppError } from '../utils/AppError.js';
import config from '../config/env.js';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { repoCloneQueue } from '../config/queue.js';

const exec = promisify(execCb);
const octokit = new Octokit({ auth: config.GITHUB_TOKEN });
const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/; 
class UrlService {


    // Validate and parse GitHub URL, fetch metadata
     parseGithubUrl = async (url) => {
        const { hostname } = new URL(url);
        if (hostname !== 'github.com') {
            throw new AppError('URL must be from github.com', 400);
        }

        const { owner, repo } = this.getOwnerAndRepoFromUrl(url);

        try {
            const { data } = await octokit.rest.repos.get({ owner, repo });
            return this.mapMetadataToDbFields(data);



        } catch (err) {
            if (err.status === 404) throw new AppError('Repository not found or is private', 404);
            if (err.status === 403) throw new AppError('GitHub API rate limit exceeded', 429);
            if (err.status === 401) throw new AppError('Invalid GitHub token', 401);
            throw new AppError('Error fetching repository data from GitHub', 500);
        }
    }


// Map GitHub API response to our database schema
  mapMetadataToDbFields(data) {
    return {
      githubUrl:     data.html_url,
      repoName:      data.name,
      repoOwner:     data.owner.login,
      description:   data.description        ?? null,
      isPrivate:     data.private,
      sizeKb:        data.size,
      defaultBranch: data.default_branch,
      stars:         data.stargazers_count,
      language:      data.language           ?? null,
      topics:        data.topics             ?? [],
      license:       data.license?.spdx_id   ?? null,
      isArchived:    data.archived,
      repoCreatedAt: new Date(data.created_at),
      repoUpdatedAt: new Date(data.updated_at),
    };
  }

  // Extract owner and repo name from GitHub URL
   getOwnerAndRepoFromUrl(url) {
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length < 2) {
            throw new AppError(
                'GitHub URL must be in the format: https://github.com/username/repository',
                400
            );
        }

        const owner = pathParts[0];
        const repo  = pathParts[1].replace(/\.git$/, '');

       
        if (!SAFE_SEGMENT.test(owner) || !SAFE_SEGMENT.test(repo)) {
            throw new AppError(
                'Repository owner or name contains invalid characters',
                400
            );
        }

        return { owner, repo };
    }

    // Save URL metadata to the database, ensuring no duplicates for the same user
   
async saveUrl(metadata, userId) {
    const existingRepo = await prisma.repository.findUnique({
        where: { userId_githubUrl: { userId, githubUrl: metadata.githubUrl } }
    });

    if (existingRepo) throw new AppError('Repository already exists', 409);

    
    const repo = await prisma.$transaction(async (tx) => {
        return await tx.repository.create({
            data: {
                userId,
                ...metadata,
                status: 'PENDING',
                ingestionJobs: {
                    create: { status: 'QUEUED' }
                }
            },
            select: {
                id: true,
                githubUrl: true,
                repoName: true,
                repoOwner: true,
                description: true,
                status: true,
                createdAt: true,
                ingestionJobs: {
                    select: { id: true, status: true }
                }
            }
        });
    });

    const jobId = repo.ingestionJobs?.[0]?.id;
    if (jobId) {
        await repoCloneQueue.add('repo-clone', {
            jobId,
            repoId: repo.id,
            githubUrl: repo.githubUrl,
            repoOwner: repo.repoOwner,
            repoName: repo.repoName,
        });
    }

    return repo;
}
  async _cloneRepository(githubUrl, repoOwner, repoName) {
    const localPath = path.resolve('clone_repo', `${repoOwner}_${repoName}`);

    // Clean up any existing directory
    if (fs.existsSync(localPath)) {
      fs.rmSync(localPath, { recursive: true, force: true });
    }

    await fs.promises.mkdir(path.dirname(localPath), { recursive: true });

    try {
      await exec(`git clone --depth 1 ${githubUrl} "${localPath}"`);
    } catch (err) {
      throw new AppError('Error cloning repository', 500);
    }

    return localPath;
  }
}
export default new UrlService();