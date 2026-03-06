// urlService.js
import validator from 'validator';
import { URL } from 'url';
import prisma from '../lib/prisma.js';
import { Octokit } from 'octokit';
import { AppError } from '../utils/AppError.js';
import config from '../config/env.js';

const octokit = new Octokit({ auth: config.GITHUB_TOKEN });

class UrlService {

    // Validate and parse GitHub URL, fetch metadata
  async parseGithubUrl(url) {
    
    if (!validator.isURL(url, { require_protocol: true })) {
      throw new AppError('Invalid GitHub URL', 400);
    }

    
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
    return {
      owner: pathParts[0],
      repo: pathParts[1].replace(/\.git$/, ''),
    };
  }

  // Save URL metadata to the database, ensuring no duplicates for the same user
  async saveUrl(metadata, userId) {
   
    const existingRepo = await prisma.repository.findUnique({
      where: {
        userId_githubUrl: { userId, githubUrl: metadata.githubUrl }
      }
    });

    if (existingRepo) {
      throw new AppError('Repository already exists', 409);
    }

    return await prisma.$transaction(async (tx) => {
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
  }
}

export default new UrlService();