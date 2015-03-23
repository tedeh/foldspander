var Foldspander = require(__dirname + '/../');
var should = require('should');

var foldspander = new Foldspander({native: true});
var obj = {id: 123, created_at: new Date()};

var str = foldspander.stringify(obj);
var exp = foldspander.parse(str);

exp.should.eql(obj);
