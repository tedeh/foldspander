var Foldspander = require(__dirname + '/../');
var should = require('should');

// a model class (loosely based on Backbone.Model)
function Model(attrs) {
  this.attributes = attrs || {};
}

// a collection of models class (loosely based on Backbone.Collection)
function Collection(models) {
  this.models = models || [];
}

var foldspander = new Foldspander({
  native: true
});

foldspander.add('collection', Foldspander.matchers.instanceof(Collection),
  function(collection) { return {models: collection.models}; },
  function(obj) { return new Collection(obj.models); }
);

foldspander.add('model', Foldspander.matchers.instanceof(Model),
  function(model) { return {attributes: model.attributes}; },
  function(obj) { return new Model(obj.attributes); }
);

var collection = new Collection([
  new Model({id: 1, created_at: new Date()}),
  new Model({id: 2, created_at: new Date()})
]);

var fld = foldspander.fold(collection);
var exp = foldspander.expand(fld);

// equal === strict equality (actually created a new object)
exp.should.eql(collection).and.not.equal(collection);

// verbose example to show that models are actually created
exp.models[0].should.be.eql(collection.models[0]).and.not.equal(collection.models[0]);
