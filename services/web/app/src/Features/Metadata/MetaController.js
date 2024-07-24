const OError = require('@overleaf/o-error')
const EditorRealTimeController = require('../Editor/EditorRealTimeController')
const MetaHandler = require('./MetaHandler')
const logger = require('@overleaf/logger')
const { expressify } = require('@overleaf/promise-utils')

async function getMetadata(req, res) {
  const { project_id: projectId } = req.params

  logger.debug({ projectId }, 'getting all labels for project')

  let projectMeta
  try {
    projectMeta = await MetaHandler.promises.getAllMetaForProject(projectId)
  } catch (error) {
    throw OError.tag(
      error,
      '[MetaController] error getting all labels from project',
      {
        project_id: projectId,
      }
    )
  }

  res.json({ projectId, projectMeta })
}

async function broadcastMetadataForDoc(req, res) {
  const { project_id: projectId } = req.params
  const { doc_id: docId } = req.params
  const { broadcast } = req.body

  logger.debug({ projectId, docId, broadcast }, 'getting labels for doc')

  let docMeta
  try {
    docMeta = await MetaHandler.promises.getMetaForDoc(projectId, docId)
  } catch (error) {
    throw OError.tag(error, '[MetaController] error getting labels from doc', {
      project_id: projectId,
      doc_id: docId,
    })
  }

  // default to broadcasting, unless explicitly disabled (for backwards compatibility)
  if (broadcast === false) {
    return res.json({ docId, meta: docMeta })
  }

  EditorRealTimeController.emitToRoom(projectId, 'broadcastDocMeta', {
    docId,
    meta: docMeta,
  })

  res.sendStatus(200) // 204?
}

module.exports = {
  getMetadata: expressify(getMetadata),
  broadcastMetadataForDoc: expressify(broadcastMetadataForDoc),
}
