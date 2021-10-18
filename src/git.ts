
// @ts-ignore
import urlgrey from "urlgrey";

const gitUrlToSlug = (gitUrl: string) => {
  // looks like: https://github.com/org/repo.git
  if (!gitUrl) {
    return null;
  }
  const path = urlgrey(gitUrl).path();
  const slug = path.split(".")[0].substr(1);
  return slug;
}

const _gitUrlToSlug = gitUrlToSlug;
export { _gitUrlToSlug as gitUrlToSlug };