const fs = require('fs')
const N3Parser = require('rdf-parser-n3')
const NTriplesSerializer = require('rdf-serializer-ntriples')
const glob = require('glob')
const path = require('path')
const rdf = require('rdf-ext')
const shell = require('shelljs')
const url = require('url')

const baseUrl = 'http://localhost:8080/'

const files = glob.sync('data/**/*.ttl').map((filename) => {
  const folderPath = path.dirname(filename)
  const filePath = path.basename(filename, path.extname(filename))

  const iri = url.resolve(baseUrl, path.join(folderPath, filePath))

  return {
    filename: filename,
    iri: iri
  }
})

function createNTriples (dataset) {
  const output = fs.createWriteStream('dist/tbbt.nt')
  const serializer = new NTriplesSerializer()

  return rdf.waitFor(serializer.import(rdf.graph(dataset).toStream()).pipe(output))
}

function createNQuads (dataset) {
  const output = fs.createWriteStream('dist/tbbt.nq')
  const serializer = new NTriplesSerializer()

  return rdf.waitFor(serializer.import(dataset.toStream()).pipe(output))
}

Promise.all(files.map((file) => {
  const input = fs.createReadStream(file.filename)

  return rdf.dataset().import(N3Parser.import(input, {factory: rdf, baseIRI: file.iri})).then((graph) => {
    return graph.map((t) => {
      return rdf.quad(t.subject, t.predicate, t.object, rdf.namedNode(file.iri))
    })
  })
})).then((result) => {
  const dataset = rdf.dataset()

  result.forEach((graph) => {
    dataset.addAll(graph)
  })

  return dataset
}).then((dataset) => {
  shell.rm('-rf', 'dist')
  shell.mkdir('-p', 'dist')

  return Promise.all([
    createNTriples(dataset),
    createNQuads(dataset)
  ])
}).catch((error) => {
  console.error(error.stack)
})
