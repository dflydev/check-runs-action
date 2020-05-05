import {GitHub} from '@actions/github'
import * as Inputs from './namespaces/Inputs'
import request from './request'
import * as core from '@actions/core'

interface Ownership {
  owner: string
  repo: string
}

const unpackInputs = (inputs: Inputs.CheckRun): object => {
  const output = inputs.output
    ? {
        output: {
          ...(inputs.name ? {title: inputs.name} : {}),
          ...(inputs.output.summary ? {summary: inputs.output.summary} : {}),
          ...(inputs.output.text_description
            ? {text: inputs.output.text_description}
            : {}),
          ...(inputs.actions ? {actions: inputs.actions} : {}),
          ...(inputs.images ? {images: inputs.images} : {}),
        },
      }
    : {}

  const more: {details_url?: string} = {}
  if (
    inputs.conclusion === Inputs.Conclusion.ActionRequired ||
    inputs.actions
  ) {
    more.details_url = inputs.actionURL
  }

  const status = inputs.status ? {status: inputs.status.toString()} : {}
  const conclusion = inputs.conclusion
    ? {conclusion: inputs.conclusion.toString()}
    : {}

  return {
    ...output,
    ...(inputs.actions ? {actions: inputs.actions} : {}),
    ...more,
    ...status,
    ...conclusion,
  }
}

const formatDate = (): string => {
  return new Date().toISOString()
}

export const createRun = async (
  owner: string,
  repo: string,
  token: string,
  sha: string,
  ownership: Ownership,
  inputs: Inputs.CheckRun,
): Promise<number> => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.antiope-preview+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'eslint-action',
  }

  const body = {
    head_sha: sha,
    name: inputs.name,
    started_at: formatDate(),
    ...unpackInputs(inputs),
  }

  core.debug(`Body: ${JSON.stringify(body)}`)

  const response: {data: {id: number}} = (await request(
    `https://api.github.com/repos/${owner}/${repo}/check-runs`,
    {
      method: 'POST',
      headers,
    },
    body,
  )) as {data: {id: number}}

  core.debug(`Response: ${JSON.stringify(response)}`)

  return response.data.id
}

export const oldCreateRun = async (
  octokit: GitHub,
  sha: string,
  ownership: Ownership,
  inputs: Inputs.CheckRun,
): Promise<number> => {
  const payload = {
    ...ownership,
    head_sha: sha,
    name: inputs.name,
    started_at: formatDate(),
    ...unpackInputs(inputs),
  }

  const {data} = await octokit.checks.create(payload)
  return data.id
}

export const updateRun = async (
  octokit: GitHub,
  id: number,
  ownership: Ownership,
  inputs: Inputs.CheckRun,
): Promise<void> => {
  await octokit.checks.update({
    ...ownership,
    check_run_id: id,
    ...unpackInputs(inputs),
  })
}
