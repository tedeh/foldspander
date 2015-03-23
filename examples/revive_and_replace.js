var Foldspander = require(__dirname + '/../');
var should = require('should');

var foldspander = new Foldspander({native: true});
var obj = {id: 123, created_at: new Date()};

var str = JSON.stringify(obj, foldspander.getReplacer());
var exp = JSON.parse(str, foldspander.getReviver());

exp.should.eql(obj);
