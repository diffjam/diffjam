
const urlgrey = require("urlgrey");

const gitUrlToSlug = (gitUrl) => {
  // looks like: https://github.com/org/repo.git
  if (!gitUrl) {
    return null;
  }
  const path = urlgrey(gitUrl).path();
  const slug = path.split(".")[0].substr(1);
  return slug;
}

exports.gitUrlToSlug = gitUrlToSlug;