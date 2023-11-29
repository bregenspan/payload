import { promise } from './promise'

export const traverseRichText = ({
  apiRoute,
  depth,
  incomingData,
  populationPromises,
  result,
  serverURL,
}: {
  apiRoute: string
  depth: number
  incomingData: any
  populationPromises: Promise<any>[]
  result: any
  serverURL: string
}): any => {
  if (Array.isArray(incomingData)) {
    if (!result) {
      result = []
    }

    result = incomingData.map((item, index) => {
      if (!result[index]) {
        result[index] = item
      }

      return traverseRichText({
        apiRoute,
        depth,
        incomingData: item,
        populationPromises,
        result: result[index],
        serverURL,
      })
    })
  } else if (incomingData && typeof incomingData === 'object') {
    if (!result) {
      result = {}
    }

    // Remove keys from `result` that do not appear in `incomingData`
    // There's likely another way to do this,
    // But recursion and references make this very difficult
    Object.keys(result).forEach((key) => {
      if (!(key in incomingData)) {
        delete result[key]
      }
    })

    // Iterate over the keys of `incomingData` and populate `result`
    Object.keys(incomingData).forEach((key) => {
      if (!result[key]) {
        // Instantiate the key in `result` if it doesn't exist
        // Ensure its type matches the type of the `incomingData`
        // We don't have a schema to check against here
        result[key] =
          incomingData[key] && typeof incomingData[key] === 'object'
            ? Array.isArray(incomingData[key])
              ? []
              : {}
            : incomingData[key]
      }

      const isRelationship = key === 'value' && 'relationTo' in incomingData

      if (isRelationship) {
        const needsPopulation = !result.value || typeof result.value !== 'object'

        if (needsPopulation) {
          populationPromises.push(
            promise({
              id: incomingData[key],
              accessor: 'value',
              apiRoute,
              collection: incomingData.relationTo,
              depth,
              ref: result,
              serverURL,
            }),
          )
        }
      } else {
        result[key] = traverseRichText({
          apiRoute,
          depth,
          incomingData: incomingData[key],
          populationPromises,
          result: result[key],
          serverURL,
        })
      }
    })
  } else {
    result = incomingData
  }

  return result
}