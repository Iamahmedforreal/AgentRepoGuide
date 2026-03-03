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
        if (!validator.isURL(url, { require_protocol: true, hostWhitelist: ['github.com'] })){
            throw new Error("Invalid GitHub URL");
        }

        const { owner, repo } = this.getOwnerAndRepoFromUrl(url);

        try{
        const data = await octokit.rest.repos.get({
            owner,
            repo
        })
        return{
            githubUrl: data.data.html_url,
            repoName: data.data.name,
            repoOwner: data.data.owner.login,
            isPrivate: data.data.private,
            sizeKb: data.data.size,
            defaultBranch: data.data.default_branch,

        }
    }catch(err){
        throw new AppError('Error fetching repository data from GitHub', 500);
    }
    }


    async getOwnerAndRepoFromUrl(url) {
        const parseUrl = new URL(url);
        if (parseUrl.hostname !== 'github.com') {
            throw new Error("URL must be from github.com");
        }
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
        const existingRepo = await prisma.repository.findUnique({
            where: {
                githubUrl: metadata.githubUrl
            }
        });

        if (existingRepo) {
            throw new AppError('Repository already exists', 409);
        }

        return  await prisma.repository.create({
     data: {
        userId,
        githubUrl: metadata.githubUrl,
         repoName: metadata.repoName,
         repoOwner: metadata.repoOwner,
        isPrivate: metadata.isPrivate,
        sizeKb: metadata.sizeKb,
        defaultBranch: metadata.defaultBranch,
        status: 'PENDING',
        ingestionJobs: {
          create: {
            status: 'QUEUED'
          }
        }
      }
     });
}


}
export default new UrlService();