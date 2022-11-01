import chalk from "chalk";
import axios from "axios";
import envCi from 'env-ci';
import gitRemoteOriginUrl from "git-remote-origin-url";
import hostedGitInfo from "hosted-git-info";
import { gitUrlToSlug } from "./git";
import { ConfigJson } from "./Config";
import { hasProp } from "./hasProp";
import { clientVersion } from "./clientVersion";


export type ResultMap = { [key: string]: { measurement: number } };

export async function postMetrics(apiKey: string, config: ConfigJson, results: ResultMap, tags?: any) {

  let response;
  const body = {
    apiKey,
    clientVersion,
    config,
    results,
    tags
  };
  try {
    response = await axios.post(`https://diffjam.com/api/snapshot`, body);
    // TODO: Check if this is happening at all. Axios is failing if the status is not 200.
    if (response.status < 200 || response.status > 299) {
      throw new Error(`Non-2xx response from diffjam.com: ${response.status}`);
    }
  } catch (ex: any) {
    if (ex.response.status === 400) {
      // This is an expected error. Something is wrong (probably with the configuration);
      console.error(
        chalk.red.bold("The error reported an issue with your configuration")
      );
      console.error(chalk.red(JSON.stringify(ex.response.data)));
    } else {
      console.log("There was some error hitting diffjam.com: ", ex);
      console.log("ex.request.data: ", ex.request.data);
      console.log("ex.response.data: ", ex.response.data);
    }
  }
}


// [2020-05-03T16:57:29.737Z] env:  { isCi: true,
//   [2020-05-03T16:57:29.737Z]   name: 'Jenkins',
//   [2020-05-03T16:57:29.737Z]   service: 'jenkins',
//   [2020-05-03T16:57:29.737Z]   commit: 'f8178999c68ff64127539b4d147e3df9a8ba99ad',
//   [2020-05-03T16:57:29.737Z]   branch: 'PR-3632',
//   [2020-05-03T16:57:29.737Z]   build: '3',
//   [2020-05-03T16:57:29.737Z]   buildUrl: 'https://jenkins.classdojo.com/job/api/job/PR-3632/3/',
//   [2020-05-03T16:57:29.737Z]   root: '/mnt/dockerstorageiops/jenkins/jobs/api/workspace_PR-3632_3',
//   [2020-05-03T16:57:29.737Z]   pr: '3632',
//   [2020-05-03T16:57:29.737Z]   isPr: true,
//   [2020-05-03T16:57:29.737Z]   prBranch: 'PR-3632',
//   [2020-05-03T16:57:29.737Z]   slug: 'classdojo/api' }


export async function commentResults(apiKey: string, config: ConfigJson, results: ResultMap, clientVers: string, tags?: any) {
  const env: any = envCi();
  const { name, service, commit, isPr, pr } = env;
  let { branch, slug, prBranch } = env;
  console.log("pre env: ", env);
  if (service === "jenkins") {
    // this envCI library seems to mess up the jenkins branch, so let's fix it.
    branch = process.env.CHANGE_BRANCH || branch;
    console.log("CHANGE_BRANCH", process.env.CHANGE_BRANCH);
    console.log("GIT_LOCAL_BRANCH", process.env.GIT_LOCAL_BRANCH);
    console.log("GIT_BRANCH", process.env.GIT_BRANCH);
    console.log("BRANCH_NAME", process.env.BRANCH_NAME);
    env.branch = branch;
    if (prBranch) {
      prBranch = branch;
      env.prBranch = prBranch;
    }
  }
  if (!slug) {
    slug = gitUrlToSlug(process.env.GIT_URL || "");
    env.slug = slug;
  }
  console.log("post env: ", env);
  let response;

  const remoteOriginUrl = await gitRemoteOriginUrl();
  const gitServiceInfo = hostedGitInfo.fromUrl(remoteOriginUrl)

  if (gitServiceInfo?.type !== "github") {
    throw new Error(`diffjam does not support your git host in this release ${gitServiceInfo?.type}`);
  }

  const body = {
    apiKey,
    clientVers,
    config,
    results,
    tags,
    ci_env: {
      name,
      service,
      branch,
      commit,
      isPr,
      pr,
      prBranch,
      slug,
      remoteOriginUrl,
      gitService: gitServiceInfo.type,
    }
  };
  try {
    response = await axios.post(`https://diffjam.com/api/ci`, body);
    if (response.status < 200 || response.status > 299) {
      console.log(`There was a non-2xx response from diffjam.com: ${response.status}`);
      console.log("response.data: ", response.data);
    }
  } catch (ex) {
    if (hasProp(ex, "response") && hasProp(ex.response, "status") && ex.response.status === 400) {
      // This is an expected error. Something is wrong (probably with the configuration);
      console.error(
        chalk.red.bold("The error reported an issue with your configuration")
      );
      hasProp(ex.response, "data") && console.error(chalk.red(JSON.stringify(ex.response.data)));
    } else {
      console.log("There was some error hitting diffjam.com: ", ex);
      hasProp(ex, "request") && hasProp(ex.request, "data") && console.log("ex.request.data: ", ex.request.data);
      hasProp(ex, "response") && hasProp(ex.response, "data") && console.log("ex.response.data: ", ex.response.data);
    }
  }
}
