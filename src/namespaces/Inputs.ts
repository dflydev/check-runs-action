import {Octokit} from '@octokit/rest'

export interface Input {
  globalContext: GlobalContext
  runContext: RunContext
}

export interface GlobalContext {
  collections: NamedCheckRunCollection[]
}

export interface RunContext {
  token: string
  collectedCheckRuns: CollectedCheckRun[]
  fail: boolean
}

export interface CollectedCheckRun {
  collection: string
  checkRun: CheckRun
}

export interface NamedCheckRunCollection {
  collection: string
  checkRuns: CheckRun[]
}

export interface CheckRun {
  id: string
  name: string
  status: Status

  gitHubCheckRunId?: number

  conclusion?: Conclusion
  actionURL?: string

  output?: Output
  annotations?: Annotations
  images?: Images
  actions?: Actions
}

export type Annotations = Octokit.ChecksCreateParamsOutputAnnotations[]

export type Images = Octokit.ChecksCreateParamsOutputImages[]

export type Actions = Octokit.ChecksCreateParamsActions[]

export interface Output {
  summary: string
  text_description?: string
}

export enum Conclusion {
  Success = 'success',
  Failure = 'failure',
  Neutral = 'neutral',
  Cancelled = 'cancelled',
  TimedOut = 'timed_out',
  ActionRequired = 'action_required',
  Skipped = 'skipped',
}

export enum Status {
  Queued = 'queued',
  InProgress = 'in_progress',
  Completed = 'completed',
}
