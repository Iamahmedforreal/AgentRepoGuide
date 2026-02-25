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
        if (!validator.isURL(url, ["github.com"])){
            throw new Error("Invalid GitHub URL");
        }

        const parseUrl = new URL(url);
        const pathParts = parseUrl.pathname.split('/').filter(part => part.length > 0);
        if (pathParts.length < 2) {
            throw new Error("GitHub URL must be in the format: https://github.com/username/repository");
        }
        const owner = pathParts[0];
        const repo = pathParts[1].replace(/.git$/, ''); 
   
        try{
        const data = await Octokit.rest.repos.get({
            owner,
            repo
        })
        return{
            githubUrl: data.data.html_url,
            repoName: data.data.name,
            repoOwner: data.data.owner.login,
            isPrivate: data.data.private,
            sizeKb: data.data.size,
            defaultBranch: data.data.default_branch
        }
    }catch(err){
        throw new AppError('Error fetching repository data from GitHub', 500);
    }


    }

    // Saves the URL metadata to the database and creates 
    async saveUrl(metadata, userId) {

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