import {InputOptions} from '@actions/core'
import {envVariableName} from './main'
import {
  Actions,
  Annotations,
  CheckRun,
  CollectedCheckRun,
  Conclusion,
  GlobalContext,
  Images,
  Input,
  NamedCheckRunCollection,
  Output,
  Status,
} from './namespaces/Inputs'

type GetInput = (name: string, options?: InputOptions | undefined) => string

const parseJSON = <T>(getInput: GetInput, property: string): T | undefined => {
  const value = getInput(property)
  if (!value) {
    return
  }
  try {
    const obj = JSON.parse(value)
    return obj as T
  } catch (e) {
    throw new Error(`invalid format for '${property}: ${e.toString()}`)
  }
}

const parseCheckRun = (getInput: GetInput): CheckRun => {
  const id = getInput('id')
  const name = getInput('name')
  const statusFromInput = getInput('status')
  const conclusionFromInput = getInput('conclusion')
  const actionURL = getInput('action_url')

  const status = statusFromInput
    ? (statusFromInput.toLowerCase() as Status)
    : null

  const conclusion = conclusionFromInput
    ? (conclusionFromInput.toLowerCase() as Conclusion)
    : null

  if (status && !Object.values(Status).includes(status)) {
    throw new Error(`invalid value for 'status': '${status}'`)
  }

  if (conclusion && !Object.values(Conclusion).includes(conclusion)) {
    throw new Error(`invalid value for 'conclusion': '${conclusion}'`)
  }

  const output = parseJSON<Output>(getInput, 'output')
  const annotations = parseJSON<Annotations>(getInput, 'annotations')
  const images = parseJSON<Images>(getInput, 'images')
  const actions = parseJSON<Actions>(getInput, 'actions')

  if (!actionURL && (conclusion === Conclusion.ActionRequired || actions)) {
    throw new Error(`missing value for 'action_url'`)
  }

  if ((!output || !output.summary) && (annotations || images)) {
    throw new Error(`missing value for 'output.summary'`)
  }

  return Object.entries({
    id,
    name,
    status,
    conclusion,
    actionURL,
    output,
    annotations,
    images,
    actions,
  }).reduce((a, [k, v]) => (v ? {...a, [k]: v} : a), {}) as CheckRun
}

export const parseInputs = (getInput: GetInput): Input => {
  const globalContext: GlobalContext = process.env[envVariableName]
    ? JSON.parse(process.env[envVariableName] as string)
    : {collections: []}

  const collectionFromInput = getInput('collection')
  const collection = collectionFromInput || 'default'

  const token = getInput('token', {required: true})
  const failOnError = getInput('fail-on-error') === 'true' || false
  const failOnNeutral = getInput('fail-on-neutral') === 'true' || false

  const defaults = parseCheckRun(getInput)

  const incomingCheckRuns = parseJSON<CheckRun[]>(getInput, 'checks') || []

  if (incomingCheckRuns.length === 0 && defaults.id) {
    incomingCheckRuns.push(defaults)
  }

  const push = (newCollection: string): NamedCheckRunCollection => {
    const newNamedCheckRunCollection: NamedCheckRunCollection = {
      collection: newCollection,
      checkRuns: [],
    }

    globalContext.collections.push(newNamedCheckRunCollection)

    return newNamedCheckRunCollection
  }

  const namedCheckRunCollection: NamedCheckRunCollection =
    globalContext.collections.find(
      existingCollection => existingCollection.collection === collection,
    ) ?? push(collection)

  const collectedCheckRuns: CollectedCheckRun[] = []

  let fail = false

  if (incomingCheckRuns.length > 0) {
    for (const incomingCheckRun of incomingCheckRuns) {
      if (incomingCheckRun.conclusion === Conclusion.Skipped) {
        // We skip this conclusion as we do not actually have a way to deal
        // with the Skipped conclusion. (API limitation)
        continue
      }

      if (incomingCheckRun.conclusion === Conclusion.Neutral && failOnNeutral) {
        fail = true
      }

      if (
        incomingCheckRun.conclusion &&
        ![Conclusion.Success, Conclusion.Neutral].includes(
          incomingCheckRun.conclusion,
        ) &&
        failOnError
      ) {
        fail = true
      }

      const existingCheckRun = namedCheckRunCollection.checkRuns.find(
        existing => existing.id === incomingCheckRun.id,
      )

      if (existingCheckRun) {
        const updatedCheckRun = Object.assign(
          existingCheckRun,
          incomingCheckRun,
        )

        collectedCheckRuns.push({
          collection,
          checkRun: updatedCheckRun,
        })
      } else {
        const newCheckRun = Object.assign({}, defaults, incomingCheckRun)

        collectedCheckRuns.push({
          collection,
          checkRun: newCheckRun,
        })

        namedCheckRunCollection.checkRuns.push(newCheckRun)
      }
    }
  } else {
    if (!defaults.conclusion) {
      throw new Error(`missing conclusion for global cleanup operation`)
    }

    if (!defaults.status) {
      defaults.status = Status.Completed
    }

    if (defaults.status !== Status.Completed) {
      throw new Error(
        `invalid status '${defaults.status}'; must be empty or must be '${Status.Completed}`,
      )
    }

    if (collectionFromInput) {
      for (const checkRun of namedCheckRunCollection.checkRuns) {
        if (checkRun.conclusion) {
          continue
        }

        Object.assign(checkRun, defaults)

        delete checkRun.status

        collectedCheckRuns.push({
          collection,
          checkRun,
        })
      }
    } else {
      for (const namedCheckRunCollectionOfAll of globalContext.collections) {
        for (const checkRun of namedCheckRunCollectionOfAll.checkRuns) {
          if (checkRun.conclusion) {
            continue
          }

          Object.assign(checkRun, defaults)

          delete checkRun.status

          collectedCheckRuns.push({
            collection: namedCheckRunCollectionOfAll.collection,
            checkRun,
          })
        }
      }
    }
  }

  return {
    globalContext,
    runContext: {
      token,
      collectedCheckRuns,
      fail,
    },
  }
}
