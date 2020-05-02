import * as cp from 'child_process'
import * as path from 'path'
import {
  CheckRun,
  Conclusion,
  GlobalContext,
  Status,
} from '../src/namespaces/Inputs'

const ip = path.join(__dirname, '..', 'lib', 'main.js')

// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
const action = require(ip)

function run(env?: NodeJS.ProcessEnv | undefined): Buffer {
  const options: cp.ExecSyncOptions = {
    env: {...process.env, ...(env ? env : {})},
  }

  try {
    const buffer = cp.execSync(`node ${ip}`, options)

    console.log(buffer.toString())

    return buffer
  } catch (e) {
    console.log(e.output.toString())

    throw e
  }
}

const testScenarioJustPhp: GlobalContext = {
  collections: [
    {
      collection: 'php',
      checkRuns: [
        {id: 'phpunit', name: 'PHPUnit', status: Status.Queued},
        {id: 'psalm', name: 'Psalm', status: Status.Queued},
        {id: 'phpcs', name: 'PHP_CodeSniffer', status: Status.Queued},
        {id: 'dusk', name: 'Dusk', status: Status.Queued},
      ],
    },
  ],
}

const testScenarioPhpAndNode: GlobalContext = {
  collections: [
    {
      collection: 'php',
      checkRuns: [
        {id: 'phpunit', name: 'PHPUnit', status: Status.Queued},
        {id: 'psalm', name: 'Psalm', status: Status.Queued},
        {id: 'phpcs', name: 'PHP_CodeSniffer', status: Status.Queued},
        {id: 'dusk', name: 'Dusk', status: Status.Queued},
      ],
    },
    {
      collection: 'node',
      checkRuns: [
        {id: 'eslint', name: 'ESLint', status: Status.Queued},
        {id: 'build', name: 'npm build', status: Status.Queued},
      ],
    },
  ],
}

function loadScenario(
  scenario: GlobalContext,
  cb: (scenario: GlobalContext) => GlobalContext | void,
): string {
  const rv = cb(scenario)

  return JSON.stringify(rv ? rv : scenario)
}

function actionInput(input: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.entries(input).reduce(
    (a, [k, v]) => ({...a, [`INPUT_${k.replace(/ /g, '_').toUpperCase()}`]: v}),
    {},
  )
}

function findCheckRun(
  globalContext: GlobalContext,
  collection: string,
  id: string,
): CheckRun {
  const foundCollectedCheckRun = globalContext.collections.find(
    thisCollectedCheckRun => thisCollectedCheckRun.collection === collection,
  )

  if (!foundCollectedCheckRun) {
    throw Error(`Could not find collection named '${collection}'`)
  }

  const foundCheckRun = foundCollectedCheckRun.checkRuns.find(
    thisCheckRun => thisCheckRun.id === id,
  )

  if (!foundCheckRun) {
    throw Error(`Could not find id '${id} in collection named '${collection}'`)
  }

  return foundCheckRun
}

test('it cannot run without a token', () => {
  expect(() => {
    run()
  }).toThrow()
})

test('it starts a collection', () => {
  run({
    ...actionInput({
      token: 'FOO',
      checks: JSON.stringify([
        {id: 'phpunit', name: 'PHPUnit'},
        {id: 'psalm', name: 'Psalm'},
        {id: 'phpcs', name: 'PHP_CodeSniffer'},
        {id: 'dusk', name: 'Dusk'},
      ]),
      status: 'queued',
    }),
  })
})

test('it adds a new check to a collection', () => {
  run({
    [action.envVariableName]: JSON.stringify(testScenarioJustPhp),
    ...actionInput({
      token: 'FOO',
      collection: 'php',
      checks: JSON.stringify([
        {id: 'phpunit2', name: 'PHPUnit Too!', status: 'in_progress'},
      ]),
      status: 'queued',
    }),
  })
})

test('it updates new check from a collection with checks json', () => {
  run({
    [action.envVariableName]: JSON.stringify(testScenarioJustPhp),
    ...actionInput({
      token: 'FOO',
      collection: 'php',
      checks: JSON.stringify([{id: 'phpunit', status: 'in_progress'}]),
    }),
  })
})

test('it updates new check from a collection with top-level keys', () => {
  run({
    [action.envVariableName]: JSON.stringify(testScenarioJustPhp),
    ...actionInput({
      token: 'FOO',
      collection: 'php',
      id: 'phpunit',
      status: 'in_progress',
    }),
  })
})

test('it updates all check from a collection if no id is set', () => {
  run({
    [action.envVariableName]: JSON.stringify(testScenarioJustPhp),
    ...actionInput({
      token: 'FOO',
      collection: 'php',
      conclusion: 'cancelled',
    }),
  })
})

test('it updates all check from a collection if no id is set', () => {
  run({
    [action.envVariableName]: loadScenario(testScenarioJustPhp, function(
      scenario: GlobalContext,
    ): GlobalContext | void {
      const checkRun = findCheckRun(scenario, 'php', 'phpcs')

      checkRun.conclusion = Conclusion.Success
      delete checkRun.status
    }),
    ...actionInput({
      token: 'FOO',
      collection: 'php',
      conclusion: 'cancelled',
    }),
  })
})

test('it updates all check from a collection if no id is set with multiple collections but only impacts one', () => {
  run({
    [action.envVariableName]: loadScenario(testScenarioPhpAndNode, function(
      scenario: GlobalContext,
    ): GlobalContext | void {
      const phpcs = findCheckRun(scenario, 'php', 'phpcs')

      phpcs.conclusion = Conclusion.Success
      delete phpcs.status

      const eslint = findCheckRun(scenario, 'node', 'eslint')

      eslint.conclusion = Conclusion.Success
      delete eslint.status
    }),
    ...actionInput({
      token: 'FOO',
      collection: 'php',
      conclusion: 'cancelled',
    }),
  })
})

test('it updates all check from a collection if no id is set with multiple collections and impacts all', () => {
  run({
    [action.envVariableName]: loadScenario(testScenarioPhpAndNode, function(
      scenario: GlobalContext,
    ): GlobalContext | void {
      const phpcs = findCheckRun(scenario, 'php', 'phpcs')

      phpcs.conclusion = Conclusion.Success
      delete phpcs.status

      const eslint = findCheckRun(scenario, 'node', 'eslint')

      eslint.conclusion = Conclusion.Success
      delete eslint.status
    }),
    ...actionInput({
      token: 'FOO',
      conclusion: 'cancelled',
    }),
  })
})

test('it does not fail on failure by default', () => {
  run({
    [action.envVariableName]: loadScenario(testScenarioPhpAndNode, function(
      scenario: GlobalContext,
    ): GlobalContext | void {
      // noop
    }),
    ...actionInput({
      token: 'FOO',
      id: 'phpunit',
      conclusion: 'failure',
    }),
  })
})

test('it does not fail on neutral by default', () => {
  run({
    [action.envVariableName]: loadScenario(testScenarioPhpAndNode, function(
      scenario: GlobalContext,
    ): GlobalContext | void {
      // noop
    }),
    ...actionInput({
      token: 'FOO',
      id: 'phpunit',
      conclusion: 'neutral',
    }),
  })
})

test('it fails on failure if requested', () => {
  run({
    [action.envVariableName]: loadScenario(testScenarioPhpAndNode, function(
      scenario: GlobalContext,
    ): GlobalContext | void {
      // noop
    }),
    ...actionInput({
      token: 'FOO',
      id: 'phpunit',
      conclusion: 'failure',
      'fail-on-error': 'true',
    }),
  })
})

test('it fails on neutral if requested', () => {
  run({
    [action.envVariableName]: loadScenario(testScenarioPhpAndNode, function(
      scenario: GlobalContext,
    ): GlobalContext | void {
      // noop
    }),
    ...actionInput({
      token: 'FOO',
      id: 'phpunit',
      conclusion: 'neutral',
      'fail-on-neutral': 'true',
    }),
  })
})
