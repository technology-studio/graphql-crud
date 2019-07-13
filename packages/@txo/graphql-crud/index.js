/**
 * @Author: Erik Slovak <erik.slovak@technologystudio.sk>
 * @Date: 2019-07-13T11:07:14+02:00
 * @Copyright: Technology Studio
 * @flow
**/

import {
  type KeyValueMap,
  createMutationDataMapper,
  updateMutationDataMapper,
  upsertMutationVariablesMapper,
  oneToOneRelationValueMap,
} from './Api/MutationVariablesMappers'
import {
  NEW_ID,
  isIdValid,
} from './Api/EntityHelper'

export type {
  KeyValueMap,
}

export {
  createMutationDataMapper,
  updateMutationDataMapper,
  upsertMutationVariablesMapper,
  oneToOneRelationValueMap,
  NEW_ID,
  isIdValid,
}
