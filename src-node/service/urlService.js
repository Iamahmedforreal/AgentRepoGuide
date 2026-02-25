import validator from 'validator';
import { URL } from 'url';

class UrlService {

    async parseGithubUrl(url) {
        if (!validator.isURL(url, ["github.com"])){
            throw new Error("Invalid GitHub URL");
        }

        const parseUrl = new URL(url);
        const pathParts = parseUrl.pathname.split('/').filter(part => part.length > 0);
        if (pathParts.length < 2) {
            throw new Error("GitHub URL must be in the format: https://github.com/username/repository");
        }

        return {
            owner: pathParts[0],
            repo: pathParts[1].replace(/.git$/, '') ,
            fullpath: `${pathParts[0]}/${pathParts[1].replace(/.git$/, '')}`
        }

    }
}
export default new UrlService();