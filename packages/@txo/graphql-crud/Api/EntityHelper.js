/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2019-05-15T12:05:72+02:00
 * @Copyright: Technology Studio
 * @flow
**/

export const NEW_ID = 'add'

export const isIdValid = (id: ?string) => !!(id && id !== NEW_ID)
