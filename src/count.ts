import chalk from "chalk";
import envCi from "env-ci";
import gitRemoteOriginUrl from "git-remote-origin-url";
import hostedGitInfo from "hosted-git-info";
import { gitUrlToSlug } from "./git";
import { ConfigJson } from "./Config";
import { clientVersion } from "./clientVersion";

export type ResultMap = { [key: string]: { measurement: number } };

export async function postMetrics(
  apiKey: string,
  config: ConfigJson,
  results: ResultMap,
  tags?: any
) {
  let response;
  const body = {
    apiKey,
    clientVersion,
    config,
    results,
    tags,
  };
  try {
    response = await fetch(`https://diffjam.com/api/snapshot`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      return;
    }

    let responseBody: string | undefined;
    try {
      responseBody = await response.text();
    } catch (ex) {
      // Can't parse the response, or no response
      responseBody = undefined;
    }

    if (response.status === 400) {
      console.error(
        chalk.red.bold("The error reported an issue with your configuration")
      );
      if (responseBody) {
        console.error(chalk.red(responseBody));
      }
      return;
    }

    console.log("There was an error hitting diffjam.com: ", response.status);
    console.log("request.data: ", body);
    console.log("response.data: ", responseBody);
  } catch (ex: any) {
    console.log("There was some error hitting diffjam.com: ", ex);
  }
}

export async function commentResults(
  apiKey: string,
  config: ConfigJson,
  results: ResultMap,
  clientVers: string,
  tags?: any
) {
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
  const gitServiceInfo = hostedGitInfo.fromUrl(remoteOriginUrl);

  if (gitServiceInfo?.type !== "github") {
    throw new Error(
      `diffjam does not support your git host in this release ${gitServiceInfo?.type}`
    );
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
    },
  };
  try {
    response = await fetch(`https://diffjam.com/api/ci`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      return;
    }

    let responseBody: string | undefined;
    try {
      responseBody = await response.text();
    } catch (ex) {
      // Can't parse the response, or no response
      responseBody = undefined;
    }

    if (response.status === 400) {
      console.error(
        chalk.red.bold("The error reported an issue with your configuration")
      );
      try {
        const responseBody = await response.json();
        console.error(chalk.red(responseBody));
      } catch (ex) {
        // Non-json response.
      }
      return;
    }

    console.log(
      `There was a non-2xx response from diffjam.com: ${response.status}`
    );
    if (responseBody) {
      console.log("response.data: ", responseBody);
    }
  } catch (ex) {
    console.log("There was some error hitting diffjam.com: ", ex);
  }
}
