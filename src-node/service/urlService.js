import validator from 'validator';
import { URL } from 'url';
import  prisma from '../lib/prisma.js';
import { Octokit } from 'octokit';
import { AppError } from '../utils/AppError.js';
import config from '../config/env.js';

const octokit  = new Octokit({auth: config.GITHUB_TOKEN})

class UrlService {

    // Parses a GitHub URL and extracts the owner and repository name
    async parseGithubUrl(url) {
        if (!validator.isURL(url, { require_protocol: true, host_whitelist: ['github.com'] })){
            throw new AppError("Invalid GitHub URL", 400);
        }
        const {hostname} = new URL(url);
        if(hostname !== 'github.com'){
            throw new AppError('URL must be a GitHub repository URL', 400);
        }

        const { owner, repo } = this.getOwnerAndRepoFromUrl(url);
        try{
        const data = await octokit.rest.repos.get({
            owner,
            repo
        })
        return this.mapMetadataToDbFields(data);
        
    }catch(err){
        if(err.status === 404)throw new AppError('Repository not found on GitHub', 404);
        if(err.status === 403) throw new AppError('GitHub API rate limit exceeded', 403);
        if(err.status === 401) throw new AppError('Invalid GitHub token', 401);
    }
    }

   async parseGithubUrl(url) {
    // Step 1: Validate URL structure
    if (!validator.isURL(url, { require_protocol: true, host_whitelist: ['github.com'] })) {
        throw new AppError('Invalid GitHub URL', 400);
    }

    // Step 2: Guard against subdomain spoofing (github.com.evil.com)
    const { hostname } = new URL(url);
    if (hostname !== 'github.com') {
        throw new AppError('URL must be from github.com', 400);
    }

    // Step 3: Extract owner and repo from URL path
    const { owner, repo } = this.getOwnerAndRepoFromUrl(url);

    // Step 4: Verify repo exists on GitHub and get data
    try {
        const { data } = await octokit.rest.repos.get({ owner, repo });
        return this.mapMetadataToDbFields(data);  // map immediately, no spread
    } catch (err) {
        if (err.status === 404) throw new AppError('Repository not found or is private', 404);
        if (err.status === 403) throw new AppError('GitHub API rate limit exceeded', 429);
        if (err.status === 401) throw new AppError('Invalid GitHub token', 401);
        throw new AppError('Error fetching repository data from GitHub', 500);
    }
}

 mapMetadataToDbFields(data) {
    return {
        githubUrl:      data.html_url,
        repoName:       data.name,
        repoOwner:      data.owner.login,
        description:    data.description   ?? null,
        isPrivate:      data.private,
        sizeKb:         data.size,
        defaultBranch:  data.default_branch,
        stars:          data.stargazers_count,
        language:       data.language      ?? null,
        topics:         data.topics        ?? [],
        license:        data.license?.spdx_id ?? null,
        isArchived:     data.archived,
        repoCreatedAt:  new Date(data.created_at),
        repoUpdatedAt:  new Date(data.updated_at),
    };
}
    
     getOwnerAndRepoFromUrl(url) {
        const parseUrl = new URL(url);
        const pathParts = parseUrl.pathname.split('/').filter(part => part.length > 0);
        if (pathParts.length < 2) {
            throw new Error("GitHub URL must be in the format: https://github.com/username/repository");
        }
        return {
            owner: pathParts[0],
            repo: pathParts[1].replace(/.git$/, '')
        };
    }

    // Saves the URL metadata to the database and creates 
    async saveUrl(metadata, userId) {
        const existingRepo = await prisma.Repository.findUnique({
            where: {
                userId_githubUrl: {
                    userId,
                    githubUrl: metadata.githubUrl
                }
            }
        })
        if(existingRepo){
            throw new AppError('Repository already exists', 409);
        }
        const  mappedData = await this.mapMetadataToDbFields(metadata);
        return await prisma.$transaction(async (tx) => {
            const repository = await tx.Repository.create({
                data: {
                    userId,
                    ...mappedData,
                    status: 'PENDING',
                    ingestionJobs:{
                        create: {
                            status:"QUEUED"
                        }
                    },
                    select:{
                        id: true,
                        githubUrl: true,
                        repoName: true,
                        repoOwner: true,
                        description: true,
                        ingestionJobs: {
                            select: {
                                id: true,
                                status: true
                            }
                        }
                    }

                }
            })
            return repository;
        });
       
    }
}
export default new UrlService();