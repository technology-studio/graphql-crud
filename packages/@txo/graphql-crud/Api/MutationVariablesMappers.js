/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2019-05-14T13:05:12+02:00
 * @Copyright: Technology Studio
 * @flow
**/

import { Log } from '@txo-peer-dep/log'
import {
  isObject,
  isEmptyObject,
} from '@txo/functional'

import { NEW_ID } from './EntityHelper'

const log = new Log('app.Modules.Common.Api.GraphQlDataMappers')

type Options = {
  +includeUnchanged?: boolean,
}

const operationModes = {
  IDENTITY: 'identity',
  CREATE: 'create',
  UPDATE: 'update',
  CONNECT: 'connect',
  CONNECT_LOCAL_ID: 'connectLocalId',
  DISCONNECT: 'disconnect',
}

const { IDENTITY, CREATE, UPDATE, CONNECT, CONNECT_LOCAL_ID, DISCONNECT } = operationModes

type OperationMode = $Values<typeof operationModes>

export type KeyValueMap = {
  [string]: (mode: OperationMode, key: string, value: any, initial: any, current: any) => { key?: ?string, value?: any},
}

const ignoredKeyList = ['__typename', 'id']

const wrap = (mode: OperationMode, value) => {
  switch (mode) {
    case IDENTITY:
      return value
    case CREATE:
      return value && { create: value }
    case UPDATE:
      return value && { update: value }
    case CONNECT:
      return value && { connect: { id: value.id } }
    case CONNECT_LOCAL_ID:
      return value && { connect: { localId: value.localId } }
    case DISCONNECT:
      return value && { disconnect: true }
  }
}

const mergedKeys = (left, right) => Object.keys({
  ...left,
  ...right,
})

const operationDataMapper = <DATA: {}>(
  initialData?: DATA,
  data?: DATA,
  mode: OperationMode,
  ignoredKeyList?: string[],
  keyValueMap?: KeyValueMap,
  options?: Options,
  key?: string,
) => {
  log.debug(`operationDataMapper ${key || 'ROOT'}`, { initialData, data, keyValueMap, ignoredKeyList })
  const outputData = mergedKeys(initialData, data).reduce((outputData, key) => {
    const initial = initialData && initialData[key]
    const current = data && data[key]
    const mapper = keyValueMap && keyValueMap[key]
    const _mode = mapper ? IDENTITY : mode
    var output = isObject(current) || isObject(initial)
      ? wrap(_mode, operationDataMapper(initial, current, _mode, mapper ? undefined : ignoredKeyList, keyValueMap, options, key))
      : ((current != initial || options?.includeUnchanged) && (!ignoredKeyList || ignoredKeyList.indexOf(key) === -1)) // eslint-disable-line eqeqeq
        ? current
        : undefined
    log.debug(`output ${key}`, { output, current, initial, key, mapper })
    if (mapper) {
      log.debug(`before mapper ${key}`, { outputData })
      const { key: nextKey, value: nextValue } = mapper(mode, key, output, initial, current)
      if (nextKey !== null) {
        outputData[nextKey ?? key] = nextValue
      }
      log.debug(`after mapper ${key}`, { outputData, nextKey, nextValue })
    } else {
      if (output) {
        outputData[key] = output
      }
    }

    return outputData
  }, {})
  log.debug(`operationDataMapper result ${key || 'ROOT'}`, { outputData })
  return isEmptyObject(outputData) ? undefined : outputData
}

export const createMutationDataMapper = <DATA: {}>(initialData?: DATA, data: DATA, keyValueMap?: KeyValueMap) => (
  operationDataMapper(initialData, data, CREATE, ignoredKeyList, keyValueMap, { includeUnchanged: true })
)

export const updateMutationDataMapper = <DATA: {}>(initialData?: DATA, data: DATA, keyValueMap?: KeyValueMap) => (
  operationDataMapper(initialData, data, UPDATE, [...ignoredKeyList, 'localId'], keyValueMap)
)

export const upsertMutationVariablesMapper = <DATA: {}>(id?: string, initialData?: DATA, data: DATA, keyValueMap?: KeyValueMap) => {
  const createData = operationDataMapper(initialData, data, CREATE, ignoredKeyList, keyValueMap, { includeUnchanged: true })
  const updateData = operationDataMapper(initialData, data, UPDATE, ignoredKeyList, keyValueMap)
  log.debug('upsertMutationVariablesMapper', { updateData })
  return (!id || updateData) && {
    create: createData,
    update: updateData,
    where: {
      id: id || NEW_ID,
    },
  }
}

export const oneToOneRelationValueMap = (attributeList: string[], offlineAttributeList?: string[]): KeyValueMap => (
  attributeList.reduce((keyValueMap, key) => {
    keyValueMap[key] = (mode, key, value, initial, current) => {
      log.debug('oneToOneRelationValueMap', { mode, key, value, initial, current })
      const wrappedValue = offlineAttributeList && offlineAttributeList.some(offlineAttribute => key === offlineAttribute)
        ? wrap(CONNECT_LOCAL_ID, value)
        : wrap(CONNECT, value)
      switch (mode) {
        case CREATE:
          return value
            ? { value: wrappedValue }
            : { key: null }
        case UPDATE:
          return value
            ? { value: wrappedValue }
            : initial && !current
              ? { value: wrap(DISCONNECT, initial) }
              : { key: null }
        default:
          return { value }
      }
    }
    return keyValueMap
  }, {})
)
