var
  fs = require('fs'),
  glob = require('glob'),
  path = require('path'),
  rdf = require('rdf-interfaces'),
  Promise = require('es6-promise').Promise;

require('rdf-ext')(rdf);

var
  files,
  graphs = {},
  singleGraph = rdf.createGraph(),
  parser = new rdf.promise.Parser(new rdf.TurtleParser());


files = glob.sync('data/**/*.ttl').map(function (filename) {
  var iri = 'http://localhost:8080/' +
    path.dirname(filename) + '/'+
    path.basename(filename, path.extname(filename));

  return {filename: filename, iri: iri};
});


Promise.all(
  files.map(function (file) {
    return parser.parse(fs.readFileSync(file.filename).toString(), file.iri)
      .then(function (graph) {
        return graphs[file.iri] = graph;
      })})
  )
  .then(function (result) {
    result.forEach(function (graph) {
      singleGraph.addAll(graph);
    });
  })
  .then(function () {
    // build N-Triples single graph
    fs.writeFileSync('dist/tbbt.nt', singleGraph.toString());
  })
  .catch(function (error) {
    console.error(error.stack);
  });


// build N-Quads
//TODO

// build JSON-LD single graph
//TODO

// build JSON-LD
//TODO